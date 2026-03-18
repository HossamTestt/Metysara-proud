import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Calendar } from '../components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useLanguage } from '../contexts/LanguageContext';
import { useVenues } from '../contexts/VenuesContext';
import {
  Search,
  MapPin,
  Bell,
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
  Building2,
} from 'lucide-react';

const categories = [
  {
    id: 'wedding',
    nameEn: 'Wedding Venues',
    nameAr: 'قاعات الأفراح',
    image: 'https://images.unsplash.com/photo-1631225893179-4d6e349189c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwY291cGxlJTIwY2VyZW1vbnl8ZW58MXx8fHwxNzcxODA1OTg0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'funeral',
    nameEn: 'Dar Monasbat',
    nameAr: 'دار مناسبات',
    image: 'https://images.unsplash.com/photo-1644413816296-9533c9d831bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdW5lcmFsJTIwY29uZG9sZW5jZSUyMGdhdGhlcmluZ3xlbnwxfHx8fDE3NzE4MDU5ODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: 'other',
    nameEn: 'Other Options',
    nameAr: 'خيارات أخرى',
    subOptions: [
      { id: 'photographer', nameEn: 'Photographer', nameAr: 'مصور فوتوغرافي', icon: Camera },
      { id: 'videographer', nameEn: 'Videographer', nameAr: 'مصور فيديو', icon: Video },
      { id: 'photosession', nameEn: 'Photo Session Places', nameAr: 'أماكن جلسات التصوير', icon: ImageIcon },
      { id: 'makeup', nameEn: 'Makeup Artist', nameAr: 'فنان مكياج', icon: Sparkles },
      { id: 'limousine', nameEn: 'Limousine (soon)', nameAr: 'ليموزين (قريباً)', icon: Car },
      { id: 'catering', nameEn: 'Catering', nameAr: 'تقديم الطعام', icon: UtensilsCrossed },
    ]
  },
];

