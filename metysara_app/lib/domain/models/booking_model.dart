import 'package:freezed_annotation/freezed_annotation.dart';

part 'booking_model.freezed.dart';
part 'booking_model.g.dart';

@freezed
class BookingModel with _$BookingModel {
  const factory BookingModel({
    required String id,
    required String customerId,
    required String vendorId,
    required String serviceId,
    required String bookingType, // 'day', 'interval', 'slot'
    required String eventDateId, // e.g., 'YYYY-MM-DD'
    String? selection, // details about interval/slot if applicable
    required double pricing,
    @Default('pending') String status, // 'pending', 'accepted', 'rejected', 'completed', 'cancelled'
    @Default('unpaid') String paymentStatus, // 'unpaid', 'deposit_paid', 'fully_paid'
    DateTime? vendorResponseAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _BookingModel;

  factory BookingModel.fromJson(Map<String, dynamic> json) => _$BookingModelFromJson(json);
}
