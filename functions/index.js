const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

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
// This handles push notifications for EVERY in-app alert.
exports.onNotificationCreated = functions.firestore
  .document("notifications/{notifId}")
  .onCreate(async (snap, context) => {
    const notif = snap.data();
    const userId = notif.userId;
    if (!userId) return null;

    try {
      const userSnap = await admin.firestore().collection("users").doc(userId).get();
      if (!userSnap.exists) return null;

      const fcmToken = userSnap.data().fcmToken;
      if (!fcmToken) return null;

      return await sendPush(fcmToken, notif.title, notif.message, {
        notificationId: context.params.notifId,
        type: "IN_APP_NOTIFICATION",
      });
    } catch (err) {
      console.error("Error in onNotificationCreated push trigger:", err);
      return null;
    }
  });

// ── 2. status-based triggers (Internal notifications) ──────────
// These ensure that server-side changes (like admin approvals) also generate in-app and push alerts.
exports.onBookingStatusChanged = functions.firestore
  .document("bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const bookingId = context.params.bookingId;

    if (before.status === after.status) return null;

    const customerId = after.customerId;
    const vendorId = after.vendorId;
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
        // Vendor accepted, notify Admins (already handled in UI, but good to have here as backup)
        // If we want to be safe, we can add it here too.
        return null; // For now, UI handles this.
      } else {
        return null;
      }

      // Instead of sending push directly, create a notification document.
      // This will automatically trigger onNotificationCreated above!
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

// ── 3. onGlobalNotificationCreated — broadcast to all users ───
exports.onGlobalNotificationCreated = functions.firestore
  .document("global_notifications/{notifId}")
  .onCreate(async (snap, context) => {
    const notifData = snap.data();
    const title = notifData.title || "Metysara Update";
    const body = notifData.body || "A new update is available in the app.";
    const notifId = context.params.notifId;

    try {
      const usersQuery = await admin.firestore()
        .collection("users")
        .where("fcmToken", "!=", null)
        .get();

      const sendPromises = [];
      usersQuery.forEach((doc) => {
        const data = doc.data();
        if (data.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.length > 5) {
          sendPromises.push(sendPush(data.fcmToken, title, body, {
            notifId,
            type: "GLOBAL_PROMO",
          }));
        }
      });

      if (sendPromises.length === 0) return null;

      const results = await Promise.allSettled(sendPromises);
      const succeeded = results.filter((r) => r.status === "fulfilled" && r.value).length;
      const failed = results.length - succeeded;

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

// ── 4. Recalculate Venue Ratings on Comment Written ────────────
// This securely updates the venue's average rating on the server side
// preventing malicious client-side rating mutations.
exports.onCommentWritten = functions.firestore
  .document("comments/{commentId}")
  .onWrite(async (change, context) => {
    const commentData = change.after.exists ? change.after.data() : change.before.data();
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
