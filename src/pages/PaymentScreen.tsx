import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, runTransaction, doc } from 'firebase/firestore';
import { useVenues } from '../context/VenuesContext';
import { createNotification } from '../utils/notifications';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, Clock, MapPin, Calendar, Users, Package, CheckCircle2, Bell, CreditCard, PhoneCall, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export function PaymentScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userData } = useAuth();
  const { language, t } = useLanguage();
  const searchParams = new URLSearchParams(location.search);

  const totalAmountParam = Number(searchParams.get('amount')) || 0;
  const depositAmountParam = Number(searchParams.get('deposit')) || 0;
  const dateParam = searchParams.get('date');
  const slotParam = searchParams.get('slot');
  const packageIdParam = searchParams.get('package');
  const notesParam = searchParams.get('notes');
  const servicesParam = searchParams.get('services');
  const guestsParam = Number(searchParams.get('guests')) || 0;
  const customerNameParam = searchParams.get('cname') || userData?.name || '';
  const customerPhoneParam = searchParams.get('cphone') || userData?.phone || '';
  const customerEmailParam = searchParams.get('cemail') || userData?.email || currentUser?.email || '';

  const { getVenueById } = useVenues();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'venue' | null>(null);

  const venue = getVenueById(id || '');

  if (!venue) {
    return <div className="p-8 text-center text-muted-foreground">{t('Loading details...', 'جاري التحميل...')}</div>;
  }

  const pkg = venue.packages?.find(p => p.id === packageIdParam);

  const handleSubmitRequest = async () => {
    setIsProcessing(true);

    try {
      if (!currentUser || !userData) {
        toast.error(t('You must be logged in to book.', 'يجب تسجيل الدخول للحجز.'));
        setIsProcessing(false);
        return;
      }

      const phoneToValidate = customerPhoneParam || userData.phone || '';
      const phoneRegex = /^01[0125][0-9]{8}$/;
      if (!phoneRegex.test(phoneToValidate.trim())) {
        toast.error(t('Invalid Egyptian mobile number. Please update your profile or go back.', 'رقم هاتف مصري غير صحيح. يرجى تحديث ملفك الشخصي أو الرجوع.'));
        setIsProcessing(false);
        return;
      }

      // Final race-condition check & booking creation via a single Transaction
      const slotRef = doc(db, 'venue_slots', `${venue.id}_${dateParam}_${slotParam}`);
      const counterDocRef = doc(db, 'counters', 'booking_counters');
      const counterField = 'global_booking_count';
      
      const newBookingRef = doc(collection(db, 'bookings'));
      const newPrivateDetailsRef = doc(collection(db, 'bookings', newBookingRef.id, 'private_details'));

      let newSerialId = '';
      
      try {
        await runTransaction(db, async (transaction) => {
          // 1. Check if the slot is already booked
          const slotDoc = await transaction.get(slotRef);
          if (slotDoc.exists()) {
            throw new Error("ALREADY_BOOKED");
          }

          // 2. Generate Serial ID
          const counterDoc = await transaction.get(counterDocRef);
          let newCount = 1;
          if (!counterDoc.exists()) {
            transaction.set(counterDocRef, { [counterField]: 1 }, { merge: true });
          } else {
            const data = counterDoc.data();
            newCount = (data[counterField] || 0) + 1;
            transaction.update(counterDocRef, { [counterField]: newCount });
          }
          newSerialId = `1-${String(newCount).padStart(5, '0')}`;

          // 3. Lock the slot
          transaction.set(slotRef, {
            bookingId: newBookingRef.id,
            customerId: currentUser.uid,
            createdAt: serverTimestamp()
          });

          // 4. Create the booking document
          transaction.set(newBookingRef, {
            serialId: newSerialId,
            customerId: currentUser.uid,
            vendorId: venue.ownerId || null,
            venueId: venue.id,
            venueName: venue.name,
            venueNameAr: venue.nameAr,
            venueImage: venue.images[0] || null,
            date: dateParam,
            slot: slotParam,
            totalAmount: totalAmountParam,
            depositAmount: depositAmountParam,
            depositPaid: 0,           // No payment yet
            paymentStatus: 'unpaid',  // Will become 'deposit_paid' after vendor confirms and customer pays
            paymentMethod: paymentMethod,
            status: 'pending_vendor', // Awaiting vendor/admin confirmation
            createdAt: serverTimestamp(),
            packageId: packageIdParam || null,
            packageName: pkg ? pkg.name : null,
            packageNameAr: pkg ? pkg.nameAr : null,
            guests: guestsParam,
          });

          // 5. Save sensitive customer info in a private subcollection
          transaction.set(newPrivateDetailsRef, {
            type: 'contact',
            customerName: customerNameParam || userData.name,
            customerPhone: customerPhoneParam || userData.phone || '',
            customerEmail: customerEmailParam,
            notes: notesParam || '',
            services: servicesParam ? servicesParam.split(',').filter(Boolean) : [],
            createdAt: serverTimestamp(),
          });
        });
      } catch (err: any) {
        if (err.message === "ALREADY_BOOKED") {
          toast.error(t(
            'We apologise — this time slot was just booked by another user. Please choose a different date or slot.',
            'نعتذر — تم حجز هذه الفترة للتو من قبل مستخدم آخر. يرجى اختيار تاريخ أو فترة مختلفة.'
          ));
          setIsProcessing(false);
          navigate(-2);
          return;
        }
        throw err;
      }

      const bookingRef = newBookingRef;

      // Format a pretty date for the notifications
      const friendlyDate = formatDate(dateParam);
      const slotName = slotParam === 'morning' ? t('Morning', 'صباحاً') : slotParam === 'evening' ? t('Evening', 'مساءً') : t('Full Day', 'اليوم كامل');

      // Notify the customer that their request was submitted
      await createNotification(
        currentUser.uid,
        t('📋 Booking Request Submitted', '📋 تم استلام طلب حجزك'),
        t(
          `Your request for ${venue.name} on ${friendlyDate} has been received. Metysara will coordinate with the venue and notify you within 2 hours once confirmed.`,
          `تم استلام طلب حجزك في ${venue.nameAr || venue.name} بتاريخ ${friendlyDate}. ستتواصل متيسرة مع المكان وستصلك إشعار خلال ساعتين عند التأكيد.`
        )
      );

      // Notify vendor (if they have an account) that a new booking request arrived
      if (venue.ownerId) {
        await createNotification(
          venue.ownerId,
          t(`📅 New Booking Request — ${venue.name}`, `📅 طلب حجز جديد — ${venue.nameAr || venue.name}`),
          t(
            `${customerNameParam} has requested to book ${venue.name} on ${friendlyDate} (${slotName}). Please confirm availability.`,
            `${customerNameParam} طلب حجز ${venue.nameAr || venue.name} بتاريخ ${friendlyDate} (${slotName}). يرجى تأكيد التوفر.`
          )
        );
      }

      // Notify all Admins that a new booking request arrived
      try {
        const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
        for (const adminDoc of adminsSnap.docs) {
          await createNotification(
            adminDoc.id,
            '📋 New Booking Request Received',
            `${customerNameParam} has requested to book ${venue.name} on ${friendlyDate} (${slotName}). Vendor and Admins notified.`
          );
        }
      } catch (e) { console.error('Admin notification error in PaymentScreen:', e); }

      setIsProcessing(false);
      toast.success(t('Your request has been submitted. Our team will contact you within 2 hours.', 'تم تقديم طلبك. سيتواصل فريقنا معك خلال ساعتين.'));
      navigate(`/confirmation/${bookingRef.id}`);
    } catch (error: any) {
      console.error('Booking request error:', error);
      toast.error(t('Something went wrong. Please try again.', 'حدث خطأ. يرجى المحاولة مرة أخرى.') + '\n' + error.message);
      setIsProcessing(false);
    }
  };

  // ─── Format date nicely ─────────────────────────────────────
  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return iso; }
  };

  const slotLabel = slotParam === 'morning'
    ? t('Morning (10:00 AM – 3:00 PM)', 'صباحاً (١٠:٠٠ ص – ٣:٠٠ م)')
    : slotParam === 'evening'
    ? t('Evening (6:00 PM – 12:00 AM)', 'مساءً (٦:٠٠ م – ١٢:٠٠ م)')
    : t('Full Day', 'اليوم كامل');

  return (
    <div className="min-h-screen bg-background pb-36" dir={language === 'ar' ? 'rtl' : 'ltr'}>

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
            <h2 className="text-xl font-bold">{t('Confirm Your Request', 'تأكيد طلب الحجز')}</h2>
            <p className="text-sm text-muted-foreground">{language === 'ar' ? venue.nameAr : venue.name}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">

        {/* ── Payment Options ───────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg">{t('Select Payment Method', 'اختر طريقة الدفع')}</h3>
          
          <Card 
            className={`p-5 border-2 cursor-pointer transition-all ${paymentMethod === 'bank' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50'}`}
            onClick={() => setPaymentMethod('bank')}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${paymentMethod === 'bank' ? 'border-primary' : 'border-muted-foreground'}`}>
                {paymentMethod === 'bank' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
              <div>
                <h4 className="font-bold">{t('Pay Deposit by Bank Transfer', 'دفع العربون بتحويل بنكي')}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Bank: [Bank Name] — Account: [Account Number] — Name: Metysara', 'البنك: [اسم البنك] — الحساب: [رقم الحساب] — الاسم: Metysara')}
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className={`p-5 border-2 cursor-pointer transition-all ${paymentMethod === 'venue' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50'}`}
            onClick={() => setPaymentMethod('venue')}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${paymentMethod === 'venue' ? 'border-primary' : 'border-muted-foreground'}`}>
                {paymentMethod === 'venue' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
              <div>
                <h4 className="font-bold">{t('Pay at Venue', 'الدفع في المكان')}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Confirm booking with cash payment on arrival.', 'تأكيد الحجز والدفع نقداً عند الوصول.')}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Booking Summary ─────────────────────────────────── */}
        <Card className="p-6 border-none shadow-sm">
          <h3 className="text-base font-bold mb-4">{t('Booking Summary', 'ملخص الحجز')}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('Venue', 'المكان')}</p>
                <p className="font-bold">{language === 'ar' ? venue.nameAr : venue.name}</p>
                <p className="text-xs text-muted-foreground">{venue.location || venue.zone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('Date & Slot', 'التاريخ والفترة')}</p>
                <p className="font-bold">{formatDate(dateParam)}</p>
                <p className="text-xs text-primary font-semibold">{slotLabel}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('Guests', 'الضيوف')}</p>
                <p className="font-bold">{guestsParam} {t('guests', 'ضيف')}</p>
              </div>
            </div>

            {pkg && (
              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('Package', 'الباقة')}</p>
                  <p className="font-bold">{language === 'ar' ? (pkg.nameAr || pkg.name) : pkg.name}</p>
                </div>
              </div>
            )}

            {notesParam && (
              <div className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('Special Notes', 'ملاحظات خاصة')}</p>
                  <p className="text-sm">"{notesParam}"</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ── Contact Details ──────────────────────────────────── */}
        <Card className="p-6 border-none shadow-sm">
          <h3 className="text-base font-bold mb-3">{t('Your Contact Details', 'بياناتك للتواصل')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Name', 'الاسم')}</span>
              <span className="font-semibold">{customerNameParam || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Phone', 'الهاتف')}</span>
              <span className="font-semibold">{customerPhoneParam || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Email', 'البريد')}</span>
              <span className="font-semibold text-xs">{customerEmailParam || '—'}</span>
            </div>
          </div>
        </Card>

        {/* ── Price Summary ────────────────────────────────────── */}
        <Card className="p-6 border-none shadow-sm">
          <h3 className="text-base font-bold mb-4">{t('Price Summary', 'ملخص التكلفة')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Total Amount', 'المبلغ الإجمالي')}</span>
              <span className="font-bold">{totalAmountParam.toLocaleString()} {t('EGP', 'ج.م')}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">{t('Deposit (20%)', 'العربون (20%)')}</span>
                <span className="text-xl font-bold text-primary">{depositAmountParam.toLocaleString()} {t('EGP', 'ج.م')}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {t('Due only after vendor confirms your booking.', 'يُستحق فقط عند تأكيد المكان لحجزك.')}
              </p>
            </div>
          </div>
        </Card>

        {/* ── Important Notice ─────────────────────────────────── */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm text-amber-900 font-medium leading-relaxed">
            ⚠️ {t(
              'By submitting this request, your booking will be created and sent to the venue for confirmation. Our team will contact you within 2 hours.',
              'بإرسال هذا الطلب، سيتم إنشاء حجزك وإرساله للمكان للتأكيد. سيتواصل فريقنا معك خلال ساعتين.'
            )}
          </p>
        </div>
      </div>

      {/* ── Bottom Bar ───────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-6 py-4 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <Button
          onClick={handleSubmitRequest}
          disabled={isProcessing || isSubmitted || !paymentMethod}
          className="w-full h-14 text-lg rounded-xl font-bold shadow-lg shadow-primary/20"
          size="lg"
        >
          {isProcessing ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('Submitting Request...', 'جاري إرسال الطلب...')}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {t('Submit Booking Request', 'إرسال طلب الحجز')}
            </div>
          )}
        </Button>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          {t('No payment will be taken at this stage', 'لن يتم خصم أي مبلغ في هذه المرحلة')}
        </p>
      </div>
    </div>
  );
}
