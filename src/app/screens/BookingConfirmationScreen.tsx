import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CheckCircle2, Calendar, MapPin, Users, Phone, Mail, Download } from 'lucide-react';

export function BookingConfirmationScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const bookingDetails = {
    bookingId: 'BK-2026-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    venueName: 'Grand Palace Hotel',
    venueNameAr: 'فندق جراند بالاس',
    date: 'March 15, 2026',
    guests: 100,
    location: 'Downtown Cairo, Egypt',
    totalAmount: 65000,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-12 space-y-6">
        {/* Success Icon */}
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-3xl mb-3">Booking Confirmed!</h1>
          <p className="text-muted-foreground text-lg" dir="rtl">
            تم تأكيد الحجز بنجاح!
          </p>
        </div>

        {/* Booking ID */}
        <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <p className="text-sm mb-2 opacity-90">Booking Reference</p>
          <p className="text-2xl tracking-wider">{bookingDetails.bookingId}</p>
        </Card>

        {/* Booking Details */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Booking Details</h3>
          
          <div className="space-y-4">
            {/* Venue */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Venue</p>
              <p className="text-lg">{bookingDetails.venueName}</p>
              <p className="text-sm text-muted-foreground" dir="rtl">
                {bookingDetails.venueNameAr}
              </p>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{bookingDetails.date}</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{bookingDetails.location}</p>
              </div>
            </div>

            {/* Guests */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Number of Guests</p>
                <p className="font-medium">{bookingDetails.guests} guests</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Confirmation */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Payment Confirmed</h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="text-2xl text-green-600">
              {bookingDetails.totalAmount.toLocaleString()} EGP
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Payment successful</span>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Need Help?</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors">
              <Phone className="h-5 w-5 text-primary" />
              <div className="text-left flex-1">
                <p className="font-medium">Call Support</p>
                <p className="text-sm text-muted-foreground">+20 123 456 7890</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors">
              <Mail className="h-5 w-5 text-primary" />
              <div className="text-left flex-1">
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">support@venues.eg</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Important Notice */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900 mb-2">
            📧 A confirmation email has been sent to your registered email address with all the booking details.
          </p>
          <p className="text-sm text-blue-900" dir="rtl">
            تم إرسال بريد إلكتروني للتأكيد إلى عنوان بريدك الإلكتروني المسجل مع جميع تفاصيل الحجز.
          </p>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            variant="outline"
            className="w-full h-14 text-lg rounded-xl"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Receipt
          </Button>

          <Button
            onClick={() => navigate('/profile')}
            className="w-full h-14 text-lg rounded-xl"
            size="lg"
          >
            View My Bookings
          </Button>

          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            className="w-full h-14 text-lg rounded-xl"
            size="lg"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
