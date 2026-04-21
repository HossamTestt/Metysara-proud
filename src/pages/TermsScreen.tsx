import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { ArrowLeft, FileText, Shield, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/card';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';

export function TermsScreen() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [policies, setPolicies] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'legal'));
        if (snap.exists()) {
          setPolicies(snap.data());
        }
      } catch (e) {
        console.error("Error fetching policies:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-card px-6 pt-12 pb-6 rounded-b-3xl shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
             <h2 className="text-xl font-bold">Policies & Terms</h2>
             <p className="text-sm text-muted-foreground">Legal Information</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
         {loading ? (
           <div className="flex justify-center py-12">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           </div>
         ) : (
           <>
             {/* Terms */}
             <Card className="p-6">
               <div className="flex items-center gap-3 mb-4 border-b pb-4">
                 <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                 </div>
                 <h3 className="text-xl font-bold">{t('Terms of Service', 'شروط الخدمة')}</h3>
               </div>
               
               <div className="text-sm text-foreground leading-relaxed whitespace-pre-line font-medium">
                 {(language === 'ar' ? policies?.termsAr : policies?.termsEn) || t('No terms established.', 'لم يتم تحديد شروط.')}
               </div>
             </Card>

             {/* Privacy */}
             <Card className="p-6">
               <div className="flex items-center gap-3 mb-4 border-b pb-4">
                 <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600" />
                 </div>
                 <h3 className="text-xl font-bold">{t('Privacy Policy', 'سياسة الخصوصية')}</h3>
               </div>
               
               <div className="text-sm text-foreground leading-relaxed whitespace-pre-line font-medium">
                 {(language === 'ar' ? policies?.privacyAr : policies?.privacyEn) || t('No privacy policy established.', 'لم يتم تحديد سياسة خصوصية.')}
               </div>
             </Card>
           </>
         )}

         <Card className="p-4 bg-yellow-50 border-yellow-200">
           <div className="flex items-start gap-3">
             <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
             <div className="flex-1">
               <p className="text-sm text-yellow-900 font-medium mb-1">
                 Updates to Terms
               </p>
               <p className="text-xs text-yellow-800">
                 We reserve the right to modify or replace these terms at any time. 
                 Continued use of the app implies acceptance of any changes.
               </p>
             </div>
           </div>
         </Card>
         
         <div className="pt-4">
            <Button onClick={() => navigate(-1)} className="w-full text-lg h-14 rounded-xl">
               I Understand
            </Button>
         </div>
      </div>
    </div>
  );
}
