import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Clock, Calendar, MapPin, Users, FileText,
  CheckCircle2, XCircle, Plus, MessageSquare,
  Bell, CreditCard, Phone, Mail, PhoneCall, ArrowRight
} from 'lucide-react';

// ── Status configuration ───────────────────────────────────────
const getStatusConfig = (status: string, t: (en: string, ar: string) => string) => {
  switch (status) {
    case 'confirmed':
      return {
        icon: CheckCircle2,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        cardBg: 'bg-green-50 border-green-200',
        textColor: 'text-green-900',
        title: t('Booking Confirmed! 🎉', 'تم تأكيد الحجز! 🎉'),
        subtitle: t('Your booking has been approved. Proceed to pay the deposit.', 'تمت الموافقة على حجزك. يمكنك الآن دفع العربون.'),
        notice: t(
          'Please pay the deposit within 24 hours to secure your booking. You can do this through your profile page.',
          'يرجى دفع العربون خلال 24 ساعة لتأمين حجزك. يمكنك ذلك من خلال صفحتك الشخصية.'
        ),
      };
    case 'rejected':
    case 'cancelled':
      return {
        icon: XCircle,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        cardBg: 'bg-red-50 border-red-200',
        textColor: 'text-red-900',
        title: t('Booking Cancelled', 'تم إلغاء الحجز'),
        subtitle: t('Unfortunately this booking could not be completed.', 'عذراً، لم يتم اكتمال هذا الحجز.'),
        notice: t(
          'If you paid a deposit, it will be refunded within 3–5 business days.',
          'إذا كنت قد دفعت عربوناً، سيتم استرداده خلال 3–5 أيام عمل.'
        ),
      };
    default: // pending_vendor / pending_admin
      return {
        icon: Clock,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        cardBg: 'bg-orange-50 border-orange-200',
        textColor: 'text-orange-900',
        title: t('Request Submitted! ✅', 'تم إرسال الطلب! ✅'),
        subtitle: t(
          'Metysara is coordinating with the venue. You\'ll be notified within 2 hours.',
          'متيسرة تتواصل مع المكان. ستصلك إشعار خلال ساعتين.'
        ),
        notice: t(
          'Once the venue confirms availability, you\'ll receive a notification to proceed with the deposit payment. No charge has been made yet.',
          'عند تأكيد المكان للتوفر، ستصلك إشعار لإكمال دفع العربون. لم يتم خصم أي مبلغ بعد.'
        ),
      };
  }
};

