import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { useVenues } from '../contexts/VenuesContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Calendar as CalendarIcon, Users, Plus, Minus } from 'lucide-react';

const additionalServices = [
  { id: 'photography', name: 'Professional Photography', nameAr: 'تصوير احترافي', price: 5000 },
  { id: 'decoration', name: 'Premium Decoration', nameAr: 'ديكور فاخر', price: 8000 },
  { id: 'catering', name: 'Premium Catering', nameAr: 'خدمة طعام فاخرة', price: 15000 },
  { id: 'dj', name: 'DJ & Entertainment', nameAr: 'دي جي وترفيه', price: 7000 },
  { id: 'flowers', name: 'Floral Arrangements', nameAr: 'تنسيق زهور', price: 6000 },
  { id: 'lighting', name: 'Special Lighting', nameAr: 'إضاءة خاصة', price: 4000 },
];

export function BookingFlowScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const selectedDateParam = searchParams.get('date');
  const selectedSlot = searchParams.get('slot');
  
  const { getVenueById } = useVenues();
  const [guestCount, setGuestCount] = useState(100);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const venue = getVenueById(id || '');

  if (!venue) {
    return <div className="p-8 text-center text-muted-foreground">Loading venue details...</div>;
  }

  const toggleService = (serviceId: string) => {
    const newServices = new Set(selectedServices);
    if (newServices.has(serviceId)) {
      newServices.delete(serviceId);
    } else {
      newServices.add(serviceId);
    }
    setSelectedServices(newServices);
  };

  const servicesTotal = Array.from(selectedServices).reduce((total, serviceId) => {
    const service = additionalServices.find((s) => s.id === serviceId);
    return total + (service?.price || 0);
  }, 0);

  const totalPrice = venue.price + servicesTotal;
  const depositAmount = totalPrice * 0.20; // 20% deposit

  const handleContinue = async () => {
    if (!selectedDateParam || !selectedSlot) {
      alert('Please select a date and slot from the venue page.');
      navigate(-1);
      return;
    }

    setIsChecking(true);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('venueId', '==', id),
        where('date', '==', selectedDateParam),
        where('slot', '==', selectedSlot)
      );
      
      const snapshot = await getDocs(q);
      const activeBookings = snapshot.docs.filter(d => {
         const status = d.data().status;
         return ['pending_vendor', 'pending_admin', 'confirmed'].includes(status);
      });
      
      if (activeBookings.length > 0) {
        alert('Sorry, this time slot has just been booked by another user. Please select a different time or date.');
        setIsChecking(false);
        return;
      }
      
      navigate(`/payment/${id}?amount=${totalPrice}&deposit=${depositAmount}&date=${selectedDateParam}&slot=${selectedSlot}`);
    } catch (error) {
       console.error("Error checking availability:", error);
       alert("Failed to verify slot availability. Please try again.");
    } finally {
       setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-card px-6 pt-12 pb-6 rounded-b-3xl shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl">Booking Details</h2>
            <p className="text-sm text-muted-foreground">{venue.name}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Selected Date & Slot */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg">Event Schedule</h3>
          </div>
          {selectedDateParam && selectedSlot ? (
            <div className="space-y-2">
              <p className="font-medium text-lg">
                {new Date(selectedDateParam).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-primary font-semibold capitalize bg-primary/10 inline-block px-3 py-1 rounded-full">
                {selectedSlot} Slot
              </p>
            </div>
          ) : (
            <p className="text-red-500">Error: No date or slot selected. Please go back.</p>
          )}
        </Card>

        {/* Guest Count */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg">Number of Guests</h3>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setGuestCount(Math.max(10, guestCount - 10))}
              className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <Minus className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="text-3xl mb-1">{guestCount}</p>
              <p className="text-sm text-muted-foreground">
                Max: {venue.capacity} guests
              </p>
            </div>
            <button
              onClick={() => setGuestCount(Math.min(venue.capacity, guestCount + 10))}
              className="p-3 rounded-full bg-primary hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5 text-primary-foreground" />
            </button>
          </div>
        </Card>

        {/* Additional Services */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Additional Services</h3>
          <div className="space-y-3">
            {additionalServices.map((service) => (
              <div
                key={service.id}
                className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                onClick={() => toggleService(service.id)}
              >
                <Checkbox
                  checked={selectedServices.has(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground" dir="rtl">
                    {service.nameAr}
                  </p>
                </div>
                <p className="text-primary">
                  +{service.price.toLocaleString()} EGP
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Special Notes */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Special Requests</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requirements or notes for the venue..."
            className="w-full h-32 p-4 bg-input-background rounded-xl border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Card>

        {/* Booking Summary */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Booking Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Venue Price</span>
              <span>{venue.price.toLocaleString()} EGP</span>
            </div>
            
            {Array.from(selectedServices).map((serviceId) => {
              const service = additionalServices.find((s) => s.id === serviceId);
              return service ? (
                <div key={serviceId} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{service.name}</span>
                  <span>{service.price.toLocaleString()} EGP</span>
                </div>
              ) : null;
            })}

            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center justify-between text-lg mb-2">
                <span>Total Amount</span>
                <span className="font-semibold">
                  {totalPrice.toLocaleString()} EGP
                </span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold bg-green-50 text-green-700 p-3 rounded-lg border border-green-200">
                <span>Required Deposit (20%)</span>
                <span>
                  {depositAmount.toLocaleString()} EGP
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 rounded-t-3xl shadow-lg">
        <Button
          onClick={handleContinue}
          disabled={isChecking}
          className="w-full h-14 text-lg rounded-xl"
          size="lg"
        >
          {isChecking ? 'Verifying Availability...' : 'Continue to Payment'}
        </Button>
      </div>
    </div>
  );
}
