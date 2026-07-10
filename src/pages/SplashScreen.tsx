import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const ONBOARDING_KEY = 'metysara_onboarding_seen';

export function SplashScreen() {
  const navigate = useNavigate();
  const { currentUser, userData, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY) === 'true';

      if (!hasSeenOnboarding) {
        // First time ever opening the app — show onboarding
        navigate('/onboarding', { replace: true });
      } else if (currentUser) {
        // Already logged in — go straight to the right dashboard
        if (userData?.role === 'admin' || userData?.role === 'support') {
          navigate('/admin', { replace: true });
        } else if (userData?.role === 'vendor') {
          navigate('/vendor', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      } else {
        // Has seen onboarding but not logged in — go to login
        navigate('/login', { replace: true });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, currentUser, userData, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F3E7] via-[#E8E6DA] to-[#C5A572]/20 overflow-hidden">
      <div className="flex flex-col items-center gap-6 relative">
        <div className="relative flex items-center justify-center">
          <div className="absolute bg-primary/20 rounded-[3rem] blur-2xl animate-pulse scale-110 w-32 h-32" />
          <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl border border-primary/5 p-4 animate-logo-pop relative z-10">
            <img src="/logo.png" alt="Metysara Logo" className="w-full h-auto object-contain" />
          </div>
        </div>
        <h1 className="text-3xl font-black tracking-widest text-primary uppercase animate-fade-up" style={{ animationDelay: '0.4s' }}>
          Metysara
        </h1>
        <div className="flex gap-2 mt-8">
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
