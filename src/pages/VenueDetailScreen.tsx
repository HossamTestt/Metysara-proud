import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { db, storage } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { optimizeImage } from '../utils/imageOptimization';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useVenues } from '../context/VenuesContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  FileText,
  Share2,
  Heart,
  Star,
  MapPin,
  Users,
  Wifi,
  Utensils,
  Music,
  ParkingCircle,
  AirVent,
  Camera,
  Shield,
  ChevronLeft,
  ChevronRight,
  Upload,
  Send,
  Package,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function VenueDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVenueById, getCommentsByVenueId, addComment, savedVenues, toggleFavorite } = useVenues();
  const { language, t } = useLanguage();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<'morning' | 'evening' | 'fullDay' | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const venueId = id || '';
  const venue = getVenueById(venueId);
  const comments = getCommentsByVenueId(venueId);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const { currentUser, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const shareTo = (platform: string) => {
    if (!venue) return;
    const title = language === 'ar' ? venue.nameAr : venue.name;
    const shareUrl = `https://metysara-prod.firebaseapp.com/venues/${venueId}`;
    const text = language === 'ar' 
      ? `شاهد هذه القاعة على متيسرة: ${title}` 
      : `Check out this venue on Metysara: ${title}`;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl)
        .then(() => toast.success(language === 'ar' ? 'تم نسخ الرابط في الحافظة!' : 'Link copied to clipboard!'))
        .catch(() => toast.error(language === 'ar' ? 'حدث خطأ أثناء النسخ' : 'Error copying link'));
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const q = query(collection(db, 'bookings'), where('venueId', '==', venueId));
        const snapshot = await getDocs(q);
        const active = snapshot.docs.map(doc => doc.data()).filter(b => 
           ['pending_vendor', 'pending_admin', 'confirmed'].includes(b.status)
        );
        setActiveBookings(active);
      } catch (e) {
        console.error("Error fetching bookings for calendar", e);
      }
    };
    if (venueId) fetchBookings();
  }, [venueId]);

  if (!venue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('Venue not found', 'المكان غير موجود')}</p>
      </div>
    );
  }

  const amenities = [
    { icon: Wifi, name: 'Free WiFi', nameAr: 'واي فاي مجاني' },
    { icon: ParkingCircle, name: 'Valet Parking', nameAr: 'موقف سيارات' },
    { icon: Utensils, name: 'Catering Service', nameAr: 'خدمة طعام' },
    { icon: Music, name: 'Sound System', nameAr: 'نظام صوتي' },
    { icon: AirVent, name: 'Air Conditioning', nameAr: 'تكييف هواء' },
    { icon: Camera, name: 'Photo Booth', nameAr: 'ركن تصوير' },
    { icon: Shield, name: '24/7 Security', nameAr: 'أمن على مدار الساعة' },
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % venue.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + venue.images.length) % venue.images.length);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUser) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول لإضافة تقييم' : 'You must be logged in to submit a review.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const commentData: any = {
        venueId: venue!.id,
        userName: userData?.name || currentUser.email || 'Guest',
        rating: newRating,
        comment: newComment,
      };
      if (currentUser.photoURL) commentData.userImage = currentUser.photoURL;
      if (uploadedPhotos.length > 0) commentData.photos = uploadedPhotos;

      await addComment(commentData);
      setNewComment('');
      setNewRating(5);
      setUploadedPhotos([]);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (e: any) {
      toast.error((language === 'ar' ? 'خطأ في إرسال التقييم: ' : 'Error submitting review: ') + (e?.message || 'Please try again.'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhotos(true);
    try {
      const uploadPromises = Array.from(files).map(async (originalFile) => {
        const file = await optimizeImage(originalFile);
        const storageRef = ref(storage, `review_photos/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      });
      const urls = await Promise.all(uploadPromises);
      setUploadedPhotos(prev => [...prev, ...urls]);
    } catch (err: any) {
      toast.error((language === 'ar' ? 'فشل رفع الصورة: ' : 'Failed to upload photo: ') + (err?.message || 'Please try again.'));
    } finally {
      setIsUploadingPhotos(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // ── PERFORMANCE OPTIMIZATION (Senior Review) ──
  // Pre-calculate bookings grouped by date to avoid O(N) filtering 
  // on every day rendered by the Calendar component.
  const bookingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const b of activeBookings) {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    }
    return map;
  }, [activeBookings]);

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    if (!venue.availability) return false;

    const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0');
    const slots = venue.availability[dateStr];
    
    // Fast O(1) lookup
    const dayBookings = bookingsByDate[dateStr] || [];
    
    if (!slots) return false;
    if (slots.fullyBooked) return true;

    const morningBooked = dayBookings.some(b => b.slot === 'morning');
    const eveningBooked = dayBookings.some(b => b.slot === 'evening');
    const fullDayBooked = dayBookings.some(b => b.slot === 'fullDay');

    const morningAvailable = slots.morning && !morningBooked && !fullDayBooked;
    const eveningAvailable = slots.evening && !eveningBooked && !fullDayBooked;
    const fullAvailable = slots.fullDay && !fullDayBooked && !morningBooked && !eveningBooked;

    return !(morningAvailable || eveningAvailable || fullAvailable);
  };

  const getAvailableSlotsForDate = (date: Date | undefined): { morning?: boolean, evening?: boolean, fullDay?: boolean, fullyBooked?: boolean } => {
    if (!date) return { morning: false, evening: false, fullDay: false };
    
    const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0');
    const isWeddingOrVenue = ['wedding', 'event_hall', 'venue'].includes(venue.type);
    const baseSlots = venue.availability?.[dateStr] || { morning: isWeddingOrVenue, evening: isWeddingOrVenue, fullDay: !isWeddingOrVenue };
    
    // Fast O(1) lookup
    const dayBookings = bookingsByDate[dateStr] || [];
    
    const fullBooked = dayBookings.some(b => b.slot === 'fullDay');
    
    return {
      morning: baseSlots.morning && !dayBookings.some(b => b.slot === 'morning') && !fullBooked,
      evening: baseSlots.evening && !dayBookings.some(b => b.slot === 'evening') && !fullBooked,
      fullDay: baseSlots.fullDay && !fullBooked && !dayBookings.some(b => b.slot === 'morning' || b.slot === 'evening'),
      fullyBooked: baseSlots.fullyBooked
    };
  };

  const currentDaySlots = getAvailableSlotsForDate(selectedDate);

  return (
    <div className="min-h-screen bg-background pb-32" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Premium Image Header */}
      <div className="relative h-[55vh] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10" />
        <img
          src={venue.images[currentImageIndex] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000'}
          alt={venue.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        
        {/* Floating Controls */}
        <div className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] left-6 right-6 z-20 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl hover:bg-white/40 transition-all active:scale-90"
          >
            <ArrowLeft className={`h-5 w-5 text-white ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl hover:bg-white/40 transition-all active:scale-90">
                  <Share2 className="h-5 w-5 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl p-2 border-primary/5 shadow-2xl backdrop-blur-xl bg-card/80">
                <DropdownMenuItem onClick={() => shareTo('whatsapp')} className="rounded-xl flex gap-3 px-4 py-3"><Send className="w-4 h-4 text-green-500" /> WhatsApp</DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareTo('facebook')} className="rounded-xl flex gap-3 px-4 py-3"><FileText className="w-4 h-4 text-blue-500" /> Facebook</DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareTo('copy')} className="rounded-xl flex gap-3 px-4 py-3"><FileText className="w-4 h-4 text-primary" /> {t('Copy Link', 'نسخ الرابط')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!currentUser) {
                  toast.error(language === 'ar' ? 'يجب تسجيل الدخول' : 'Please log in to save');
                  return;
                }
                toggleFavorite(venueId);
              }}
              className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl hover:bg-white/40 transition-all active:scale-90"
            >
              <Heart className={`h-5 w-5 ${savedVenues.includes(venueId) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
          </div>
        </div>

        {/* Image Indicators & Navigation */}
        <div className="absolute bottom-10 left-6 right-6 z-20 flex justify-between items-end">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-primary rounded-lg text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/30">
                {t(venue.type.toUpperCase(), venue.type.toUpperCase())}
              </div>
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-white text-[10px] font-black">{venue.rating || 5.0}</span>
              </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter leading-none mb-2">
              {language === 'ar' ? venue.nameAr : venue.name}
            </h1>
          </div>
          <div className="flex gap-2 mb-1">
            {venue.images.length > 1 && (
              <>
                <button onClick={prevImage} className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/30 transition-all"><ChevronLeft className="w-6 h-6 text-white" /></button>
                <button onClick={nextImage} className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/30 transition-all"><ChevronRight className="w-6 h-6 text-white" /></button>
              </>
            )}
          </div>
        </div>
        
        {/* Progress Bar for Images */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
          <div 
            className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all duration-500"
            style={{ width: `${((currentImageIndex + 1) / (venue.images.length || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 relative z-10">
        <Card className="p-6 mb-6 border-none shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{language === 'ar' ? venue.nameAr : venue.name}</h1>
              <div className="flex flex-col gap-1 mt-2 mb-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{venue.location || venue.zone || (language === 'ar' ? 'الموقع غير محدد' : 'Location not specified')}</span>
                </div>
                {venue.locationLink && (
                  <a href={venue.locationLink.startsWith('http') ? venue.locationLink : `https://${venue.locationLink}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-bold hover:underline flex items-center gap-1 ml-6">
                    {language === 'ar' ? 'عرض المكان على خرائط جوجل' : 'View Venue on Google Maps'}
                  </a>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('Starting from', 'يبدأ من')}</p>
              <p className="text-2xl text-primary font-bold">
                {venue.price.toLocaleString()} <span className="text-sm font-normal">{t('EGP', 'ج.م')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 py-4 border-y border-border/50">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <div>
                <p className="text-sm font-bold leading-none">
                  {comments.length > 0
                    ? (comments.reduce((s, c) => s + (c.rating || 0), 0) / comments.length).toFixed(1)
                    : '0'}
                </p>
                <p className="text-[10px] text-muted-foreground">{comments.length} {t('reviews', 'تقييم')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold leading-none">{venue.capacity}</p>
                <p className="text-[10px] text-muted-foreground">{t('Max Guests', 'أقصى عدد')}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6 bg-muted/50 p-1 rounded-xl h-12">
            <TabsTrigger value="overview" className="text-xs">{t('Overview', 'نظرة عامة')}</TabsTrigger>
            <TabsTrigger value="packages" className="text-xs">{t('Packages', 'الباقات')}</TabsTrigger>
            <TabsTrigger value="booking" className="text-xs">{t('Booking', 'الحجز')}</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs">{t('Reviews', 'التقييمات')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6 border-none shadow-sm">
              <h3 className="text-lg font-bold mb-4">{t('About this Venue', 'عن المكان')}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {language === 'ar' ? (venue.descriptionAr || venue.description) : venue.description}
              </p>
            </Card>

            <Card className="p-6 border-none shadow-sm">
              <h3 className="text-lg font-bold mb-4">{t('Amenities', 'المميزات')}</h3>
              <div className="grid grid-cols-2 gap-4">
                {(venue.amenities || amenities.map(a => a.name)).map((amenityName, index) => {
                  const defAmenity = amenities.find(a => a.name === amenityName);
                  const Icon = defAmenity?.icon || CheckCircle2;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-xs font-medium">
                        {language === 'ar' ? (defAmenity?.nameAr || amenityName) : amenityName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {(venue.policies || venue.policiesAr) && (
              <Card className="p-6 border-none shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <FileText className="h-5 w-5 text-primary" />
                   {t('Instructions & Policies', 'التعليمات والشروط')}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                  {language === 'ar' ? (venue.policiesAr || venue.policies) : (venue.policies || venue.policiesAr)}
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            {venue.packages && venue.packages.length > 0 ? (
              venue.packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`p-5 cursor-pointer transition-all border-2 ${selectedPackageId === pkg.id ? 'border-primary bg-primary/5' : 'border-transparent'}`}
                  onClick={() => setSelectedPackageId(pkg.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-lg">{language === 'ar' ? (pkg.nameAr || pkg.name) : pkg.name}</h4>
                      <p className="text-xs text-muted-foreground">{t('Includes all standard amenities', 'يشمل جميع المميزات القياسية')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{pkg.price.toLocaleString()} <span className="text-sm">{t('EGP', 'ج.م')}</span></p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-dashed">
                    {language === 'ar' ? (pkg.descriptionAr || pkg.description) : pkg.description}
                  </p>
                  {selectedPackageId === pkg.id && (
                    <div className="mt-4 flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
                      <CheckCircle2 className="h-4 w-4" /> {t('Selected', 'مختار')}
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-12 opacity-60">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>{t('No specific packages listed.', 'لا توجد باقات محددة مدرجة.')}</p>
                <p className="text-xs mt-1">{t('Standard pricing applies.', 'يتم تطبيق التسعير القياسي.')}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="booking">
            <Card className="p-6 border-none shadow-sm">
              <h3 className="text-lg font-bold mb-4">{t('Select Event Date', 'اختر تاريخ الحدث')}</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                   setSelectedDate(d);
                   setSelectedSlot(null);
                }}
                disabled={isDateDisabled}
                className="rounded-md border-none mb-4 flex justify-center p-0"
                modifiers={{
                  fullyBooked: (date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (date < today) return false;
                    const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0');
                    // Vendor manually blocked OR all slots taken by active bookings
                    if (venue.availability?.[dateStr]?.fullyBooked) return true;
                    return isDateDisabled(date);
                  }
                }}
                modifiersClassNames={{
                  fullyBooked: "bg-red-100 text-red-600 font-bold",
                  today: "bg-transparent font-normal text-foreground"
                }}
              />

              {selectedDate && (
                <div className="space-y-4 mb-6 mt-6 pt-6 border-t">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {t('Available Time Slots', 'الفترات المتاحة')}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <>
                      {currentDaySlots.morning && (
                        <Button
                          variant={selectedSlot === 'morning' ? 'default' : 'outline'}
                          onClick={() => setSelectedSlot('morning')}
                          className="h-14 rounded-xl flex flex-col items-center justify-center gap-0.5"
                        >
                          <span className="font-bold">{t('Morning', 'صباحاً')}</span>
                          <span className="text-[10px] opacity-70">{venue.timeSlots?.morningLabel || '10:00 AM - 03:00 PM'}</span>
                        </Button>
                      )}
                      
                      {currentDaySlots.evening && (
                        <Button
                          variant={selectedSlot === 'evening' ? 'default' : 'outline'}
                          onClick={() => setSelectedSlot('evening')}
                          className="h-14 rounded-xl flex flex-col items-center justify-center gap-0.5"
                        >
                          <span className="font-bold">{t('Evening', 'مساءً')}</span>
                          <span className="text-[10px] opacity-70">{venue.timeSlots?.eveningLabel || '06:00 PM - 12:00 AM'}</span>
                        </Button>
                      )}

                      {currentDaySlots.fullDay && (
                        <Button
                          variant={selectedSlot === 'fullDay' ? 'default' : 'outline'}
                          onClick={() => setSelectedSlot('fullDay')}
                          className="h-14 col-span-2 rounded-xl"
                        >
                          {t('Full Day Booking', 'حجز اليوم بالكامل')}
                        </Button>
                      )}
                      
                      {!currentDaySlots.morning && !currentDaySlots.evening && !currentDaySlots.fullDay && (
                         <div className="col-span-2 text-center text-sm text-red-500 py-3 bg-red-50 rounded-xl">
                            {t('No slots available for this date', 'لا توجد فترات متاحة في هذا اليوم')}
                         </div>
                      )}
                    </>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            {reviewSuccess && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium">{t('Review submitted successfully! Thank you.', 'تم إرسال تقييمك بنجاح! شكراً لك.')}</p>
              </div>
            )}
            <Card className="p-6 border-none shadow-sm">
              <h3 className="text-lg font-bold mb-4">{t('Share Your Experience', 'شاركنا تجربتك')}</h3>
              
              <div className="mb-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setNewRating(star)} className="transition-transform hover:scale-110">
                      <Star className={`h-6 w-6 ${star <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('Write your review here...', 'اكتب تقييمك هنا...')}
                className="min-h-[100px] bg-muted/30 border-none rounded-xl mb-4"
                disabled={isSubmittingReview}
              />

              {/* Photo Thumbnails */}
              {uploadedPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {uploadedPhotos.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img src={url} alt={`review-photo-${idx}`} className="w-16 h-16 object-cover rounded-xl border border-border" />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="relative">
                  <Button type="button" variant="outline" size="sm" className="rounded-lg h-9" disabled={isSubmittingReview || isUploadingPhotos}>
                    {isUploadingPhotos ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        {t('Uploading...', 'جاري الرفع...')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Upload className="h-4 w-4" /> {t('Add Photos', 'إضافة صور')}
                      </span>
                    )}
                  </Button>
                  <Input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploadingPhotos} />
                </div>
                <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmittingReview || isUploadingPhotos} className="rounded-xl px-8 h-10">
                  {isSubmittingReview ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('Submitting...', 'جاري الإرسال...')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" /> {t('Submit', 'إرسال')}
                    </span>
                  )}
                </Button>
              </div>
            </Card>

            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-6 border-none shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm">{comment.userName}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(comment.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className={`h-3 w-3 ${index < comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.comment}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Booking Bar */}
      <div className="bottom-nav-bar fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('Estimated Total', 'التكلفة التقديرية')}</p>
            <p className="text-xl text-primary font-bold">
              {(selectedPackageId ? venue.packages?.find(p => p.id === selectedPackageId)?.price : venue.price)?.toLocaleString()} <span className="text-sm">{t('EGP', 'ج.م')}</span>
            </p>
          </div>
          <Button
            onClick={() => {
              if (!selectedDate || !selectedSlot) {
                // Navigate to booking tab instead of showing an alert
                setActiveTab('booking');
                return;
              }
              const dateStr = selectedDate.getFullYear() + "-" + String(selectedDate.getMonth() + 1).padStart(2, '0') + "-" + String(selectedDate.getDate()).padStart(2, '0');
              const pkgParam = selectedPackageId ? `&package=${selectedPackageId}` : '';
              navigate(`/booking/${venue.id}?date=${dateStr}&slot=${selectedSlot}${pkgParam}`);
            }}
            className="h-12 px-10 bg-primary hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            {t('Book Now', 'احجز الآن')}
          </Button>
        </div>
      </div>

      {/* Lightbox / Fullscreen Image Overlay */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <XCircle className="h-8 w-8" />
          </button>
          
          {venue.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors`}
            >
              <ChevronLeft className={`h-8 w-8 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          )}

          <img 
            src={venue.images[currentImageIndex] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000'}
            alt="Fullscreen Venue"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />

          {venue.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors`}
            >
              <ChevronRight className={`h-8 w-8 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
