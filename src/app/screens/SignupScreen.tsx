import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { User, Mail, Lock, Phone, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Checkbox } from '../components/ui/checkbox';
import { Link } from 'react-router';

export function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { register, userData } = useAuth();
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
          <h1 className="text-3xl mb-2">{t('Create Account', 'أنشئ حسابك')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('Join our community', 'انضم إلى مجتمعنا')}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm mb-2">{t('Full Name', 'الاسم الكامل')}</label>
            <div className="relative">
              <User className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
              <Input
                type="text"
                placeholder={t('Enter your full name', 'ادخل اسمك الكامل')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`h-14 ${language === 'ar' ? 'pr-12' : 'pl-12'} bg-input-background rounded-xl`}
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm mb-2">{t('Email', 'البريد الإلكتروني')}</label>
            <div className="relative">
              <Mail className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
              <Input
                type="email"
                placeholder={t('Enter your email', 'ادخل بريدك الإلكتروني')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`h-14 ${language === 'ar' ? 'pr-12' : 'pl-12'} bg-input-background rounded-xl`}
              />
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm mb-2">{t('Phone Number', 'رقم الهاتف')}</label>
            <div className="relative">
              <Phone className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
              <Input
                type="tel"
                placeholder={t("+20 123 456 7890", "+٢٠ ١٢٣ ٤٥٦ ٧٨٩٠")}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                placeholder={t('Create a password', 'انشئ كلمة مرور')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 mb-6">
          <Checkbox 
            id="terms" 
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
             {t("I agree to Metysara's ", "أوافق على ")}
             <Link to="/terms" className="text-primary hover:underline font-medium">
               {t("Terms of Service & Privacy Policy", "شروط الخدمة وسياسة الخصوصية")}
             </Link>
          </label>
        </div>

        {errorMsg && (
          <div className="mb-4 text-sm text-red-500 text-center font-medium">
             {errorMsg}
          </div>
        )}

        {/* Sign Up Button */}
        <Button
          onClick={handleSignup}
          disabled={isSigningUp}
          className="w-full h-14 text-lg rounded-xl mb-6 relative"
          size="lg"
        >
          {isSigningUp ? t("Creating account...", "جاري الإنشاء...") : t("Sign Up", "إنشاء حساب")}
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
        <div className="space-y-3 mb-6">
          <Button
            variant="outline"
            className="w-full h-14 rounded-xl border-2"
            onClick={handleSignup}
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
