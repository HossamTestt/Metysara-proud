import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, register, userData } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    
    setIsLoggingIn(true);
    setErrorMsg('');
    try {
      await login(email, password);
      // Wait a moment for context to populate userData, or we can just rely on the effect below
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to login');
      setIsLoggingIn(false);
    }
  };

  // Watch for userData changes to route them correctly
  useEffect(() => {
    if (userData) {
      if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'vendor') navigate('/vendor');
      else navigate('/home');
    }
  }, [userData, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo */}
      <div className="pt-12 pb-8 px-6 flex justify-center relative">
         <img src="/متيسرة 04-03.png" alt="Metysara" className="w-32 h-auto" />
         <button
           onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
           className="absolute top-10 right-6 p-2 rounded-full hover:bg-muted transition-colors text-primary"
         >
           <Globe className="h-5 w-5" />
         </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2">{t('Welcome Back', 'مرحباً بعودتك')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('Login to your account', 'تسجيل الدخول إلى حسابك')}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm mb-2">{t('Email / Phone', 'البريد الإلكتروني / رقم الهاتف')}</label>
            <div className="relative">
              <Mail className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
              <Input
                type="email"
                placeholder={t('Enter your email or phone', 'ادخل بريدك الإلكتروني أو رقم هاتفك')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-14 ${language === 'ar' ? 'pr-12' : 'pl-12'} bg-input-background rounded-xl`}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm mb-2">{t('Password', 'كلمة المرور')}</label>
            <div className="relative">
              <Lock className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('Enter your password', 'ادخل كلمة المرور')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-14 ${language === 'ar' ? 'pr-12 pl-12' : 'pl-12 pr-12'} bg-input-background rounded-xl`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-muted-foreground`}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <button 
              onClick={async () => {
                 setIsLoggingIn(true);
                 try {
                   await register('test@admin.com', 'password123', 'Head Admin', 'admin');
                 } catch (e: any) {
                   // If they already exist, just log them in
                   try {
                     await login('test@admin.com', 'password123');
                   } catch (loginErr: any) {
                     setErrorMsg(loginErr.message);
                     setIsLoggingIn(false);
                   }
                 }
              }}
              className="text-muted-foreground hover:text-primary transition-colors text-xs opacity-50"
            >
              [Dev: Auto-Login Admin]
            </button>

            <button className="text-primary hover:underline">
              Forgot Password?
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 text-sm text-red-500 text-center font-medium">
             {errorMsg}
          </div>
        )}

        <Button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full h-14 text-lg rounded-xl mb-6 relative"
          size="lg"
        >
          {isLoggingIn ? t("Signing in...", "جاري تسجيل الدخول...") : t("Login", "تسجيل الدخول")}
        </Button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-muted-foreground">
              {t('Or continue with', 'أو تابع باستخدام')}
            </span>
          </div>
        </div>

        {/* Social Login */}
        <div className="space-y-3 mb-6">
          <Button
            variant="outline"
            className="w-full h-14 rounded-xl border-2"
            onClick={handleLogin}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
        </div>

        <div className="text-center">
          <span className="text-muted-foreground">{t("Don't have an account?", "ليس لديك حساب؟")} </span>
          <button
            onClick={() => navigate('/signup')}
            className="text-primary hover:underline"
          >
            {t("Sign Up", "إنشاء حساب")}
          </button>
        </div>
      </div>
    </div>
  );
}
