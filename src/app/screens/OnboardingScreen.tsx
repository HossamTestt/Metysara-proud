import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { ChevronRight, Heart, Search, Calendar } from 'lucide-react';

const onboardingSlides = [
  {
    icon: Search,
    titleEn: 'Find Your Perfect Venue',
    titleAr: 'اعثر على المكان المثالي',
    descriptionEn: 'Browse through hundreds of premium venues for weddings and special events across Egypt',
    descriptionAr: 'تصفح المئات من الأماكن الفاخرة لحفلات الزفاف والمناسبات الخاصة في جميع أنحاء مصر',
  },
  {
    icon: Calendar,
    titleEn: 'Easy Booking Process',
    titleAr: 'عملية حجز سهلة',
    descriptionEn: 'Check availability, select your date, and book your venue in just a few simple steps',
    descriptionAr: 'تحقق من التوفر، اختر التاريخ، واحجز مكانك في خطوات بسيطة',
  },
  {
    icon: Heart,
    titleEn: 'Memorable Celebrations',
    titleAr: 'احتفالات لا تُنسى',
    descriptionEn: 'Create unforgettable moments in the most elegant and prestigious venues',
    descriptionAr: 'أنشئ لحظات لا تُنسى في أفخم وأرقى الأماكن',
  },
];

export function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/login');
    }
  };

  const handleSkip = () => {
    navigate('/login');
  };

  const slide = onboardingSlides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip Button */}
      <div className="p-6 flex justify-end">
        <button 
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-8">
          <Icon className="w-16 h-16 text-primary" />
        </div>

        <h1 className="text-3xl mb-4 text-foreground max-w-md">
          {slide.titleEn}
        </h1>
        <p className="text-muted-foreground text-lg mb-2 max-w-sm">
          {slide.descriptionEn}
        </p>
        <p className="text-muted-foreground text-lg max-w-sm" dir="rtl">
          {slide.descriptionAr}
        </p>
      </div>

      {/* Indicators and Button */}
      <div className="p-8">
        {/* Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {onboardingSlides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-primary/30'
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <Button
          onClick={handleNext}
          className="w-full h-14 text-lg rounded-xl"
          size="lg"
        >
          {currentSlide === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
