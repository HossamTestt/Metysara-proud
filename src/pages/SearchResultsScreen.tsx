import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, SlidersHorizontal, MapPin, Star, Heart, ArrowLeft, Users, X } from 'lucide-react';
import { useVenues } from '../context/VenuesContext';
import { useLanguage } from '../context/LanguageContext';
import { BottomNav } from '../components/layout/BottomNav';

const egyptianCities = [
  { 
    name: 'Cairo', 
    nameAr: 'القاهرة',
    zones: ['Nasr City', 'New Cairo', 'Heliopolis', 'Maadi', 'Downtown', 'Zamalek']
  },
  { 
    name: 'Giza', 
    nameAr: 'الجيزة',
    zones: ['Haram', 'October', 'Omranaia', 'Dokki', 'Mohandessin', 'Sheikh Zayed']
  },
  { 
    name: 'Alexandria', 
    nameAr: 'الإسكندرية',
    zones: ['Stanley', 'Smouha', 'Sidi Gaber', 'Miami', 'Glim', 'Montazah']
  },
  { 
    name: 'Beni Suef', 
    nameAr: 'بني سويف',
    zones: ['Downtown', 'Al Wadi', 'East District']
  },
  { 
    name: 'Fayoum', 
    nameAr: 'الفيوم',
    zones: ['City Center', 'Ibshaway', 'Sinnuris']
  },
  { 
    name: 'Minya', 
    nameAr: 'المنيا',
    zones: ['Downtown', 'West Minya', 'East Minya']
  },
];

