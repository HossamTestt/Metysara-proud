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

      // Final race-condition check before creating booking
      const q = query(collection(db, 'bookings'), where('venueId', '==', venue.id));
      const snapshot = await getDocs(q);
      const activeBookings = snapshot.docs.filter(d => {
        const data = d.data();
        const isSameSlot = data.date === dateParam && data.slot === slotParam;
        const isBlocking = ['pending_vendor', 'pending_admin', 'confirmed'].includes(data.status);
        return isSameSlot && isBlocking;
      });

      if (activeBookings.length > 0) {
        toast.error(t(
          'We apologise — this time slot was just booked by another user. Please choose a different date or slot.',
          'نعتذر — تم حجز هذه الفترة للتو من قبل مستخدم آخر. يرجى اختيار تاريخ أو فترة مختلفة.'
        ));
        setIsProcessing(false);
        navigate(-2);
        return;
      }

      // Generate Serial ID via Transaction
      const counterDocRef = doc(db, 'counters', 'booking_counters');
      const counterField = 'global_booking_count';

      let newSerialId = '';
      try {
        await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterDocRef);
          let newCount = 1;
          if (!counterDoc.exists()) {
            transaction.set(counterDocRef, { [counterField]: 1 }, { merge: true });
          } else {
            const data = counterDoc.data();
            newCount = (data[counterField] || 0) + 1;
            transaction.update(counterDocRef, { [counterField]: newCount });
          }
          // Format as 1-00001, 1-00002, etc.
          newSerialId = `1-${String(newCount).padStart(5, '0')}`;
        });
      } catch (err) {
        console.error("Transaction failed: ", err);
        newSerialId = `1-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      }

      // Create booking with pending_vendor status (no payment yet)
      // We separate public availability info (root) from private contact info (subcollection)
      const bookingRef = await addDoc(collection(db, 'bookings'), {
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
        status: 'pending_vendor', // Awaiting vendor/admin confirmation
        createdAt: serverTimestamp(),
        packageId: packageIdParam || null,
        packageName: pkg ? pkg.name : null,
        packageNameAr: pkg ? pkg.nameAr : null,
        guests: guestsParam,
      });

      // Save sensitive customer info in a private subcollection
      await addDoc(collection(db, 'bookings', bookingRef.id, 'private_details'), {
        type: 'contact',
        customerName: customerNameParam || userData.name,
        customerPhone: customerPhoneParam || userData.phone || '',
        customerEmail: customerEmailParam,
        notes: notesParam || '',
        services: servicesParam ? servicesParam.split(',').filter(Boolean) : [],
        createdAt: serverTimestamp(),
      });

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

        {/* ── How It Works Banner ───────────────────────────────── */}
        <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 border rounded-2xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t('How Booking Works', 'كيف يعمل الحجز')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('No payment is required right now.', 'لا يلزم أي دفع الآن.')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: CheckCircle2,
                step: t('1. Submit your booking request below', '١. أرسل طلب حجزك أدناه'),
                sub: t('We record your details — no payment taken yet.', 'نسجّل بياناتك — لا يتم أي خصم الآن.'),
              },
              {
                icon: PhoneCall,
                step: t('2. Metysara coordinates with the venue', '٢. متيسرة تتواصل مع المكان'),
                sub: t('We contact the vendor to confirm your selected date is available.', 'نتواصل مع المكان للتأكد من توفر التاريخ المختار.'),
              },
              {
                icon: Bell,
                step: t('3. You receive a notification within 2 hours', '٣. تصلك إشعار في غضون ساعتين'),
                sub: t('Once confirmed, you\'ll be notified and can proceed to pay the deposit.', 'عند التأكيد ستصلك رسالة ويمكنك إكمال دفع العربون.'),
              },
              {
                icon: CreditCard,
                step: t('4. Pay the deposit to secure your booking', '٤. ادفع العربون لتأمين حجزك'),
                sub: t('20% deposit required. Remaining balance paid directly at the venue.', '20% عربون مطلوب. يتم دفع الباقي مباشرة في المكان.'),
              },
            ].map(({ icon: Icon, step, sub }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{step}</p>
                  <p className="text-[11px] text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

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
              'By submitting this request, you are not charged yet. Payment will only be processed after the venue confirms your booking.',
              'بإرسال هذا الطلب، لا يتم خصم أي مبلغ الآن. سيتم الدفع فقط بعد تأكيد المكان لحجزك.'
            )}
          </p>
        </div>
      </div>

      {/* ── Bottom Bar ───────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-6 py-4 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <Button
          onClick={handleSubmitRequest}
          disabled={isProcessing || isSubmitted}
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
