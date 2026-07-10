import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider as PriceSlider } from '../components/ui/slider';
import { Calendar } from '../components/ui/calendar';
import { NotificationDropdown } from '../components/ui/NotificationDropdown';
import { useLanguage } from '../context/LanguageContext';
import { useVenues } from '../context/VenuesContext';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/layout/BottomNav';
import { X } from 'lucide-react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Search,
  MapPin,
  Globe,
  Menu,
  ChevronDown,
  Star,
  Heart,
  Camera,
  Video,
  Image as ImageIcon,
  Sparkles,
  Car,
  UtensilsCrossed,
  SlidersHorizontal,
  Home,
  CalendarDays,
  User,
  Settings
} from 'lucide-react';

import { categories, egyptianCities } from '../constants';

export function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { venues, savedVenues, toggleFavorite, hasMore, loadMoreVenues } = useVenues();
  const { userData } = useAuth();
  const [filterOpen, setFilterOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filter states
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [minCapacity, setMinCapacity] = useState(0);

  const currentCityData = egyptianCities.find(c => c.name === selectedCity);
  const availableZones = currentCityData ? currentCityData.zones : [];

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (selectedCity !== 'All Cities') params.set('city', selectedCity);
    if (selectedZone !== 'All Zones') params.set('zone', selectedZone);
    if (selectedFilterCategory !== 'all') params.set('category', selectedFilterCategory);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 500000) params.set('maxPrice', priceRange[1].toString());
    if (minCapacity > 0) params.set('minCapacity', minCapacity.toString());
    
    setFilterOpen(false);
    navigate(`/search?${params.toString()}`);
  };

  // Determine greeting: first name only
  const firstName = userData?.name?.split(' ')[0] || '';
  const isReturning = (() => { try { return localStorage.getItem('metysara_has_logged_in') === 'true'; } catch { return false; } })();

  const handleSearch = () => {
    navigate('/search');
  };

  const topRatedVenues = [...venues].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
  const promotedVenues = venues.filter(v => (v as any).isPromoted).slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-28" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header Section - More Dynamic & Premium */}
      <div className="bg-gradient-to-br from-card via-card to-muted/20 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-10 rounded-b-[3.5rem] shadow-xl relative overflow-hidden border-b border-primary/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-primary/5 p-1 transition-transform hover:rotate-3">
              <img src="/logo.png" alt="Metysara" className="w-full h-auto object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">Metysara</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mt-1">Premium Events</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner hover:bg-white/80 transition-all active:scale-95"
            >
              <Globe className="h-5 w-5 text-primary" />
            </button>
            <button
              onClick={() => navigate('/profile?tab=settings')}
              className="w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner hover:bg-white/80 transition-all active:scale-95"
            >
              <Settings className="h-5 w-5 text-primary" />
            </button>
            <div className="bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-inner">
              <NotificationDropdown />
            </div>
          </div>
        </div>

        {/* Personalized Greeting */}
        <div className="mb-8 relative z-10">
          <h2 className="text-3xl font-black tracking-tighter text-foreground leading-tight">
            {firstName ? (
              <>
                {isReturning ? t('Welcome back,', 'مرحباً بعودتك،') : t('Welcome,', 'أهلاً بك،')}
                <span className="text-primary block">{firstName} 👋</span>
              </>
            ) : (
              <>
                {t('Find your perfect', 'ابحث عن')}
                <span className="text-primary block">{t('Event Venue', 'مكان مناسبتك')}</span>
              </>
            )}
          </h2>
        </div>
        {/* Search Bar */}
        <div className="relative z-10 mt-8">
          <div 
            className="flex items-center gap-4 p-5 bg-white rounded-[2.5rem] shadow-2xl border border-primary/5 cursor-pointer transition-all group"
            onClick={() => navigate('/search')}
          >
            <Search className="h-6 w-6 text-primary" />
            <div className="flex-1 text-left rtl:text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">{t('Where are you going?', 'إلى أين ستذهب؟')}</p>
              <p className="text-sm font-bold text-foreground/40">{t('Search for a venue...', 'ابحث عن قاعة...')}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setFilterOpen(true); }}
              className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center hover:bg-primary active:scale-90 transition-all"
            >
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Drawer - at root level for correct portal rendering */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="rounded-t-[3rem] border-none shadow-2xl bg-card max-h-[90vh]">
          <div className="mx-auto w-12 h-1.5 bg-muted/40 rounded-full mt-4 mb-2" />
          <DrawerHeader className="px-8 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-2xl font-black tracking-tighter">{t('Filter Venues', 'تصفية النتائج')}</DrawerTitle>
                <DrawerDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  {t('Find your perfect space', 'ابحث عن مكانك المثالي')}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <button className="w-10 h-10 bg-muted/30 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="px-8 space-y-7 overflow-y-auto scrollbar-hide py-4">
            {/* City */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">{t('Location (City)', 'الموقع (المدينة)')}</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-primary/5">
                  <SelectValue placeholder={t('Select City', 'اختر المدينة')} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="All Cities">{t('All Cities', 'جميع المدن')}</SelectItem>
                  {egyptianCities.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {language === 'ar' ? city.nameAr : city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Zone */}
            {selectedCity !== 'All Cities' && availableZones.length > 0 && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                  {t(`Zone in ${selectedCity}`, `المنطقة في ${egyptianCities.find(c => c.name === selectedCity)?.nameAr || selectedCity}`)}
                </label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-primary/5">
                    <SelectValue placeholder={t('Select Zone', 'اختر المنطقة')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="All Zones">{t('All Zones', 'جميع المناطق')}</SelectItem>
                    {availableZones.map((zone) => (
                      <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Category */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">{t('Category', 'القسم')}</label>
              <Select value={selectedFilterCategory} onValueChange={setSelectedFilterCategory}>
                <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-primary/5">
                  <SelectValue placeholder={t('Select Category', 'اختر القسم')} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">{t('All Categories', 'جميع الأقسام')}</SelectItem>
                  <SelectItem value="wedding">💒 {t('Wedding Venue', 'قاعة أفراح')}</SelectItem>
                  <SelectItem value="funeral">🕌 {t('Dar Monasbat', 'دار مناسبات')}</SelectItem>
                  <SelectItem value="event_hall">🏛️ {t('Event Hall', 'قاعة فعاليات')}</SelectItem>
                  <SelectItem value="photographer">📷 {t('Photographer', 'مصور فوتوغرافي')}</SelectItem>
                  <SelectItem value="videographer">🎥 {t('Videographer', 'مصور فيديو')}</SelectItem>
                  <SelectItem value="makeup">💄 {t('Makeup Artist', 'فنان مكياج')}</SelectItem>
                  <SelectItem value="planner">📋 {t('Wedding Planner', 'منظم أفراح')}</SelectItem>
                  <SelectItem value="decor">🌸 {t('Decor', 'ديكور')}</SelectItem>
                  <SelectItem value="hair_styling">💇 {t('Hair Styling', 'تصفيف شعر')}</SelectItem>
                  <SelectItem value="catering">🍽️ {t('Catering', 'تقديم طعام')}</SelectItem>
                  <SelectItem value="photosession">📸 {t('Photo Session Places', 'أماكن جلسات تصوير')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Price */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('Price Range', 'نطاق السعر')}</label>
                <span className="text-[10px] font-black text-primary">{priceRange[0].toLocaleString()} – {priceRange[1].toLocaleString()} EGP</span>
              </div>
              <PriceSlider min={0} max={500000} step={5000} value={priceRange} onValueChange={setPriceRange} />
            </div>
            {/* Capacity */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('Min Capacity', 'الحد الأدنى للسعة')}</label>
                <span className="text-[10px] font-black text-primary">{minCapacity} {t('guests', 'ضيوف')}</span>
              </div>
              <PriceSlider min={0} max={1000} step={50} value={[minCapacity]} onValueChange={(v) => setMinCapacity(v[0])} />
            </div>
          </div>
          <DrawerFooter className="px-8 pt-4 pb-12 gap-3">
            <Button variant="outline" onClick={() => { setSelectedCity('All Cities'); setSelectedZone('All Zones'); setSelectedFilterCategory('all'); setPriceRange([0, 500000]); setMinCapacity(0); }} className="h-12 rounded-2xl font-black uppercase tracking-widest text-sm">
              {t('Reset Filters', 'إعادة الضبط')}
            </Button>
            <Button onClick={handleApplyFilters} className="h-16 rounded-[2rem] text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/20">
              {t('Explore Results', 'استكشاف النتائج')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Categories Section */}
      <div className="px-6 mt-12">

        <div className="flex items-center justify-between mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">{t('Categories', 'الأقسام')}</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('Handpicked for you', 'مختارة بعناية لك')}</p>
          </div>
          <button 
            onClick={() => setFilterOpen(true)}
            className="w-10 h-10 bg-muted/30 rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-5">
          {categories.filter(c => c.id !== 'other').map((cat) => (
            <Card
              key={cat.id}
              className="relative overflow-hidden h-48 rounded-[2.5rem] border-none shadow-xl group cursor-pointer active:scale-95 transition-all animate-fade-up"
              style={{ animationDelay: `${categories.filter(c => c.id !== 'other').indexOf(cat) * 0.08}s` }}
              onClick={() => navigate(`/search?category=${cat.id}`)}
            >
              <img
                src={cat.image}
                alt={cat.nameEn}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white font-black text-xl leading-none tracking-tighter mb-1">
                  {language === 'ar' ? cat.nameAr : cat.nameEn}
                </p>
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <span className="text-[10px] text-white font-black uppercase tracking-widest">{t('Explore', 'استكشف')}</span>
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <ChevronDown className="w-2.5 h-2.5 text-white -rotate-90 rtl:rotate-90" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Other Options - Grouped Premium Services */}
        <div className="mt-12 mb-10">
          <div className="flex items-center justify-between mb-6 px-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('Special Services', 'خدمات خاصة')}</h4>
            <div className="h-px bg-muted/50 flex-1 mx-4" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {categories.find(c => c.id === 'other')?.subOptions?.slice(0, 12).map((opt) => (
              <button
                key={opt.id}
                className="flex flex-col items-center gap-3 group active:scale-90 transition-all animate-fade-up"
                style={{ animationDelay: `${(categories.find(c => c.id === 'other')?.subOptions?.indexOf(opt) || 0) * 0.04}s` }}
                onClick={() => navigate(`/search?category=${opt.id}`)}
              >
                <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-md border border-primary/5 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-300">
                  <opt.icon className="w-7 h-7" />
                </div>
                <span className="text-[9px] font-black text-center leading-tight uppercase tracking-tighter text-muted-foreground group-hover:text-primary transition-colors max-w-[64px]">
                  {language === 'ar' ? opt.nameAr : opt.nameEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-10 bg-muted/10 rounded-[4rem] mx-4 border border-white/50">
        <h3 className="text-xl font-black mb-6 px-2">{t('Quick Search', 'بحث سريع')}</h3>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[
            { label: t('Today', 'اليوم'), date: new Date(), icon: CalendarDays },
            { label: t('Tomorrow', 'غداً'), date: new Date(Date.now() + 86400000), icon: CalendarDays },
            { label: t('Weekend', 'نهاية الأسبوع'), date: new Date(Date.now() + 2 * 86400000), icon: Sparkles },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(`/search?date=${item.date.toISOString()}`)}
              className="flex-shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-primary/5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all active:scale-95"
            >
              <item.icon className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {promotedVenues.length > 0 && (
        <div className="py-6 border-b border-border/40 bg-muted/5">
          <div className="px-6 flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">{t('Promoted this Month', 'ترشيحات هذا الشهر')}</h3>
          </div>
          <div className="px-5">
            <Slider
              dots={true}
              infinite={promotedVenues.length > 1}
              speed={500}
              slidesToShow={1}
              slidesToScroll={1}
              autoplay={true}
              autoplaySpeed={3000}
              arrows={false}
              rtl={language === 'ar'}
              className="pb-6"
              centerMode={true}
              centerPadding="20px"
            >
              {promotedVenues.map(venue => (
                 <div key={`promo-${venue.id}`} className="px-2 outline-none">
                   <Card onClick={() => navigate(`/venue/${venue.id}`)} className="cursor-pointer hover:shadow-lg transition-all border-none relative overflow-hidden group h-48 rounded-2xl w-full">
                       <img src={venue.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000'} alt={venue.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                       <div className="absolute bottom-3 left-4 right-4">
                           <h4 className="text-white font-bold text-lg mb-1 drop-shadow-sm line-clamp-1">{language === 'ar' ? venue.nameAr : venue.name}</h4>
                           <div className="flex items-center gap-2 text-white/90 text-sm font-medium drop-shadow-sm">
                               <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                               <span>{venue.rating || 0}</span>
                           </div>
                       </div>
                       <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          {t('Promoted', 'ترويج')}
                       </div>
                   </Card>
                 </div>
              ))}
            </Slider>
          </div>
        </div>
      )}

      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{t('Top Rated Services', 'الخدمات الأعلى تقييماً')}</h3>
          <button onClick={() => navigate('/search')} className="text-primary hover:underline text-sm font-semibold">
            {t('See All', 'عرض الكل')}
          </button>
        </div>

        <div className="space-y-4">
          {topRatedVenues.map((venue) => (
            <Card
              key={venue.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-none shadow-sm animate-fade-up"
              style={{ animationDelay: `${topRatedVenues.indexOf(venue) * 0.06}s` }}
              onClick={() => navigate(`/venue/${venue.id}`)}
            >
              <div className="relative">
                <img src={venue.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000'} alt={venue.name} className="w-full h-48 object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(venue.id); }}
                  className={`absolute top-3 ${language === 'ar' ? 'left-3' : 'right-3'} p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm`}
                >
                  <Heart className={`h-4 w-4 ${savedVenues.includes(venue.id) ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
                </button>
                <div className={`absolute bottom-3 ${language === 'ar' ? 'right-3' : 'left-3'} px-3 py-1 bg-primary/90 backdrop-blur-sm rounded-full`}>
                  <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                    {(() => {
                      const tVal = venue.type || 'venue';
                      if (tVal === 'wedding' || tVal === 'venue' || tVal === 'event_hall') return t('Venue', 'قاعة');
                      if (tVal === 'catering') return t('Catering', 'تقديم طعام');
                      if (tVal === 'photographer') return t('Photographer', 'مصور');
                      return t('Service', 'خدمة');
                    })()}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h4 className={`text-lg font-bold mb-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? venue.nameAr : venue.name}
                </h4>
                <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{venue.location}</span>
                </div>

                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold">{Number(venue.rating || 0).toFixed(1)}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">({venue.reviews || 0})</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{venue.price.toLocaleString()} {t('EGP', 'ج.م')}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center pb-6">
            <Button
              variant="outline"
              className="rounded-2xl px-8 h-12 font-black uppercase tracking-widest border-primary/20"
              disabled={loadingMore}
              onClick={async () => { setLoadingMore(true); await loadMoreVenues(); setLoadingMore(false); }}
            >
              {loadingMore ? t('Loading...', 'جاري التحميل...') : t('Load More', 'تحميل المزيد')}
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Date Picker Bottom Sheet */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDatePicker(false)}
          />
          {/* Sheet */}
          <div className="relative bg-card rounded-t-3xl shadow-2xl pb-8 pt-4 px-4 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-center mb-4">{t('Pick a Date', 'اختر تاريخاً')}</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d: Date | undefined) => setSelectedDate(d)}
              disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-xl border-none mx-auto"
            />
            {selectedDate && (
              <Button
                onClick={() => {
                  setShowDatePicker(false);
                  navigate(`/search?date=${selectedDate.toISOString()}`);
                }}
                className="w-full mt-4 bg-primary hover:bg-primary/90 rounded-xl h-12"
              >
                {t('Search for', 'ابحث في')} {selectedDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowDatePicker(false)}
              className="w-full mt-2 rounded-xl h-11 text-muted-foreground"
            >
              {t('Cancel', 'إلغاء')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
