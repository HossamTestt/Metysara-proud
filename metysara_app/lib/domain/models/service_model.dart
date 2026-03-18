import 'package:freezed_annotation/freezed_annotation.dart';

part 'service_model.freezed.dart';
part 'service_model.g.dart';

@freezed
class ServiceModel with _$ServiceModel {
  const factory ServiceModel({
    required String id,
    required String vendorId,
    required String name,
    required String description,
    required double basePrice,
    required String pricingType, // 'per_day', 'per_hour', 'per_guest', 'fixed'
    List<String>? includes,
    List<String>? tags,
    @Default(true) bool isAvailable,
  }) = _ServiceModel;

  factory ServiceModel.fromJson(Map<String, dynamic> json) => _$ServiceModelFromJson(json);
}
