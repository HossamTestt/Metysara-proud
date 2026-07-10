import { Card } from '../ui/card';
import { Ticket } from '../../types';

interface TicketCardProps {
  ticket: Ticket;
  language: 'en' | 'ar';
}

export function TicketCard({ ticket, language }: TicketCardProps) {
  const isOpen = ticket.status === 'open';
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <Card className="p-4 rounded-2xl border border-muted/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h5 className="font-bold text-sm line-clamp-1 flex-1 pr-2">{ticket.subject}</h5>
        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${isOpen ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
          {isOpen ? (language === 'ar' ? 'مفتوحة' : 'Open') : (language === 'ar' ? 'مغلقة' : 'Closed')}
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{ticket.message}</p>
      <div className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest text-right">
        {formatDate(ticket.createdAt)}
      </div>
    </Card>
  );
}
