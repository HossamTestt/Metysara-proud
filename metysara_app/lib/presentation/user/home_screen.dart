import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/auth_repository.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _selectedServiceType = 'venue';

  final List<String> _serviceTypes = [
    'venue',
    'photographer',
    'videographer',
    'makeup_artist',
    'catering',
    'limousine'
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Metysara'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authRepositoryProvider).signOut(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Service Type Filter
          SizedBox(
            height: 60,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _serviceTypes.length,
              itemBuilder: (context, index) {
                final type = _serviceTypes[index];
                final isSelected = _selectedServiceType == type;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(type.toUpperCase()),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() => _selectedServiceType = type);
                      }
                    },
                  ),
                );
              },
            ),
          ),
          
          // Vendor List Placeholder
          Expanded(
            child: Center(
              child: Text(
                'Browsing vendors for: $_selectedServiceType\n(Implement Firestore stream here filtering by isActive=true & isApproved=true)',
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
