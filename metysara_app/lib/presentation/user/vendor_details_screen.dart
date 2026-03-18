import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/booking_repository.dart';
import '../../domain/models/vendor_model.dart';
import '../../core/providers/auth_provider.dart';

class VendorDetailsScreen extends ConsumerStatefulWidget {
  final VendorModel vendor;

  const VendorDetailsScreen({super.key, required this.vendor});

  @override
  ConsumerState<VendorDetailsScreen> createState() => _VendorDetailsScreenState();
}

class _VendorDetailsScreenState extends ConsumerState<VendorDetailsScreen> {
  DateTime? _selectedDate;
  bool _isBooking = false;

  Future<void> _bookDate() async {
    if (_selectedDate == null) return;
    final currentUser = ref.read(currentUserDataProvider).value;
    if (currentUser == null) return;

    setState(() => _isBooking = true);
    
    try {
      final dateId = '${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}';
      await ref.read(bookingRepositoryProvider).createBooking(
        vendorId: widget.vendor.uid,
        customerId: currentUser.uid,
        bookingType: 'day', // For simplicity in this demo
        serviceId: 'service_123', // In a real app, user selects service tier
        pricing: 1000.0, // Should be fetched from selected service
        dateId: dateId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking request sent successfully!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isBooking = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.vendor.businessName)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Vendor Details Header
          Text(widget.vendor.description ?? 'No description provided.',
              style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 24),
          
          Text('Select Event Date:', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          
          // Date Availability Picker (Mock UI)
          CalendarDatePicker(
            initialDate: DateTime.now(),
            firstDate: DateTime.now(),
            lastDate: DateTime.now().add(const Duration(days: 365)),
            onDateChanged: (date) => setState(() => _selectedDate = date),
          ),
          
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedDate == null || _isBooking ? null : _bookDate,
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isBooking
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Request Booking', style: TextStyle(fontSize: 18)),
            ),
          )
        ],
      ),
    );
  }
}
