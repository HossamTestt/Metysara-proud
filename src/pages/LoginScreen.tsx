import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'sonner';

const HAS_LOGGED_IN_KEY = 'metysara_has_logged_in';

export function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, register, loginWithGoogle, loginWithFacebook, userData } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  // Detect first-time vs returning user
  const isReturningUser = (() => {
    try { return localStorage.getItem(HAS_LOGGED_IN_KEY) === 'true'; } catch { return false; }
  })();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    
    setIsLoggingIn(true);
    setErrorMsg('');
    try {
      await login(email, password);
      // Mark that user has now logged in at least once
      try { localStorage.setItem(HAS_LOGGED_IN_KEY, 'true'); } catch {/* ignore */}
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to login');
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg(t('Please enter your email address first.', 'يرجى إدخال البريد الإلكتروني أولاً.'));
      return;
    }
    
    // Attempting to reset. First check if user is a vendor.
    try {
      const usersRef = collection(db, 'users');
      // Using lowercase match just to be safe, though direct == works best if typed exactly
      const q = query(usersRef, where('email', '==', email.trim()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const userDocData = snap.docs[0].data();
        if (userDocData.role === 'vendor') {
          setErrorMsg(t(
            'For security reasons, Vendor password resets must be requested from Administration.',
            'لأسباب أمنية، لا يمكن تغيير كلمة سر القاعة من هنا. يرجى التواصل مع الإدارة لإرسال رابط التجديد.'
          ));
          return;
        }
      }

      await sendPasswordResetEmail(auth, email.trim());
      toast.success(t('Password reset email sent! Check your inbox.', 'تم إرسال رابط إعادة تعيين كلمة المرور! تحقق من بريدك.'));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset email.');
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl" />
      
      {/* Language Switcher Floating */}
      <div className="absolute top-12 right-6 z-50">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl hover:bg-white/80 transition-all active:scale-95 text-primary"
        >
          <Globe className="h-5 w-5" />
        </button>
      </div>

      {/* Logo & Header */}
      <div className="pt-24 pb-12 px-6 flex flex-col items-center relative z-10">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-primary/5 p-2 mb-8 animate-float">
          <img src="/logo.png" alt="Metysara" className="w-full h-auto object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2 leading-none">
            {isReturningUser
              ? t('Welcome Back', 'مرحباً بعودتك')
              : t('Metysara', 'متيسرة')}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {isReturningUser
              ? t('Sign in to continue your journey', 'سجّل دخولك لمتابعة رحلتك')
              : t('Discover and book premium venues', 'اكتشف واحجز أرقى القاعات والأماكن')}
          </p>
        </div>
      </div>

      {/* Content / Form */}
      <div className="flex-1 px-8 relative z-10">
        <div className="space-y-6 mb-8">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 rtl:mr-2 block">
              {t('Email / Phone', 'البريد الإلكتروني / رقم الهاتف')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 rtl:right-0 px-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-muted-foreground">
                <Mail className="h-5 w-5" />
              </div>
              <Input
                type="email"
                placeholder={t('Enter your email', 'ادخل بريدك الإلكتروني')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-16 ${language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} bg-white/50 backdrop-blur-md border-primary/5 rounded-3xl shadow-inner focus-visible:ring-4 focus-visible:ring-primary/5 transition-all text-base font-medium`}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-2 rtl:mr-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                {t('Password', 'كلمة المرور')}
              </label>
              <button 
                onClick={handleForgotPassword}
                className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
              >
                {t('Forgot?', 'نسيت؟')}
              </button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 rtl:right-0 px-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('Enter your password', 'ادخل كلمة المرور')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-16 ${language === 'ar' ? 'pr-14 pl-14' : 'pl-14 pr-14'} bg-white/50 backdrop-blur-md border-primary/5 rounded-3xl shadow-inner focus-visible:ring-4 focus-visible:ring-primary/5 transition-all text-base font-medium`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 rtl:left-0 px-5 flex items-center text-muted-foreground hover:text-primary transition-colors`}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-xs font-bold text-center animate-shake">
             {errorMsg}
          </div>
        )}

        <Button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-3xl mb-8 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          size="lg"
        >
          {isLoggingIn ? t("Signing in...", "جاري الدخول...") : t("Sign In", "دخول")}
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
        <div className="space-y-3 mb-5">
          {/* Google */}
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-2 gap-3"
            onClick={async () => {
              setErrorMsg('');
              setIsLoggingIn(true);
              try {
                await loginWithGoogle();
                try { localStorage.setItem(HAS_LOGGED_IN_KEY, 'true'); } catch {/* ignore */}
              } catch (err: any) {
                console.error("Google Auth Error Detail:", err);
                if (err.code === 'auth/popup-closed-by-user') {
                  setErrorMsg(t('Google login was cancelled.', 'تم إلغاء تسجيل الدخول بجوجل.'));
                } else if (err.code === 'auth/network-request-failed') {
                   setErrorMsg(t('Network error. Check your connection.', 'خطأ في الشبكة. تفقد اتصالك.'));
                } else if (err.code === 'auth/operation-not-allowed') {
                   setErrorMsg(t('Google login is not enabled in Firebase.', 'تسجيل الدخول بجوجل غير مفعل في فيربيز.'));
                } else {
                  setErrorMsg(t('Failed to login with Google: ', 'فشل تسجيل الدخول بحساب جوجل: ') + (err.message || 'Unknown Error'));
                }
              }
              setIsLoggingIn(false);
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>
          {/* Facebook */}
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-2 gap-3"
            onClick={async () => {
              setErrorMsg('');
              setIsLoggingIn(true);
              try {
                await loginWithFacebook();
                try { localStorage.setItem(HAS_LOGGED_IN_KEY, 'true'); } catch {/* ignore */}
              } catch (err: any) {
                console.error("Facebook Auth Error Detail:", err);
                if (err.code === 'auth/popup-closed-by-user') {
                  setErrorMsg(t('Facebook login was cancelled.', 'تم إلغاء تسجيل الدخول بفيسبوك.'));
                } else if (err.code === 'auth/network-request-failed') {
                   setErrorMsg(t('Network error. Check your connection.', 'خطأ في الشبكة. تفقد اتصالك.'));
                } else if (err.code === 'auth/operation-not-allowed') {
                   setErrorMsg(t('Facebook login is not enabled in Firebase.', 'تسجيل الدخول بفيسبوك غير مفعل في فيربيز.'));
                } else {
                  setErrorMsg(t('Failed to login with Facebook: ', 'فشل تسجيل الدخول بحساب فيسبوك: ') + (err.message || 'Unknown Error'));
                }
              }
              setIsLoggingIn(false);
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
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
