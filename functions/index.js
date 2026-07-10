const admin = require("firebase-admin");
admin.initializeApp();

const { onDocumentCreated, onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");

// ── Helper: send a single push notification ──────────────────
async function sendPush(token, title, body, data = {}) {
  if (!token || typeof token !== "string" || token.length < 5) return null;
  try {
    const message = {
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { notification: { sound: "default", priority: "high" } },
      apns: { payload: { aps: { sound: "default", badge: 1 } } },
    };
    return await admin.messaging().send(message);
  } catch (err) {
    console.error(`Push notification failed for token ${token.slice(0, 10)}...:`, err.code || err.message);
    return null;
  }
}

// ── 1. UNIFIED TRIGGER: onNotificationCreated ────────────────
exports.onNotificationCreated = onDocumentCreated("notifications/{notifId}", async (event) => {
  const notif = event.data.data();
  const userId = notif.userId;
  if (!userId) return null;

  try {
    const userSnap = await admin.firestore().collection("users").doc(userId).get();
    if (!userSnap.exists) return null;

    const fcmToken = userSnap.data().fcmToken;
    if (!fcmToken) return null;

    return await sendPush(fcmToken, notif.title, notif.message, {
      notificationId: event.params.notifId,
      type: "IN_APP_NOTIFICATION",
    });
  } catch (err) {
    console.error("Error in onNotificationCreated push trigger:", err);
    return null;
  }
});

// ── 2. onBookingStatusChanged — status-based notifications ──────
exports.onBookingStatusChanged = onDocumentUpdated("bookings/{bookingId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const bookingId = event.params.bookingId;

  if (before.status === after.status) return null;

  const customerId = after.customerId;
  if (!customerId) return null;

  try {
    let title = "";
    let message = "";

    if (after.status === "confirmed") {
      title = "✅ Booking Confirmed!";
      message = `Great news! Your booking for ${after.venueName || "the venue"} on ${after.date} has been confirmed. You can now proceed to pay the deposit.`;
    } else if (after.status === "rejected" || after.status === "cancelled") {
      title = "❌ Booking Update";
      message = `Unfortunately, your booking request for ${after.venueName || "the venue"} on ${after.date} could not be confirmed. Please try a different date.`;
    } else if (after.status === "pending_admin" && before.status === "pending_vendor") {
      return null;
    } else {
      return null;
    }

    return await admin.firestore().collection("notifications").add({
      userId: customerId,
      title,
      message,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      bookingId,
    });
  } catch (error) {
    console.error("Error in onBookingStatusChanged trigger:", error);
    return null;
  }
});

// ── 3. onGlobalNotificationCreated — FCM multicast to all users ──
exports.onGlobalNotificationCreated = onDocumentCreated("global_notifications/{notifId}", async (event) => {
  const notifData = event.data.data();
  const title = notifData.title || "Metysara Update";
  const body = notifData.body || "A new update is available in the app.";
  const notifId = event.params.notifId;

  try {
    const usersQuery = await admin.firestore()
      .collection("users")
      .where("fcmToken", "!=", null)
      .get();

    const tokens = [];
    usersQuery.forEach((doc) => {
      const data = doc.data();
      if (data.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.length > 5) {
        tokens.push(data.fcmToken);
      }
    });

    if (tokens.length === 0) return null;

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      const result = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
      });
      succeeded += result.successCount;
      failed += result.failureCount;
    }

    await admin.firestore()
      .collection("global_notifications")
      .doc(notifId)
      .update({
        status: "sent",
        successCount: succeeded,
        failureCount: failed,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { succeeded, failed };
  } catch (error) {
    console.error("Error in onGlobalNotificationCreated:", error);
    return null;
  }
});

