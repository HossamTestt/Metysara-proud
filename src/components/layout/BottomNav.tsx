import { useNavigate, useLocation } from 'react-router';
import { Home, Search, Heart, CalendarDays, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const path = location.pathname;

  const isActive = (p: string) => path === p;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <div className="flex items-center justify-around">
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${isActive('/home') ? 'text-primary' : 'text-muted-foreground'}`} 
          onClick={() => navigate('/home')}
        >
          <Home className={`h-6 w-6 ${isActive('/home') ? 'fill-primary/10' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('Home', 'الرئيسية')}</span>
        </button>
        
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${isActive('/search') ? 'text-primary' : 'text-muted-foreground'}`} 
          onClick={() => navigate('/search')}
        >
          <Search className="h-6 w-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('Explore', 'استكشف')}</span>
        </button>
        
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${(isActive('/profile') && location.search.includes('tab=saved')) ? 'text-primary' : 'text-muted-foreground'}`} 
          onClick={() => navigate('/profile?tab=saved')}
        >
          <Heart className="h-6 w-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('Saved', 'المحفوظات')}</span>
        </button>
        
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${(isActive('/profile') && location.search.includes('tab=bookings')) ? 'text-primary' : 'text-muted-foreground'}`} 
          onClick={() => navigate('/profile?tab=bookings')}
        >
          <CalendarDays className="h-6 w-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('Bookings', 'الحجوزات')}</span>
        </button>
        
        <button 
          className={`flex flex-col items-center gap-1 transition-all ${(isActive('/profile') && !location.search.includes('tab=')) ? 'text-primary' : 'text-muted-foreground'}`} 
          onClick={() => navigate('/profile')}
        >
          <User className="h-6 w-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('Profile', 'حسابي')}</span>
        </button>
      </div>
    </div>
  );
}
