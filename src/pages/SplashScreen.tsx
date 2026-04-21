import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const ONBOARDING_KEY = 'metysara_onboarding_seen';

export function SplashScreen() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  useEffect(() => {
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
  }, [navigate, currentUser, userData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F3E7] via-[#E8E6DA] to-[#C5A572]/20">
      <div className="animate-fade-in flex flex-col items-center gap-4">
        <img src="/logo.png" alt="Metysara Logo" className="w-48 h-auto animate-pulse object-contain" />
      </div>
    </div>
  );
}