// ── 4. onBookingCreated — validate fields + rate-limit enforcement ──
exports.onBookingCreated = onDocumentCreated("bookings/{bookingId}", async (event) => {
  const data = event.data.data();
  const bookingId = event.params.bookingId;
  const customerId = data.customerId;
  const VALID_METHODS = ["bank", "venue"];

  if (customerId) {
    const windowStart = admin.firestore.Timestamp.fromMillis(Date.now() - 60_000);
    let recentSnap;
    try {
      recentSnap = await admin.firestore()
        .collection("bookings")
        .where("customerId", "==", customerId)
        .where("createdAt", ">=", windowStart)
        .get();
    } catch (err) {
      console.error("Rate-limit index query failed (index missing?):", err.message);
      recentSnap = { size: 0 };
    }

    if (recentSnap.size > 3) {
      console.warn(`Rate limit: user ${customerId} created ${recentSnap.size} bookings in 60s.`);

      const slotId = `${data.venueId}_${data.date}_${data.slot}`;
      await admin.firestore().collection("venue_slots").doc(slotId).delete().catch(() => {});

      await admin.firestore().collection("rate_limit_violations").add({
        customerId,
        bookingId,
        bookingCount: recentSnap.size,
        windowSeconds: 60,
        detectedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return event.data.ref.update({
        status: "cancelled",
        cancellationReason: "rate_limit",
        _flagged: true,
        _flagReason: `Rate limit exceeded: ${recentSnap.size} bookings in 60 s`,
        _flaggedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  if (!VALID_METHODS.includes(data.paymentMethod)) {
    console.warn(`Booking ${bookingId} invalid paymentMethod: "${data.paymentMethod}". Nulling.`);
    return event.data.ref.update({
      paymentMethod: null,
      _flagged: true,
      _flagReason: `Invalid paymentMethod: "${data.paymentMethod}"`,
      _flaggedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return null;
});

// ── 5. onBookingAuditLog — immutable audit trail ─────────────────
exports.onBookingAuditLog = onDocumentWritten("bookings/{bookingId}", async (event) => {
  const bookingId = event.params.bookingId;
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after  = event.data.after.exists  ? event.data.after.data()  : null;

  let eventType = "updated";
  if (!before) eventType = "created";
  else if (!after) eventType = "deleted";

  if (eventType === "updated" &&
      before.status === after.status &&
      before.paymentStatus === after.paymentStatus) {
    return null;
  }

  const pick = (d) => d ? {
    status: d.status,
    paymentStatus: d.paymentStatus,
    paymentMethod: d.paymentMethod,
  } : null;

  try {
    await admin.firestore().collection("audit_logs").add({
      entity: "booking",
      entityId: bookingId,
      eventType,
      before: pick(before),
      after: pick(after),
      customerId: (after || before)?.customerId ?? null,
      vendorId:   (after || before)?.vendorId   ?? null,
      venueId:    (after || before)?.venueId    ?? null,
      createdAt:  admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("onBookingAuditLog failed to write:", err);
  }

  return null;
});

// ── 6. onCommentWritten — recalculate venue ratings ─────────────
exports.onCommentWritten = onDocumentWritten("comments/{commentId}", async (event) => {
  const commentData = event.data.after.exists ? event.data.after.data() : event.data.before.data();
  if (!commentData || !commentData.venueId) return null;

  const venueId = String(commentData.venueId);

  try {
    const commentsSnapshot = await admin.firestore()
      .collection("comments")
      .where("venueId", "==", venueId)
      .get();

    let totalRating = 0;
    let count = 0;

    commentsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.rating) {
        totalRating += Number(data.rating);
        count++;
      }
    });

    const avgRating = count > 0 ? Math.round((totalRating / count) * 10) / 10 : 0;

    console.log(`Updating venue ${venueId} with ${count} reviews and ${avgRating} rating.`);

    return await admin.firestore().collection("venues").doc(venueId).update({
      reviews: count,
      rating: avgRating
    });
  } catch (error) {
    console.error(`Failed to update rating for venue ${venueId}:`, error);
    return null;
  }
});

// ── 7. searchVenues — server-side callable search ───────────────
exports.searchVenues = onCall({ maxInstances: 10 }, async (request) => {
  const {
    city, category, subType, minPrice, maxPrice,
    minCapacity, sortBy, pageSize = 20, startAfterId
  } = request.data;

  let q = admin.firestore().collection("venues");

  if (city)        q = q.where("zone", "==", city);
  if (category)    q = q.where("type", "==", category);
  if (subType)     q = q.where("subType", "==", subType);
  if (minPrice)    q = q.where("price", ">=", minPrice);
  if (maxPrice)    q = q.where("price", "<=", maxPrice);
  if (minCapacity) q = q.where("capacity", ">=", minCapacity);

  const orderField = sortBy === "price_asc" || sortBy === "price_desc" ? "price" : "rating";
  const orderDir = sortBy === "price_asc" ? "asc" : "desc";
  q = q.orderBy(orderField, orderDir);
  q = q.limit(pageSize);

  if (startAfterId) {
    const lastDoc = await admin.firestore().collection("venues").doc(startAfterId).get();
    q = q.startAfter(lastDoc);
  }

  const snap = await q.get();
  return {
    venues: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDocId: snap.docs[snap.docs.length - 1]?.id ?? null,
    hasMore: snap.docs.length === pageSize,
  };
});
