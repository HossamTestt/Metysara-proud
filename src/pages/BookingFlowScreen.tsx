import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { useVenues } from '../context/VenuesContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, Calendar as CalendarIcon, Users, Plus, Minus, Package, MessageSquare, User, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

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
  const { language, t } = useLanguage();
  const searchParams = new URLSearchParams(location.search);
  
  const selectedDateParam = searchParams.get('date');
  const selectedSlot = searchParams.get('slot');
  const selectedPackageId = searchParams.get('package');

  const { getVenueById } = useVenues();
  const { currentUser, userData } = useAuth();
  const [guestCount, setGuestCount] = useState(100);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [currentPackageId, setCurrentPackageId] = useState<string | null>(selectedPackageId);

  // Customer info — pre-filled from profile, editable
  const [customerName, setCustomerName] = useState(userData?.name || '');
  const [customerPhone, setCustomerPhone] = useState(userData?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(userData?.email || currentUser?.email || '');

  const venue = getVenueById(id || '');

  if (!venue) {
    return <div className="p-8 text-center text-muted-foreground">{t('Loading venue details...', 'جاري تحميل تفاصيل المكان...')}</div>;
  }

  const selectedPackage = venue.packages?.find(p => p.id === currentPackageId);
  const packagePriceTotal = selectedPackage ? selectedPackage.price * guestCount : 0;
  const basePrice = venue.price + packagePriceTotal;
  
  // Normalize services: ensure every service has an `id` field for toggle tracking
  // We prioritize the vendor's own services if they exist (even if empty after being initialized).
  // additionalServices is only a fallback for venues that have NULL services (uninitialized).
  const rawServices = (venue.services !== undefined && venue.services !== null) ? venue.services : additionalServices;
  
  const availableServices = rawServices.map((s: any) => ({
    ...s,
    id: s.id || s.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || Math.random().toString(36).slice(2),
  }));

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
    const service = availableServices.find((s) => s.id === serviceId);
    return total + (service?.price || 0);
  }, 0);

  const totalPrice = basePrice + servicesTotal;
  const depositAmount = totalPrice * 0.20; // 20% deposit

  const handleContinue = async () => {
    if (!selectedDateParam || !selectedSlot) {
      toast.error(t('Please select a date and slot from the venue page.', 'يرجى اختيار التاريخ والفترة من صفحة المكان.'));
      navigate(-1);
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      toast.error(t('Please fill in your contact details (name, phone and email) before continuing.', 'يرجى ملء بياناتك (الاسم والهاتف والبريد) قبل المتابعة.'));
      return;
    }

    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(customerPhone.trim())) {
      toast.error(t('Please enter a valid Egyptian mobile number (e.g. 01012345678).', 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678).'));
      return;
    }

    setIsChecking(true);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('venueId', '==', id)
      );
      
      const snapshot = await getDocs(q);
      const activeBookings = snapshot.docs.filter(d => {
         const data = d.data();
         const isSameSlot = data.date === selectedDateParam && data.slot === selectedSlot;
         const isBlocking = ['pending_vendor', 'pending_admin', 'confirmed'].includes(data.status);
         return isSameSlot && isBlocking;
      });
      
      if (activeBookings.length > 0) {
        toast.error(t('Sorry, this time slot has just been booked by another user.', 'عذراً، هذه الفترة قد تم حجزها للتو من قبل مستخدم آخر.'));
        setIsChecking(false);
        return;
      }
      
      // Pass all details forward to payment
      const servicesString = Array.from(selectedServices).join(',');
      const pkgParam = currentPackageId ? `&package=${currentPackageId}` : '';
      const notesParam = notes ? `&notes=${encodeURIComponent(notes)}` : '';
      const nameParam = `&cname=${encodeURIComponent(customerName.trim())}`;
      const phoneParam = `&cphone=${encodeURIComponent(customerPhone.trim())}`;
      const emailParam = `&cemail=${encodeURIComponent(customerEmail.trim())}`;

      navigate(`/payment/${id}?amount=${totalPrice}&deposit=${depositAmount}&date=${selectedDateParam}&slot=${selectedSlot}${pkgParam}${notesParam}${nameParam}${phoneParam}${emailParam}&services=${servicesString}&guests=${guestCount}`);
    } catch (error) {
       console.error("Error checking availability:", error);
       toast.error(t("Failed to verify slot availability. Please try again.", "فشل التحقق من توفر الفترة. يرجى المحاولة مرة أخرى."));
    } finally {
       setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-card px-6 pt-12 pb-6 rounded-b-3xl shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className={`h-5 w-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{t('Booking Details', 'تفاصيل الحجز')}</h2>
            <p className="text-sm text-muted-foreground">{language === 'ar' ? venue.nameAr : venue.name}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Selected Date & Slot */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">{t('Event Schedule', 'جدول الحدث')}</h3>
          </div>
          {selectedDateParam && selectedSlot ? (
            <div className="space-y-2">
              <p className="font-medium text-lg">
                {new Date(selectedDateParam).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-primary font-bold capitalize bg-primary/10 inline-block px-4 py-1 rounded-full text-sm">
                {t(selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1), selectedSlot === 'morning' ? 'صباحاً' : 'مساءً')}
              </p>
            </div>
          ) : (
            <p className="text-red-500">{t('Error: No date or slot selected.', 'خطأ: لم يتم اختيار تاريخ أو فترة.')}</p>
          )}
        </Card>

        {/* Selectable Packages */}
        {venue.packages && venue.packages.length > 0 && (
          <Card className="p-6 border-none shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">{t('Select Package', 'اختيار الباقة')}</h3>
            </div>
            <div className="flex flex-col gap-3">
              {venue.packages.map(pkg => (
                <div 
                  key={pkg.id} 
                  onClick={() => setCurrentPackageId(pkg.id === currentPackageId ? null : pkg.id)}
                  className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition-all border ${currentPackageId === pkg.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border bg-card hover:bg-muted'}`}
                >
                  <div>
                    <p className="font-bold">{language === 'ar' ? (pkg.nameAr || pkg.name) : pkg.name}</p>
                  </div>
                  <p className="text-primary font-bold whitespace-nowrap">{pkg.price.toLocaleString()} {t('EGP / guest', 'ج.م / فرد')}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Guest Count */}
        <Card className="p-6 border-none shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">{t('Number of Guests', 'عدد الضيوف')}</h3>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setGuestCount(Math.max(10, guestCount - 10))}
              className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <Minus className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="text-3xl font-bold mb-1">{guestCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                {t('Max Capacity:', 'السعة القصوى:')} {venue.capacity}
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
        <Card className="p-6 border-none shadow-sm">
          <h3 className="text-lg font-bold mb-4">{t('Additional Services', 'خدمات إضافية')}</h3>
          <div className="space-y-3">
            {availableServices.map((service) => (
              <div
                key={service.id}
                className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${selectedServices.has(service.id) ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted/50 hover:bg-muted'}`}
                onClick={() => toggleService(service.id)}
              >
                <Checkbox
                  checked={selectedServices.has(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-bold text-sm">{language === 'ar' ? service.nameAr : service.name}</p>
                </div>
                <p className="text-primary font-bold text-sm">
                  +{service.price.toLocaleString()} {t('EGP', 'ج.م')}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Customer Contact Info */}
        <Card className="p-6 border-none shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">{t('Your Contact Details', 'بياناتك')}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {t('The venue needs this information to confirm your booking and contact you.', 'يحتاج المكان لهذه البيانات لتأكيد حجزك والتواصل معك.')}
          </p>
          <div className="space-y-3">
            <div className="relative">
              <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input
                placeholder={t('Full Name *', 'الاسم الكامل *')}
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className={`${language === 'ar' ? 'pr-10' : 'pl-10'} bg-muted/40 border-none rounded-xl h-12`}
              />
            </div>
            <div className="relative">
              <Phone className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input
                type="tel"
                placeholder={t('Phone Number *', 'رقم الهاتف *')}
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className={`${language === 'ar' ? 'pr-10' : 'pl-10'} bg-muted/40 border-none rounded-xl h-12`}
              />
            </div>
            <div className="relative">
              <Mail className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input
                type="email"
                placeholder={t('Email Address *', 'البريد الإلكتروني *')}
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                className={`${language === 'ar' ? 'pr-10' : 'pl-10'} bg-muted/40 border-none rounded-xl h-12`}
              />
            </div>
          </div>
        </Card>

        {/* Special Notes */}
        <Card className="p-6 border-none shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">{t('Special Requests', 'طلبات خاصة')}</h3>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('Any special requirements or notes for the venue...', 'أي متطلبات خاصة أو ملاحظات للمكان...')}
            className="w-full h-32 p-4 bg-input-background rounded-xl border-none focus:ring-2 focus:ring-primary/20 resize-none text-sm"
          />
        </Card>

        {/* Venue At-a-Glance */}
        <Card className="p-6 border-none shadow-sm">
          <h3 className="text-lg font-bold mb-4">{t('Venue Overview', 'نظرة عامة على المكان')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('Venue', 'المكان')}</span>
              <span className="font-bold">{language === 'ar' ? venue.nameAr : venue.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('Location', 'الموقع')}</span>
              <span className="font-bold">{venue.location || venue.zone || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('Capacity', 'السعة')}</span>
              <span className="font-bold">{venue.capacity} {t('guests', 'ضيف')}</span>
            </div>
            {venue.amenities && venue.amenities.length > 0 && (
              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">{t('Amenities Included', 'المرافق المشمولة')}</p>
                <div className="flex flex-wrap gap-2">
                  {venue.amenities.map((am: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">{am}</span>
                  ))}
                </div>
              </div>
            )}
            {venue.packages && venue.packages.length > 0 && (
              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">{t('Available Packages', 'الباقات المتاحة')}</p>
                <div className="space-y-2">
                  {venue.packages.map((pkg: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span>{language === 'ar' ? (pkg.nameAr || pkg.name) : pkg.name}</span>
                      <span className="font-bold text-primary">{pkg.price?.toLocaleString()} {t('EGP/guest', 'ج.م/فرد')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(venue.services && venue.services.length > 0) && (
              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">{t('Available Add-ons', 'الإضافات المتاحة')}</p>
                <div className="space-y-2">
                  {venue.services.map((srv: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span>{language === 'ar' ? (srv.nameAr || srv.name) : srv.name}</span>
                      <span className="font-bold text-primary">{srv.price?.toLocaleString()} {t('EGP', 'ج.م')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Booking Summary */}
        <Card className="p-6 border-none shadow-sm bg-card">
          <h3 className="text-lg font-bold mb-4">{t('Booking Summary', 'ملخص الحجز')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('Base Venue Price', 'سعر المكان الأساسي')}</span>
              <span className="font-bold">{venue.price?.toLocaleString() || 0} {t('EGP', 'ج.م')}</span>
            </div>
            
            {selectedPackage && (
               <div className="flex items-center justify-between">
                 <span className="text-muted-foreground">
                   {language === 'ar' ? selectedPackage.nameAr : selectedPackage.name} 
                   <span className="text-[10px] ml-1 opacity-70">({guestCount} {t('guests', 'ضيوف')} × {selectedPackage.price.toLocaleString()})</span>
                 </span>
                 <span className="font-bold">{packagePriceTotal.toLocaleString()} {t('EGP', 'ج.م')}</span>
               </div>
            )}
            
            {Array.from(selectedServices).map((serviceId) => {
              const service = availableServices.find((s) => s.id === serviceId);
              return service ? (
                <div key={serviceId} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{language === 'ar' ? service.nameAr : service.name}</span>
                  <span className="font-bold">+{service.price.toLocaleString()} {t('EGP', 'ج.م')}</span>
                </div>
              ) : null;
            })}

            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center justify-between text-lg mb-2">
                <span className="font-bold">{t('Total Amount', 'إجمالي المبلغ')}</span>
                <span className="font-bold text-primary">
                  {totalPrice.toLocaleString()} {t('EGP', 'ج.م')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold bg-green-50 text-green-700 p-4 rounded-xl border border-green-100">
                <span>{t('Required Deposit (20%)', 'العربون المطلوب (20%)')}</span>
                <span>
                  {depositAmount.toLocaleString()} {t('EGP', 'ج.م')}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border">
              <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked === true)} className="mt-0.5" />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="terms" className="text-sm font-medium leading-none flex flex-wrap gap-1 items-center">
                  {t('I agree to the', 'أوافق على')}
                  <button 
                    type="button" 
                    className="text-primary hover:underline font-bold"
                    onClick={(e) => { e.preventDefault(); setIsTermsModalOpen(true); }}
                  >
                     {t('Terms and Policies', 'الشروط والأحكام الخاصة بالمكان')}
                  </button>
                </label>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {t('You must read and agree to the venue rules before proceeding.', 'يجب قراءة قواعد المكان والموافقة عليها قبل المتابعة.')}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[80vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('Venue Terms & Policies', 'شروط وأحكام المكان')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="p-4 bg-muted/30 rounded-xl">
               <p className="text-sm text-foreground leading-relaxed whitespace-pre-line font-medium">
                  {language === 'ar' ? (venue.policiesAr || venue.policies || t('No policies specified.', 'لم يتم تحديد شروط.')) : (venue.policies || venue.policiesAr || t('No policies specified.', 'لم يتم تحديد شروط.'))}
               </p>
             </div>
             <Button onClick={() => { setAgreedToTerms(true); setIsTermsModalOpen(false); }} className="w-full mt-4 h-12 rounded-xl text-lg font-bold">
               {t('I Agree', 'أوافق')}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border px-6 py-4 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <Button
          onClick={handleContinue}
          disabled={isChecking || !agreedToTerms}
          className="w-full h-14 text-lg rounded-xl font-bold shadow-lg shadow-primary/20"
          size="lg"
        >
          {isChecking ? t('Verifying Availability...', 'جاري التحقق من التوفر...') : t('Continue to Payment', 'المتابعة للدفع')}
        </Button>
      </div>
    </div>
  );
}
