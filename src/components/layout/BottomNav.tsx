import { useNavigate, useLocation } from 'react-router';
import { Home, Search, Heart, CalendarDays, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const path = location.pathname;

  const isActive = (p: string) => path === p;

  const NavItem = ({ icon: Icon, label, pathStr, active }: any) => (
    <button 
      className={`flex flex-col items-center gap-1 transition-all relative ${active ? 'text-primary' : 'text-muted-foreground'}`} 
      onClick={() => navigate(pathStr)}
    >
      <div className={`p-1.5 transition-all ${active ? 'bg-primary/10 rounded-2xl' : 'p-1.5'}`}>
        <Icon 
          className="h-6 w-6" 
          strokeWidth={active ? 2.5 : 1.8} 
        />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      {active && (
        <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary" />
      )}
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <div className="flex items-center justify-around pb-2">
        <NavItem icon={Home} label={t('Home', 'الرئيسية')} pathStr="/home" active={isActive('/home')} />
        <NavItem icon={Search} label={t('Explore', 'استكشف')} pathStr="/search" active={isActive('/search')} />
        <NavItem icon={Heart} label={t('Saved', 'المحفوظات')} pathStr="/profile?tab=saved" active={isActive('/profile') && location.search.includes('tab=saved')} />
        <NavItem icon={CalendarDays} label={t('Bookings', 'الحجوزات')} pathStr="/profile?tab=bookings" active={isActive('/profile') && location.search.includes('tab=bookings')} />
        <NavItem icon={User} label={t('Profile', 'حسابي')} pathStr="/profile" active={isActive('/profile') && !location.search.includes('tab=')} />
      </div>
    </div>
  );
}
