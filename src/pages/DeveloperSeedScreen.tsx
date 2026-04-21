import { useState } from 'react';
import { db, auth } from '../services/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '../components/ui/button';

export function DeveloperSeedScreen() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const seedDatabase = async () => {
    setLoading(true);
    setLog([]);
    addLog('Starting seeding process...');
    
    try {
      // Create Vendors
      const vendors = [
        { email: 'vendor1@metysaravendors.com', name: 'Elite Events Vendor', venueName: 'Grand Palace Hall' },
        { email: 'vendor2@metysaravendors.com', name: 'Royal Receptions', venueName: 'Silver Garden' },
        { email: 'vendor3@metysaravendors.com', name: 'Nile Celebrations', venueName: 'Nile View Ballroom' }
      ];

      for (const vTarget of vendors) {
        let uid = '';
        try {
          const userCred = await createUserWithEmailAndPassword(auth, vTarget.email, 'password123');
          uid = userCred.user.uid;
        } catch (e: any) {
          addLog(`Error or already exists: ${vTarget.email}. Skipping user creation.`);
          continue;
        }

        await setDoc(doc(db, 'users', uid), {
          uid,
          email: vTarget.email,
          name: vTarget.name,
          phone: '01012345678',
          role: 'vendor',
          venueName: vTarget.venueName
        });
        addLog(`Created Vendor: ${vTarget.email}`);

        // Create Venue
        const venueId = 'venue_' + Date.now() + Math.floor(Math.random() * 1000);
        await setDoc(doc(db, 'venues', venueId), {
          id: venueId,
          ownerId: uid,
          name: vTarget.venueName,
          nameAr: vTarget.venueName + ' قاعة',
          description: 'A beautiful and fully equipped venue perfect for your memorable events. Features elegant lighting and spacious dance floors.',
          descriptionAr: 'قاعة جميلة ومجهزة بالكامل لحفلاتك.',
          price: Math.floor(Math.random() * 40000) + 10000,
          capacity: Math.floor(Math.random() * 300) + 100,
          location: 'Cairo, Egypt',
          zone: 'Cairo',
          images: [
            'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80'
          ],
          type: 'wedding',
          rating: 4.5 + Math.random() * 0.5,
          reviews: Math.floor(Math.random() * 100) + 10,
          availability: {},
          amenities: ['Free WiFi', 'Sound System', 'Parking'],
          packages: [
            { id: '1', name: 'Basic Flow', price: 5000, description: 'Basic sound and lighting' },
            { id: '2', name: 'Premium Flow', price: 15000, description: 'VIP entrance and dedicated catering area' }
          ]
        });
        addLog(`Created Venue for Vendor: ${vTarget.venueName}`);

        // Create a Mock Booking
        const bookingId = 'bk_' + Date.now() + Math.floor(Math.random() * 1000);
        await setDoc(doc(db, 'bookings', bookingId), {
          customerId: 'mock_customer_id',
          customerName: 'Mock Customer',
          customerPhone: '01111111111',
          vendorId: uid,
          venueId: venueId,
          venueName: vTarget.venueName,
          date: '2026-05-10',
          slot: 'evening',
          totalAmount: 45000,
          depositPaid: 9000,
          status: 'pending_vendor',
          createdAt: serverTimestamp()
        });
        addLog(`Created Mock Booking for Venue: ${vTarget.venueName}`);
      }
      
      addLog('Seeding Completed Succesfully!');
    } catch (error: any) {
      addLog(`Error during seeding: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4 text-red-600 font-bold">Developer tools: Seed Firebase</h1>
      <p className="mb-4 text-sm text-gray-700">This will create 3 vendors, 3 venues, and some mock bookings. All passwords are "password123". Make sure you have Authentication enabled in Firebase.</p>
      
      <Button onClick={seedDatabase} disabled={loading} className="w-full mb-4">{loading ? 'Seeding...' : 'Seed Now'}</Button>

      <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto font-mono text-sm border">
        {log.map((l, i) => <div key={i} className="mb-1 border-b border-gray-200 pb-1">{l}</div>)}
      </div>
    </div>
  );
}
