import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Building2 } from 'lucide-react';

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F3E7] via-[#E8E6DA] to-[#C5A572]/20">
      <div className="animate-fade-in">
        <img src="/متيسرة 04-03.png" alt="Metysara Logo" className="w-64 h-auto animate-pulse object-contain" />
      </div>
    </div>
  );
}
