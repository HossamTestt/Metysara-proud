import { Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Booking } from '../../types';

interface BookingCardProps {
  booking: Booking;
  language: 'en' | 'ar';
  onPress: () => void;
  onReceiptClick?: (booking: Booking) => void;
}

export function BookingCard({ booking, language, onPress, onReceiptClick }: BookingCardProps) {
  const isConfirmed = booking.status === 'confirmed';
  return (
    <Card
      onClick={onPress}
      className="overflow-hidden cursor-pointer hover:shadow-xl transition-all active:scale-[0.98] border-none shadow-md rounded-[2rem] group animate-fade-up"
    >
      <div className="flex gap-0">
        <div className="relative w-32 h-32 overflow-hidden shrink-0">
          <img
            src={booking.venueImage || '/placeholder.jpg'}
            alt={booking.venueName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex-1 p-5 bg-card flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-black text-sm group-hover:text-primary transition-colors line-clamp-1">{booking.venueName}</h4>
            <div className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shrink-0 ${isConfirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {booking.status.replace('_', ' ')}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold mb-4">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{booking.date}</span>
          </div>
          <div className="flex items-center justify-between mt-auto">
             <p className="text-[10px] text-primary/50 font-black uppercase tracking-widest">#{booking.serialId || booking.id.slice(0, 8)}</p>
             {isConfirmed && onReceiptClick && (
               <Button 
                  variant="default" 
                  size="sm" 
                  className="text-[9px] h-8 px-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-black uppercase tracking-widest shadow-lg shadow-green-200" 
                  onClick={(e) => { e.stopPropagation(); onReceiptClick(booking); }}
                >
                 {language === 'ar' ? 'الإيصال' : 'Receipt'}
               </Button>
             )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function BookingCardSkeleton() {
  return (
    <Card className="overflow-hidden border-none shadow-md rounded-[2rem] animate-pulse">
      <div className="flex gap-0">
        <div className="w-32 h-32 bg-gray-200 shrink-0" />
        <div className="flex-1 p-5 bg-card flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded-full w-16" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-1/3 mb-4 mt-2" />
          <div className="mt-auto h-4 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </Card>
  );
}
