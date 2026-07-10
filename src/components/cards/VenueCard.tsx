import { Heart, MapPin, Star } from 'lucide-react';
import { Card } from '../ui/card';
import { Venue } from '../../types';

interface VenueCardProps {
  venue: Venue;
  onPress: () => void;
  language: 'en' | 'ar';
}

export function VenueCard({ venue, onPress, language }: VenueCardProps) {
  return (
    <Card
      onClick={onPress}
      className="overflow-hidden cursor-pointer hover:shadow-xl transition-all active:scale-[0.98] border-none shadow-md rounded-[2rem] group animate-fade-up"
    >
      <div className="flex gap-0">
        <div className="relative w-32 h-32 overflow-hidden shrink-0">
          <img 
            src={venue.images?.[0] || '/placeholder.jpg'} 
            alt={venue.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          />
          <div className="absolute top-2 left-2 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
            <Heart className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="flex-1 p-5 bg-card">
          <h4 className="font-black text-sm group-hover:text-primary transition-colors line-clamp-1 mb-1">
            {language === 'ar' ? venue.nameAr : venue.name}
          </h4>
          <div className="flex items-center gap-2 mb-3 text-[10px] text-muted-foreground font-bold">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="line-clamp-1">{venue.location || venue.zone}</span>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-0.5 rounded-full">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-black text-yellow-700">{venue.rating || 5}</span>
            </div>
            <p className="text-primary font-black text-sm">
              {venue.price?.toLocaleString()} <span className="text-[10px] font-bold opacity-60">{language === 'ar' ? 'ج.م' : 'EGP'}</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function VenueCardSkeleton() {
  return (
    <Card className="overflow-hidden border-none shadow-md rounded-[2rem] animate-pulse">
      <div className="flex gap-0">
        <div className="w-32 h-32 bg-gray-200 shrink-0" />
        <div className="flex-1 p-5 bg-card">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="flex items-center justify-between mt-auto pt-4">
            <div className="h-4 bg-gray-200 rounded w-8" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
    </Card>
  );
}