export function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [savedVenues, setSavedVenues] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { venues } = useVenues();

  const toggleSave = (venueId: string) => {
    const newSaved = new Set(savedVenues);
    if (newSaved.has(venueId)) {
      newSaved.delete(venueId);
    } else {
      newSaved.add(venueId);
    }
    setSavedVenues(newSaved);
  };

  const handleSearch = () => {
    navigate('/search');
  };

  const topRatedVenues = venues.filter((venue) => venue.rating >= 4.7).slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Logo and Metysara */}
      <div className="bg-card px-6 pt-12 pb-6 rounded-b-3xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <img src="/متيسرة 04-03.png" alt="Metysara Logo" className="w-16 h-auto object-contain" />
              <div>
                <h1 className="text-2xl text-foreground font-bold tracking-wide">Metysara</h1>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'شريكك في المناسبات' : 'Your Event Partner'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <Globe className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button
              className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              onClick={() => navigate('/profile')}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={language === 'ar' ? 'ابحث عن القاعات والأماكن...' : 'Search venues, locations...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="h-14 pl-12 pr-14 bg-input-background rounded-xl border-0"
          />
          <button
            onClick={() => navigate('/search')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <SlidersHorizontal className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-6">
        <h3 className="text-xl mb-4">{language === 'ar' ? 'الفئات' : 'Categories'}</h3>
        <div className="grid grid-cols-3 gap-3">
          {/* Wedding Venues */}
          <Card
            onClick={() => {
              setSelectedCategory('wedding');
              navigate(`/search?type=wedding`);
            }}
            className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg relative h-32 p-0 ${selectedCategory === 'wedding' ? 'ring-2 ring-primary' : ''
              }`}
          >
            <img src={categories[0].image} alt={categories[0].nameEn} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-white">
              <h4 className="text-sm text-center leading-tight font-semibold">
                {language === 'ar' ? categories[0].nameAr : categories[0].nameEn}
              </h4>
            </div>
          </Card>

          {/* Dar Monasbat */}
          <Card
            onClick={() => {
              setSelectedCategory('funeral');
              navigate(`/search?type=funeral`);
            }}
            className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg relative h-32 p-0 ${selectedCategory === 'funeral' ? 'ring-2 ring-primary' : ''
              }`}
          >
            <img src={categories[1].image} alt={categories[1].nameEn} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-white">
              <h4 className="text-sm text-center leading-tight font-semibold">
                {language === 'ar' ? categories[1].nameAr : categories[1].nameEn}
              </h4>
            </div>
          </Card>

          {/* Other Options - Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full focus:outline-none h-32">
                <Card
                  className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg w-full h-full relative p-0 ${selectedCategory === 'other' ? 'ring-2 ring-primary' : ''
                    }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                    {/* Service Icons Grid */}
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      <Camera className="h-5 w-5 text-primary" />
                      <Sparkles className="h-5 w-5 text-primary" />
                      <UtensilsCrossed className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <h4 className="text-xs text-center leading-tight font-semibold">
                        {language === 'ar' ? categories[2].nameAr : categories[2].nameEn}
                      </h4>
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </div>
                </Card>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="center">
              {categories[2].subOptions?.map((option) => {
                const IconComponent = option.icon;
                return (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => {
                      setSelectedCategory(option.id);
                      navigate(`/search?type=${option.id}`);
                    }}
                    className="cursor-pointer py-3"
                  >
                    <IconComponent className="h-4 w-4 mr-3 text-primary" />
                    <div className="flex-1">
                      <div className="text-sm">{language === 'ar' ? option.nameAr : option.nameEn}</div>
                    </div>
                  </DropdownMenuItem>
                );
              })}\n            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-6 py-4">
        <h3 className="text-xl mb-4">{language === 'ar' ? 'اختر تاريخ الحدث' : 'Select Event Date'}</h3>
        <Card className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date()}
            className="rounded-md"
          />
          {selectedDate && (
            <Button
              onClick={() => navigate(`/search?date=${selectedDate.toISOString()}`)}           className="w-full mt-4 bg-primary hover:bg-primary/90"
            >
          {language === 'ar' ? `ابحث في ${selectedDate.toLocaleDateString('ar-EG')}` : `Search for ${selectedDate.toLocaleDateString()}`}
        </Button>
          )}
      </Card>
    </div>

      {/* Top Rated Venues */ }
  <div className="px-6 py-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl">{language === 'ar' ? 'الخدمات الأعلى تقييماً' : 'Top Rated Services'}</h3>
      <button
        onClick={() => navigate('/search')}
        className="text-primary hover:underline text-sm"
      >
        {language === 'ar' ? 'عرض الكل' : 'See All'}
      </button>
    </div>

    <div className="space-y-4">
      {topRatedVenues.map((venue) => (
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
                toggleSave(venue.id);
              }}
              className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <Heart
                className={`h-5 w-5 ${savedVenues.has(venue.id)
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-700'
                  }`}
              />
            </button>
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-primary/90 backdrop-blur-sm rounded-full">
              <span className="text-white text-sm">
                {(() => {
                   const t = venue.type || 'venue';
                   if (t === 'wedding' || t === 'venue') return language === 'ar' ? 'قاعة' : 'Venue';
                   if (t === 'photographer') return language === 'ar' ? 'مصور' : 'Photographer';
                   if (t === 'videographer') return language === 'ar' ? 'فيديو' : 'Videographer';
                   if (t === 'makeup') return language === 'ar' ? 'مكياج' : 'Makeup Artist';
                   if (t === 'planner') return language === 'ar' ? 'منظم' : 'Planner';
                   return language === 'ar' ? 'خدمة' : 'Service';
                })()}
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-lg mb-1">{language === 'ar' ? venue.nameAr : venue.name}</h4>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{venue.location}, {venue.zone}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{venue.rating}</span>
                <span className="text-sm text-muted-foreground">
                  ({venue.reviews})
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'من' : 'From'}</p>
                <p className="text-lg text-primary">
                  {venue.price.toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>

  {/* Bottom Navigation */ }
  <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 rounded-t-3xl shadow-lg">
    <div className="flex items-center justify-around">
      <button className="flex flex-col items-center gap-1 text-primary">
        <Search className="h-6 w-6" />
        <span className="text-xs">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
      </button>
      <button
        className="flex flex-col items-center gap-1 text-muted-foreground"
        onClick={() => navigate('/search')}
      >
        <MapPin className="h-6 w-6" />
        <span className="text-xs">{language === 'ar' ? 'استكشف' : 'Explore'}</span>
      </button>
      <button
        className="flex flex-col items-center gap-1 text-muted-foreground"
        onClick={() => navigate('/profile')}
      >
        <Heart className="h-6 w-6" />
        <span className="text-xs">{language === 'ar' ? 'المحفوظات' : 'Saved'}</span>
      </button>
      <button
        className="flex flex-col items-center gap-1 text-muted-foreground"
        onClick={() => navigate('/profile')}
      >
        <Menu className="h-6 w-6" />
        <span className="text-xs">{language === 'ar' ? 'الحساب' : 'Profile'}</span>
      </button>
    </div>
  </div>
    </div >
  );
}