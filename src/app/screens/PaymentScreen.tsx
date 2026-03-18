import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useVenues } from '../contexts/VenuesContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, CreditCard, Wallet, Shield, Lock } from 'lucide-react';

export function PaymentScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  
  const totalAmountParam = Number(searchParams.get('amount')) || 0;
  const depositAmountParam = Number(searchParams.get('deposit')) || 0;
  const dateParam = searchParams.get('date');
  const slotParam = searchParams.get('slot');

  const { getVenueById } = useVenues();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const venue = getVenueById(id || '');
  
  if (!venue) {
    return <div className="p-8 text-center text-muted-foreground">Loading payment details...</div>;
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      if (!userData) {
        alert("You must be logged in to book.");
        setIsProcessing(false);
        return;
      }

      // Verify availability one last time to prevent double-booking
      const q = query(
        collection(db, 'bookings'),
        where('venueId', '==', venue.id),
        where('date', '==', dateParam),
        where('slot', '==', slotParam)
      );
      
      const snapshot = await getDocs(q);
      const activeBookings = snapshot.docs.filter(d => {
         const status = d.data().status;
         return ['pending_vendor', 'pending_admin', 'confirmed'].includes(status);
      });
      
      if (activeBookings.length > 0) {
        alert('We apologise, but this time slot was just booked by another user. Your card was not charged. Please select a different time or date.');
        setIsProcessing(false);
        navigate(-2); // Go back to venue detail screen
        return;
      }

      await addDoc(collection(db, 'bookings'), {
        customerId: userData.uid,
        customerName: userData.name,
        customerPhone: userData.phone || phoneNumber,
        vendorId: venue.ownerId,
        venueId: venue.id,
        venueName: venue.name,
        date: dateParam,
        slot: slotParam,
        totalAmount: totalAmountParam,
        depositPaid: depositAmountParam,
        status: 'pending_vendor',
        createdAt: serverTimestamp()
      });

      setIsProcessing(false);
      navigate(`/confirmation/${id}`);
    } catch (error: any) {
      console.error("Booking error:", error);
      alert("Failed to process booking test: " + error.message);
      setIsProcessing(false);
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
            <h2 className="text-xl">Payment</h2>
            <p className="text-sm text-muted-foreground">Secure Checkout</p>
          </div>
          <Shield className="h-5 w-5 text-green-600" />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Deposit Amount */}
        <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <p className="text-sm mb-2 opacity-90">Deposit Due Today (20%)</p>
          <p className="text-4xl mb-1">{depositAmountParam.toLocaleString()} EGP</p>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Lock className="h-4 w-4" />
            <span>Secure Payment</span>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Payment Method</h3>
          
          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'card' | 'wallet')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="card" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Card
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Mobile Wallet
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-sm mb-2">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                    className="h-14 pl-12 bg-input-background rounded-xl"
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm mb-2">Cardholder Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="h-14 bg-input-background rounded-xl"
                />
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Expiry Date</label>
                  <Input
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    maxLength={5}
                    className="h-14 bg-input-background rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">CVV</label>
                  <Input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={3}
                    className="h-14 bg-input-background rounded-xl"
                  />
                </div>
              </div>

              {/* Supported Cards */}
              <div className="flex items-center gap-3 pt-2">
                <p className="text-sm text-muted-foreground">We accept:</p>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-muted rounded text-xs">Visa</div>
                  <div className="px-3 py-1 bg-muted rounded text-xs">Mastercard</div>
                  <div className="px-3 py-1 bg-muted rounded text-xs">Amex</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-4">
              {/* Mobile Wallet Options */}
              <div className="space-y-3">
                <button className="w-full p-4 border-2 border-border rounded-xl hover:border-primary transition-colors flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">Vodafone Cash</p>
                    <p className="text-sm text-muted-foreground">Pay with Vodafone Cash</p>
                  </div>
                </button>

                <button className="w-full p-4 border-2 border-border rounded-xl hover:border-primary transition-colors flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">Orange Money</p>
                    <p className="text-sm text-muted-foreground">Pay with Orange Money</p>
                  </div>
                </button>

                <button className="w-full p-4 border-2 border-border rounded-xl hover:border-primary transition-colors flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">Fawry</p>
                    <p className="text-sm text-muted-foreground">Pay with Fawry</p>
                  </div>
                </button>
              </div>

              {/* Phone Number */}
              <div className="mt-4">
                <label className="block text-sm mb-2">Mobile Number</label>
                <Input
                  type="tel"
                  placeholder="+20 123 456 7890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-14 bg-input-background rounded-xl"
                />
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Security Notice */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-900 mb-1">
                Secure Payment
              </p>
              <p className="text-xs text-green-800">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>
          </div>
        </Card>

        {/* Payment Summary */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Venue & Services</span>
              <span>{totalAmountParam.toLocaleString()} EGP</span>
            </div>
            
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center justify-between text-lg font-bold text-primary">
                <span>Deposit Payable Now</span>
                <span>
                  {depositAmountParam.toLocaleString()} EGP
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-right">Remaining balance to be paid later directly to the venue.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 rounded-t-3xl shadow-lg">
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full h-14 text-lg rounded-xl"
          size="lg"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            `Pay Deposit ${depositAmountParam.toLocaleString()} EGP`
          )}
        </Button>
      </div>
    </div>
  );
}
