import { Camera, Video, Image as ImageIcon, Sparkles, Car, UtensilsCrossed, Home } from 'lucide-react';

export const categories = [
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
    image: 'images/dar_monasbat.jpg'
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
      { id: 'planner', nameEn: 'Wedding Planner', nameAr: 'منظم أفراح', icon: Sparkles },
      { id: 'decor', nameEn: 'Decor', nameAr: 'ديكور', icon: Home },
      { id: 'hair_styling', nameEn: 'Hair Styling', nameAr: 'تصفيف شعر', icon: Sparkles },
      { id: 'limousine', nameEn: 'Limousine (soon)', nameAr: 'ليموزين (قريباً)', icon: Car },
      { id: 'catering', nameEn: 'Catering', nameAr: 'تقديم الطعام', icon: UtensilsCrossed },
      { id: 'event_hall', nameEn: 'Event Hall', nameAr: 'قاعة فعاليات', icon: Home },
    ]
  },
];

export const egyptianCities = [
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

export const venueSubTypes: Record<string, { id: string, name: string, nameAr: string }[]> = {
  venue: [
    { id: 'open_villa', name: 'Open Villa', nameAr: 'فيلا مكشوفة' },
    { id: 'open_hall', name: 'Open Hall', nameAr: 'قاعة مكشوفة' },
    { id: 'covered_hall', name: 'Covered Hall', nameAr: 'قاعة مغطاة' },
    { id: 'hotel', name: 'Hotel', nameAr: 'فندق' }
  ],
  wedding: [
    { id: 'open_villa', name: 'Open Villa', nameAr: 'فيلا مكشوفة' },
    { id: 'open_hall', name: 'Open Hall', nameAr: 'قاعة مكشوفة' },
    { id: 'covered_hall', name: 'Covered Hall', nameAr: 'قاعة مغطاة' },
    { id: 'hotel', name: 'Hotel', nameAr: 'فندق' }
  ],
  funeral: [
    { id: 'mosque_hall', name: 'Mosque Hall', nameAr: 'دار في مسجد' },
    { id: 'hotel', name: 'Hotel', nameAr: 'فندق' },
    { id: 'other', name: 'Other', nameAr: 'أخرى' }
  ]
};

export const additionalServices = [
  { id: 'photography', name: 'Professional Photography', nameAr: 'تصوير احترافي', price: 5000 },
  { id: 'decoration', name: 'Premium Decoration', nameAr: 'ديكور فاخر', price: 8000 },
  { id: 'catering', name: 'Premium Catering', nameAr: 'خدمة طعام فاخرة', price: 15000 },
  { id: 'dj', name: 'DJ & Entertainment', nameAr: 'دي جي وترفيه', price: 7000 },
  { id: 'flowers', name: 'Floral Arrangements', nameAr: 'تنسيق زهور', price: 6000 },
  { id: 'lighting', name: 'Special Lighting', nameAr: 'إضاءة خاصة', price: 4000 },
];

export const VALID_PAYMENT_METHODS = ['bank', 'venue'] as const;