export function BookingConfirmationScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [booking, setBooking] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'bookings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const rootData = docSnap.data();
          let bookingData: any = { id: docSnap.id, ...rootData };

          // Fetch private details if missing from root (due to privacy refactor)
          if (!rootData.customerPhone || !rootData.customerEmail) {
            try {
              const privateSnap = await getDoc(doc(db, 'bookings', id, 'private_details', 'contact'));
              if (privateSnap.exists()) {
                const pData = privateSnap.data();
                bookingData = { 
                  ...bookingData, 
                  customerName: pData.customerName || bookingData.customerName,
                  customerPhone: pData.customerPhone || bookingData.customerPhone,
                  customerEmail: pData.customerEmail || bookingData.customerEmail,
                  notes: pData.notes || bookingData.notes,
                  services: pData.services || bookingData.services
                };
              }
            } catch (e) {
              console.log("Could not fetch private details (this is expected if not authorized):", e);
            }
          }

          setBooking(bookingData);
          if (bookingData.venueId) {
            const vRef = doc(db, 'venues', bookingData.venueId);
            const vSnap = await getDoc(vRef);
            if (vSnap.exists()) {
              setVenue({ id: vSnap.id, ...vSnap.data() });
            }
          }
        }
      } catch (e: any) {
        console.error('Error fetching booking data', e);
        setError(e?.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, retryKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">{t('Loading your booking...', 'جاري تحميل الحجز...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-destructive text-center font-bold">{error}</p>
        <Button onClick={() => { setError(null); setLoading(true); setRetryKey(k => k + 1); }}>{t('Retry', 'إعادة المحاولة')}</Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <p className="text-xl text-center mb-6">{t('Booking not found.', 'لم يتم العثور على الحجز.')}</p>
        <Button onClick={() => navigate('/home')}>{t('Back to Home', 'العودة للرئيسية')}</Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status, t);
  const StatusIcon = statusConfig.icon;
  const isPending = !['confirmed', 'rejected', 'cancelled'].includes(booking.status);
  const isConfirmed = booking.status === 'confirmed';

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return iso; }
  };

  const slotLabel = booking.slot === 'morning'
    ? t('Morning (10:00 AM – 3:00 PM)', 'صباحاً (١٠:٠٠ ص – ٣:٠٠ م)')
    : booking.slot === 'evening'
    ? t('Evening (6:00 PM – 12:00 AM)', 'مساءً (٦:٠٠ م – ١٢:٠٠ م)')
    : t('Full Day', 'اليوم كامل');

  return (
    <div className="min-h-screen bg-background pb-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="px-6 py-10 space-y-5">

        {/* ── Status Hero ───────────────────────────────────────── */}
        <div className="text-center py-6">
          <div className={`w-24 h-24 ${statusConfig.iconBg} rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg`}>
            <StatusIcon className={`w-12 h-12 ${statusConfig.iconColor} ${isPending ? 'animate-pulse' : ''}`} />
          </div>
          <h1 className="text-2xl font-bold mb-2">{statusConfig.title}</h1>
          <p className="text-muted-foreground">{statusConfig.subtitle}</p>
        </div>

        {/* ── Booking Reference ──────────────────────────────────── */}
        <Card className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none rounded-2xl shadow-lg shadow-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 uppercase tracking-widest font-bold mb-1">
                {t('Booking Reference', 'رقم مرجع الحجز')}
              </p>
              <p className="text-lg tracking-wider font-mono font-bold">#{booking.serialId || booking.id.slice(0, 12).toUpperCase()}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              isConfirmed ? 'bg-green-400/30 text-white' 
              : isPending ? 'bg-orange-400/30 text-white'
              : 'bg-red-400/30 text-white'
            }`}>
              {booking.status.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>
        </Card>

        {/* ── What Happens Next (pending only) ──────────────────── */}
        {isPending && (
          <Card className="p-5 border-none shadow-sm">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              {t('What happens next?', 'ماذا سيحدث بعد ذلك؟')}
            </h3>
            <div className="space-y-4">
              {[
                {
                  icon: PhoneCall,
                  label: t('Metysara contacts the venue', 'متيسرة تتواصل مع المكان'),
                  sub: t('We verify availability for your selected date.', 'نتحقق من توفر يومك المختار.'),
                  time: t('Now', 'الآن'),
                  done: true,
                },
                {
                  icon: Bell,
                  label: t('You get notified within 2 hours', 'تصلك إشعار خلال ساعتين'),
                  sub: t('A push notification + in-app alert will be sent.', 'إشعار وتنبيه داخل التطبيق.'),
                  time: t('≈ 2 hrs', '≈ ساعتين'),
                  done: false,
                },
                {
                  icon: CreditCard,
                  label: t('Pay the deposit to confirm', 'ادفع العربون للتأكيد'),
                  sub: t(`${booking.depositAmount?.toLocaleString() || (booking.totalAmount * 0.2).toLocaleString()} EGP deposit (20%)`, `${booking.depositAmount?.toLocaleString() || (booking.totalAmount * 0.2).toLocaleString()} ج.م عربون (20%)`),
                  time: t('After confirm', 'بعد التأكيد'),
                  done: false,
                },
              ].map(({ icon: Icon, label, sub, time, done }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${done ? 'text-green-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{label}</p>
                      <span className="text-[10px] text-muted-foreground font-bold">{time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Booking Details ────────────────────────────────────── */}
        <Card className="p-6 border-none shadow-sm">
          <h3 className="text-base font-bold mb-4">{t('Booking Details', 'تفاصيل الحجز')}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('Venue', 'المكان')}</p>
                <p className="font-bold">{language === 'ar' ? booking.venueNameAr : booking.venueName}</p>
                {venue && <p className="text-xs text-muted-foreground">{venue.location || venue.zone}</p>}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
              <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('Date & Slot', 'التاريخ والفترة')}</p>
                <p className="font-bold text-sm">{formatDate(booking.date)}</p>
                <p className="text-xs text-primary font-semibold mt-0.5">{slotLabel}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('Guests', 'الضيوف')}</p>
                <p className="font-bold">{booking.guests} {t('guests', 'ضيف')}</p>
              </div>
            </div>

            {booking.packageName && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('Package', 'الباقة')}</p>
                  <p className="font-bold">{language === 'ar' && booking.packageNameAr ? booking.packageNameAr : booking.packageName}</p>
                </div>
              </div>
            )}

            {booking.notes && (
              <div className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('Special Notes', 'ملاحظات خاصة')}</p>
                  <p className="text-sm italic">"{booking.notes}"</p>
                </div>
              </div>
            )}

            {/* Services */}
            {booking.services && booking.services.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                  <Plus className="h-3 w-3" /> {t('Selected Add-ons', 'الإضافات المختارة')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {booking.services.map((srv: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-medium capitalize">
                      {srv.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ── Contact Details ────────────────────────────────────── */}
        <Card className="p-6 border-none shadow-sm">
          <h3 className="text-base font-bold mb-3">{t('Your Contact Details', 'بياناتك للتواصل')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t('Phone', 'الهاتف')}</p>
                <p className="font-semibold">{booking.customerPhone || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t('Email', 'البريد الإلكتروني')}</p>
                <p className="font-semibold">{booking.customerEmail || '—'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Payment Summary ────────────────────────────────────── */}
        <Card className="p-6 border-none shadow-sm">
          <h3 className="text-base font-bold mb-4">{t('Cost Breakdown', 'تفصيل التكلفة')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Total Amount', 'المبلغ الإجمالي')}</span>
              <span className="font-bold">{booking.totalAmount?.toLocaleString()} {t('EGP', 'ج.م')}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <div>
                <span className="font-bold">{t('Deposit Required (20%)', 'العربون المطلوب (20%)')}</span>
                <p className="text-[10px] text-muted-foreground">
                  {isConfirmed
                    ? t('Due now to confirm your place.', 'مستحق الآن لتأكيد مكانك.')
                    : t('Due after vendor confirmation.', 'مستحق بعد تأكيد المكان.')}
                </p>
              </div>
              <span className="text-xl font-bold text-primary">
                {(booking.depositAmount || (booking.totalAmount * 0.2))?.toLocaleString()} {t('EGP', 'ج.م')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('Remaining balance (paid at venue)', 'الباقي يُدفع في المكان')}</span>
              <span>{(booking.totalAmount - (booking.depositAmount || booking.totalAmount * 0.2))?.toLocaleString()} {t('EGP', 'ج.م')}</span>
            </div>
          </div>
        </Card>

        {/* ── Notice Banner ──────────────────────────────────────── */}
        <div className={`p-4 border rounded-2xl ${statusConfig.cardBg}`}>
          <p className={`text-sm font-medium leading-relaxed ${statusConfig.textColor}`}>
            {statusConfig.notice}
          </p>
        </div>

        {/* ── Contact Support ────────────────────────────────────── */}
        <Card className="p-6 border-none shadow-sm">
          <h3 className="text-base font-bold mb-4">{t('Need Help?', 'تحتاج إلى مساعدة؟')}</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {t('Our support team is here to help you with your booking.', 'فريق الدعم الخاص بنا هنا لمساعدتك في حجزك.')}
          </p>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl justify-start font-semibold text-primary border-primary/20 hover:bg-primary/5"
              onClick={() => window.location.href = 'mailto:support@metysara.com'}
            >
              <Mail className="h-4 w-4 mr-2 ml-2" />
              {t('Email Support (support@metysara.com)', 'راسل الدعم (support@metysara.com)')}
            </Button>
            <Button
              className="w-full h-12 rounded-xl justify-start font-semibold bg-primary/10 text-primary hover:bg-primary/20 shadow-none"
              onClick={() => navigate('/chat')}
            >
              <MessageSquare className="h-4 w-4 mr-2 ml-2" />
              {t('Live Chat with Support', 'محادثة مباشرة مع الدعم')}
            </Button>
          </div>
        </Card>

        {/* ── Action Buttons ─────────────────────────────────────── */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={() => navigate('/profile?tab=bookings')}
            className="w-full h-14 text-base rounded-xl font-bold"
            size="lg"
          >
            <div className="flex items-center gap-2">
              {t('Track Booking Status', 'متابعة حالة الحجز')}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Button>

          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold"
          >
            {t('Back to Home', 'العودة للرئيسية')}
          </Button>
        </div>
      </div>
    </div>
  );
}