export function SearchResultsScreen() {
  const { venues, savedVenues, toggleFavorite } = useVenues();
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [minCapacity, setMinCapacity] = useState(0);
  const [sortBy, setSortBy] = useState('recommended');
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeFilter = searchParams.get('type') || searchParams.get('category');

  const currentCityData = egyptianCities.find(c => c.name === selectedCity);
  const availableZones = currentCityData ? currentCityData.zones : [];

  // Initialize from URL params
  useEffect(() => {
    const city = searchParams.get('city');
    const zone = searchParams.get('zone');
    const minP = searchParams.get('minPrice');
    const maxP = searchParams.get('maxPrice');
    const cap = searchParams.get('minCapacity');

    if (city) setSelectedCity(city);
    if (zone) setSelectedZone(zone);
    if (minP || maxP) {
      setPriceRange([
        minP ? parseInt(minP) : 0,
        maxP ? parseInt(maxP) : 500000
      ]);
    }
    if (cap) setMinCapacity(parseInt(cap));
  }, []);

  // Reset zone when city changes (only if it's a manual change, not initialization)
  // To avoid resetting on mount, we can track if it's the first render, but a simpler way 
  // is to just check if the new city actually has the current zone.
  useEffect(() => {
    if (selectedCity !== 'All Cities' && !availableZones.includes(selectedZone) && selectedZone !== 'All Zones') {
      setSelectedZone('All Zones');
    }
  }, [selectedCity]);

  const filteredVenues = venues.filter((venue) => {
    const currentCity = egyptianCities.find(c => c.name === selectedCity);
    const matchesCity = selectedCity === 'All Cities' || 
      (venue.location && venue.location.toLowerCase() === selectedCity.toLowerCase()) ||
      (currentCity && venue.location && venue.location === currentCity.nameAr);
    
    const matchesZone = selectedZone === 'All Zones' || 
      (venue.zone && venue.zone.toLowerCase() === selectedZone.toLowerCase());
      
    const matchesPrice = venue.price >= priceRange[0] && venue.price <= priceRange[1];
    const matchesCapacity = venue.capacity >= minCapacity;
    
    const lSearch = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      (venue.name && venue.name.toLowerCase().includes(lSearch)) ||
      (venue.nameAr && venue.nameAr.includes(searchQuery)) ||
      (venue.location && venue.location.toLowerCase().includes(lSearch)) ||
      (venue.zone && venue.zone.toLowerCase().includes(lSearch));
    
    const matchesType = !typeFilter || venue.type === typeFilter;
    
    return matchesCity && matchesZone && matchesPrice && matchesCapacity && matchesSearch && matchesType;
  });

  const sortedVenues = [...filteredVenues].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'capacity-high') return b.capacity - a.capacity;
    if (sortBy === 'capacity-low') return a.capacity - b.capacity;
    return 0;
  });

  const clearAllFilters = () => {
    setSelectedCity('All Cities');
    setSelectedZone('All Zones');
    setPriceRange([0, 500000]);
    setMinCapacity(0);
    setSortBy('recommended');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCity !== 'All Cities' || 
    selectedZone !== 'All Zones' || 
    priceRange[0] > 0 || 
    priceRange[1] < 500000 || 
    minCapacity > 0;

  return (
    <div className="min-h-screen bg-background pb-32" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Premium Search Header */}
      <div className="bg-gradient-to-br from-card via-card to-muted/20 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-8 rounded-b-[3.5rem] shadow-xl relative overflow-hidden border-b border-primary/5 sticky top-0 z-50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <button 
            onClick={() => navigate('/home')}
            className="w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner hover:bg-white/80 transition-all active:scale-95"
          >
            <ArrowLeft className={`h-5 w-5 text-primary ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-black tracking-tight text-foreground leading-none">{t('Search Results', 'نتائج البحث')}</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{sortedVenues.length} {t('venues found', 'قاعة متاحة')}</p>
          </div>
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <button 
                onClick={() => setFilterOpen(true)}
                className="w-10 h-10 flex items-center justify-center bg-primary rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 relative outline-none"
              >
                <SlidersHorizontal className="h-5 w-5 text-primary-foreground" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="w-1 h-1 bg-white rounded-full" />
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end" className="w-[calc(100vw-2rem)] h-[85vh] rounded-[2.5rem] p-0 overflow-hidden border-primary/5 shadow-2xl backdrop-blur-3xl bg-card/98 z-[100]">
              <div className="p-8 space-y-8 overflow-y-auto h-full scrollbar-hide pb-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black tracking-tight">{t('Filters', 'الفلاتر')}</h3>
                  <div className="flex items-center gap-4">
                    <button onClick={clearAllFilters} className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors">{t('Reset All', 'إعادة ضبط')}</button>
                    <button onClick={() => setFilterOpen(false)} className="w-8 h-8 flex items-center justify-center bg-muted rounded-full">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                {/* City Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-3">{t('Location (City)', 'الموقع (المدينة)')}</label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder={t('Select City', 'اختر المدينة')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Cities">{t('All Cities', 'جميع المدن')}</SelectItem>
                      {egyptianCities.map((city) => (
                        <SelectItem key={city.name} value={city.name}>
                          {language === 'ar' ? city.nameAr : city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Zone Filter */}
                {selectedCity !== 'All Cities' && availableZones.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold mb-3">
                      {t(`Zone in ${selectedCity}`, `المنطقة في ${egyptianCities.find(c => c.name === selectedCity)?.nameAr || selectedCity}`)}
                    </label>
                    <Select value={selectedZone} onValueChange={setSelectedZone}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder={t('Select Zone', 'اختر المنطقة')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Zones">{t('All Zones', 'جميع المناطق')}</SelectItem>
                        {availableZones.map((zone) => (
                          <SelectItem key={zone} value={zone}>
                            {zone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    {t('Price Range', 'نطاق السعر')}: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} EGP
                  </label>
                  <Slider
                    min={0}
                    max={500000}
                    step={5000}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-2"
                  />
                </div>

                {/* Guest Capacity */}
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    {t('Minimum Guest Capacity', 'الحد الأدنى للسعة')}: {minCapacity} {t('guests', 'ضيوف')}
                  </label>
                  <Slider
                    min={0}
                    max={1000}
                    step={50}
                    value={[minCapacity]}
                    onValueChange={(value) => setMinCapacity(value[0])}
                    className="mt-2"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-semibold mb-3">{t('Sort By', 'ترتيب حسب')}</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommended">{t('Recommended', 'موصى به')}</SelectItem>
                      <SelectItem value="price-low">{t('Price: Low to High', 'السعر: من الأقل للأعلى')}</SelectItem>
                      <SelectItem value="price-high">{t('Price: High to Low', 'السعر: من الأعلى للأقل')}</SelectItem>
                      <SelectItem value="rating">{t('Highest Rated', 'الأعلى تقييماً')}</SelectItem>
                      <SelectItem value="capacity-high">{t('Capacity: High to Low', 'السعة: من الأكبر للأصغر')}</SelectItem>
                      <SelectItem value="capacity-low">{t('Capacity: Low to High', 'السعة: من الأصغر للأكبر')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    className="w-full h-12 rounded-xl mb-3"
                  >
                    {t('Clear All Filters', 'مسح جميع الفلاتر')}
                  </Button>
                  <Button
                    onClick={() => setFilterOpen(false)}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
                  >
                    {t('Show', 'عرض')} {sortedVenues.length} {t('Results', 'نتائج')}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
          <Input
            type="text"
            placeholder={t('Search by name, city, or zone...', 'ابحث بالاسم، المدينة، أو المنطقة...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`h-12 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} bg-input-background rounded-xl border-0`}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="px-6 py-3 flex gap-2 flex-wrap">
          {selectedCity !== 'All Cities' && (
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
              {language === 'ar' ? egyptianCities.find(c => c.name === selectedCity)?.nameAr : selectedCity}
              <button onClick={() => setSelectedCity('All Cities')} className="hover:text-primary-foreground">×</button>
            </div>
          )}
          {selectedZone !== 'All Zones' && (
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
              {selectedZone}
              <button onClick={() => setSelectedZone('All Zones')} className="hover:text-primary-foreground">×</button>
            </div>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 500000) && (
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
              {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} EGP
              <button onClick={() => setPriceRange([0, 500000])} className="hover:text-primary-foreground">×</button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="px-6 py-4">
        <p className="text-muted-foreground">
          {t('Found', 'تم العثور على')} {sortedVenues.length} {t('venues', 'قاعات')}
          {selectedCity !== 'All Cities' && ` ${t('in', 'في')} ${language === 'ar' ? egyptianCities.find(c => c.name === selectedCity)?.nameAr : selectedCity}`}
        </p>
      </div>

      {/* Venue Cards */}
      <div className="px-6 space-y-4">
        {sortedVenues.map((venue) => (
          <Card
            key={venue.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/venue/${venue.id}`)}
          >
            <div className="relative">
              <img
                src={venue.images[0]}
                alt={venue.name}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(venue.id);
                }}
                className={`absolute top-3 ${language === 'ar' ? 'left-3' : 'right-3'} p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors`}
              >
                <Heart
                  className={`h-5 w-5 ${
                    savedVenues.includes(venue.id)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-700'
                  }`}
                />
              </button>
              <div className={`absolute bottom-3 ${language === 'ar' ? 'right-3' : 'left-3'} px-3 py-1 bg-primary/90 backdrop-blur-sm rounded-full`}>
                <span className="text-white text-sm">
                  {(() => {
                     const tType = venue.type || 'venue';
                     if (tType === 'wedding' || tType === 'venue') return t('Venue', 'قاعة');
                     if (tType === 'photographer') return t('Photographer', 'مصور');
                     if (tType === 'videographer') return t('Videographer', 'مصور فيديو');
                     if (tType === 'makeup') return t('Makeup Artist', 'خبير مكياج');
                     if (tType === 'planner') return t('Event Planner', 'منظم حفلات');
                     return t('Service', 'خدمة');
                  })()}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-lg mb-1">{language === 'ar' && venue.nameAr ? venue.nameAr : venue.name}</h4>
                  {language === 'en' && venue.nameAr && (
                    <p className="text-sm text-muted-foreground" dir="rtl">
                      {venue.nameAr}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {venue.location}, {venue.zone}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t('Up to', 'حتى')} {venue.capacity} {t('guests', 'ضيف')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{venue.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({venue.reviews})
                  </span>
                </div>
                <div className={`${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  <p className="text-sm text-muted-foreground">{t('From', 'من')}</p>
                  <p className="text-lg text-primary">
                    {venue.price.toLocaleString()} EGP
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sortedVenues.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">{t('No venues found matching your criteria', 'لم يتم العثور على قاعات تطابق خياراتك')}</p>
          <p className="text-sm text-muted-foreground mb-4">{t('Try adjusting your filters', 'جرب تعديل الفلاتر')}</p>
          <Button
            onClick={clearAllFilters}
            variant="outline"
            className="mt-4"
          >
            {t('Clear All Filters', 'مسح جميع الفلاتر')}
          </Button>
        </div>
      )}
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
