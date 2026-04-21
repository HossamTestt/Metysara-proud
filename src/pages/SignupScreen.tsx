import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { User, Mail, Lock, Phone, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Checkbox } from '../components/ui/checkbox';
import { Link } from 'react-router';

export function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { register, loginWithGoogle, loginWithFacebook, userData } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      setErrorMsg(t('Please fill in all required fields.', 'يرجى ملء جميع الحقول المطلوبة.'));
      return;
    }

    if (!agreedToTerms) {
      setErrorMsg(t('You must agree to the Terms of Service & Privacy Policy.', 'يجب الموافقة على شروط الخدمة وسياسة الخصوصية.'));
      return;
    }

    const emailLower = formData.email.toLowerCase();
    if (emailLower.endsWith('@metysara.com') || emailLower.endsWith('@metysaravendors.com')) {
      setErrorMsg(t('These email domains are reserved for staff and vendors.', 'هذه النطاقات البريدية مخصصة للموظفين والمزودين فقط.'));
      return;
    }

    setIsSigningUp(true);
    setErrorMsg('');
    try {
      await register(formData.email, formData.password, formData.name, 'customer');
      // Success! The AuthContext will pick up the new user and useEffect will route them.
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create account');
      setIsSigningUp(false);
    }
  };

  useEffect(() => {
    if (userData) {
      navigate('/home'); // Customers go to home
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
      <div className="pt-20 pb-8 px-6 flex flex-col items-center relative z-10">
        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl border border-primary/5 p-2 mb-6 animate-float">
          <img src="/logo.png" alt="Metysara" className="w-full h-auto object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter text-foreground mb-2 leading-none">
            {t('Join Metysara', 'انضم إلينا')}
          </h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            {t('Start your premium event journey', 'ابدأ رحلتك الفاخرة معنا')}
          </p>
        </div>
      </div>

      {/* Content / Form */}
      <div className="flex-1 px-8 relative z-10 overflow-y-auto pb-10 scrollbar-hide">
        <div className="space-y-5 mb-8">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 rtl:mr-2 block">
              {t('Full Name', 'الاسم الكامل')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 rtl:right-0 px-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-muted-foreground">
                <User className="h-5 w-5" />
              </div>
              <Input
                type="text"
                placeholder={t('Enter your full name', 'ادخل اسمك الكامل')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`h-16 ${language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} bg-white/50 backdrop-blur-md border-primary/5 rounded-3xl shadow-inner focus-visible:ring-4 focus-visible:ring-primary/5 transition-all text-base font-medium`}
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 rtl:mr-2 block">
              {t('Email Address', 'البريد الإلكتروني')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 rtl:right-0 px-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-muted-foreground">
                <Mail className="h-5 w-5" />
              </div>
              <Input
                type="email"
                placeholder={t('Enter your email', 'ادخل بريدك الإلكتروني')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`h-16 ${language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} bg-white/50 backdrop-blur-md border-primary/5 rounded-3xl shadow-inner focus-visible:ring-4 focus-visible:ring-primary/5 transition-all text-base font-medium`}
              />
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 rtl:mr-2 block">
              {t('Phone Number', 'رقم الهاتف')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 rtl:right-0 px-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-muted-foreground">
                <Phone className="h-5 w-5" />
              </div>
              <Input
                type="tel"
                placeholder="+20 123 456 7890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`h-16 ${language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} bg-white/50 backdrop-blur-md border-primary/5 rounded-3xl shadow-inner focus-visible:ring-4 focus-visible:ring-primary/5 transition-all text-base font-medium`}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 rtl:mr-2 block">
              {t('Password', 'كلمة المرور')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 rtl:right-0 px-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('Create a password', 'انشئ كلمة مرور')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

        {/* Terms Checkbox */}
        <div className="flex items-start gap-4 mb-8 px-2">
          <Checkbox 
            id="terms" 
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            className="mt-1 w-5 h-5 rounded-lg border-2"
          />
          <label htmlFor="terms" className="text-xs text-muted-foreground font-medium leading-tight select-none">
             {t("I agree to the ", "أوافق على ")}
             <Link to="/terms" className="text-primary hover:underline font-black uppercase tracking-tighter">
               {t("Terms & Privacy Policy", "شروط الخدمة وسياسة الخصوصية")}
             </Link>
          </label>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-xs font-bold text-center animate-shake">
             {errorMsg}
          </div>
        )}

        <Button
          onClick={handleSignup}
          disabled={isSigningUp}
          className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-3xl mb-8 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          size="lg"
        >
          {isSigningUp ? t("Creating Account...", "جاري الإنشاء...") : t("Create Account", "إنشاء حساب")}
        </Button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-muted-foreground">
              {t("Or sign up with", "أو أنشئ حساب باستخدام")}
            </span>
          </div>
        </div>

        {/* Social Signup */}
        <div className="space-y-3 mb-4">
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-2 gap-3"
            onClick={async () => {
              setErrorMsg('');
              setIsSigningUp(true);
              try {
                await loginWithGoogle();
              } catch (err: any) {
                console.error(err);
                if (err.code === 'auth/popup-closed-by-user') {
                  setErrorMsg(t('Google signin was cancelled.', 'تم إلغاء التسجيل بجوجل.'));
                } else if (err.code === 'auth/network-request-failed') {
                   setErrorMsg(t('Network error. Check your connection.', 'خطأ في الشبكة. تفقد اتصالك.'));
                } else {
                  setErrorMsg(t('Failed to sign up with Google.', 'فشل التسجيل بحساب جوجل.'));
                }
              }
              setIsSigningUp(false);
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
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-2 gap-3"
            onClick={async () => {
              setErrorMsg('');
              setIsSigningUp(true);
              try {
                await loginWithFacebook();
              } catch (err: any) {
                console.error(err);
                if (err.code === 'auth/popup-closed-by-user') {
                  setErrorMsg(t('Facebook signin was cancelled.', 'تم إلغاء التسجيل بفيسبوك.'));
                } else if (err.code === 'auth/network-request-failed') {
                   setErrorMsg(t('Network error. Check your connection.', 'خطأ في الشبكة. تفقد اتصالك.'));
                } else {
                  setErrorMsg(t('Failed to sign up with Facebook.', 'فشل التسجيل بحساب فيسبوك.'));
                }
              }
              setIsSigningUp(false);
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </Button>
        </div>

        <div className="text-center pb-6">
          <span className="text-muted-foreground">{t("Already have an account? ", "لديك حساب بالفعل؟ ")} </span>
          <button
            onClick={() => navigate('/login')}
            className="text-primary hover:underline"
          >
            {t("Login", "تسجيل الدخول")}
          </button>
        </div>
      </div>
    </div>
  );
}
