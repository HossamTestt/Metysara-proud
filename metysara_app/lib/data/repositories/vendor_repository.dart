import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/vendor_model.dart';

final vendorRepositoryProvider = Provider<VendorRepository>((ref) {
  return VendorRepository(FirebaseFirestore.instance);
});

class VendorRepository {
  final FirebaseFirestore _firestore;

  VendorRepository(this._firestore);

  /// Get stream of approved and active vendors for users
  Stream<List<VendorModel>> getActiveVendorsByService(String serviceType) {
    return _firestore
        .collection('vendors')
        .where('serviceType', isEqualTo: serviceType)
        .where('isActive', isEqualTo: true)
        .where('isApproved', isEqualTo: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => VendorModel.fromJson(doc.data()..['uid'] = doc.id))
            .toList());
  }

  /// Admin operation: Toggle Vendor Approval
  Future<void> toggleVendorApproval(String vendorId, bool currentStatus) async {
    await _firestore
        .collection('vendors')
        .doc(vendorId)
        .update({'isApproved': !currentStatus});
  }

  /// Admin operation: Toggle Vendor Active state
  Future<void> toggleVendorActive(String vendorId, bool currentStatus) async {
    await _firestore
        .collection('vendors')
        .doc(vendorId)
        .update({'isActive': !currentStatus});
  }
}
