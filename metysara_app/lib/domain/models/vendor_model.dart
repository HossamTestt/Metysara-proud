import 'package:freezed_annotation/freezed_annotation.dart';

part 'vendor_model.freezed.dart';
part 'vendor_model.g.dart';

@freezed
class VendorModel with _$VendorModel {
  const factory VendorModel({
    required String uid,
    required String email,
    required String businessName,
    required String serviceType, // 'venue', 'photographer', 'videographer', 'makeup_artist', 'catering', 'limousine'
    String? description,
    String? location,
    String? contactPhone,
    String? logoUrl,
    List<String>? galleryUrls,
    @Default(false) bool isApproved,
    @Default(true) bool isActive,
    double? rating,
    int? reviewsCount,
    DateTime? createdAt,
  }) = _VendorModel;

  factory VendorModel.fromJson(Map<String, dynamic> json) => _$VendorModelFromJson(json);
}
