import 'package:freezed_annotation/freezed_annotation.dart';

part 'availability_model.freezed.dart';
part 'availability_model.g.dart';

@freezed
class AvailabilityModel with _$AvailabilityModel {
  const factory AvailabilityModel({
    required String id, // Typically matches the date e.g., YYYY-MM-DD
    required String dateString,
    @Default(true) bool isAvailable,
    List<String>? availableSlots, // for 'slot' booking type
    List<Map<String, String>>? availableIntervals, // for 'interval' booking type, e.g., [{"start": "10:00", "end": "12:00"}]
    String? reason, // e.g., 'Fully booked', 'Holiday' if isAvailable is false
  }) = _AvailabilityModel;

  factory AvailabilityModel.fromJson(Map<String, dynamic> json) => _$AvailabilityModelFromJson(json);
}
