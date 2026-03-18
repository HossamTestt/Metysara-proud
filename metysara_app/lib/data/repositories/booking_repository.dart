import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/booking_model.dart';
import '../../domain/models/availability_model.dart';

final bookingRepositoryProvider = Provider<BookingRepository>((ref) {
  return BookingRepository(FirebaseFirestore.instance);
});

class BookingRepository {
  final FirebaseFirestore _firestore;

  BookingRepository(this._firestore);

  /// Creates a booking using a transaction to avoid double booking
  Future<void> createBooking({
    required String vendorId,
    required String customerId,
    required String bookingType,
    required String serviceId,
    required double pricing,
    required String dateId, // YYYY-MM-DD
    String? selection,
  }) async {
    final vendorAvailabilityRef = _firestore
        .collection('vendors')
        .doc(vendorId)
        .collection('availability')
        .doc(dateId);
        
    final newBookingRef = _firestore.collection('bookings').doc();

    await _firestore.runTransaction((transaction) async {
      final availabilityDoc = await transaction.get(vendorAvailabilityRef);
      
      if (!availabilityDoc.exists) {
        throw Exception('Vendor availability not configured for this date.');
      }

      final availabilityData = availabilityDoc.data()!;
      if (availabilityData['isAvailable'] != true) {
        throw Exception('Vendor is not available on this date.');
      }

      // If it's a day booking, we mark the whole date as unavailable.
      // For slots/intervals, logic would differ (removing slot from array).
      if (bookingType == 'day') {
        transaction.update(vendorAvailabilityRef, {
          'isAvailable': false,
          'reason': 'Booked by $customerId',
        });
      } else if (bookingType == 'slot') {
        // Assume you remove the specific slot from availableSlots array
        transaction.update(vendorAvailabilityRef, {
          'availableSlots': FieldValue.arrayRemove([selection]),
        });
      }

      final newBooking = BookingModel(
        id: newBookingRef.id,
        customerId: customerId,
        vendorId: vendorId,
        serviceId: serviceId,
        bookingType: bookingType,
        eventDateId: dateId,
        pricing: pricing,
        selection: selection,
        status: 'pending',
        paymentStatus: 'unpaid',
      );

      transaction.set(newBookingRef, {
        ...newBooking.toJson(),
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    });
  }

  /// Vendor accepts or rejects a booking
  Future<void> updateBookingStatus(String bookingId, String newStatus) async {
    await _firestore.collection('bookings').doc(bookingId).update({
      'status': newStatus,
      'vendorResponseAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}
