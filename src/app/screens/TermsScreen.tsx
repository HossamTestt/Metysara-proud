import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { ArrowLeft, FileText, Shield, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/card';

export function TermsScreen() {
  const navigate = useNavigate();

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
         {/* Terms */}
         <Card className="p-6">
           <div className="flex items-center gap-3 mb-4 border-b pb-4">
             <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
             </div>
             <h3 className="text-xl font-bold">Terms of Service</h3>
           </div>
           
           <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
             <p>
               Welcome to Metysara. By accessing or using our application, you agree to 
               be bound by these Terms of Service. If you disagree with any part of the 
               terms, you may not access the service.
             </p>
             <p className="font-semibold text-foreground">1. Vendor Responsibilities</p>
             <p>
               Vendors are solely responsible for the accuracy of their venue listings, pricing, 
               and image representations. Misleading information may result in account termination.
             </p>
             <p className="font-semibold text-foreground">2. User Bookings</p>
             <p>
               Bookings confirmed through the app constitute a binding agreement between the 
               Customer and the Vendor. Metysara acts as a facilitator and is not liable 
               for disputes arising at the venue.
             </p>
             <p className="font-semibold text-foreground">3. Cancellations & Refunds</p>
             <p>
               Cancellation policies are determined by individual vendors. Please review 
               the specific venue's policy before confirming a booking.
             </p>
           </div>
         </Card>

         {/* Privacy */}
         <Card className="p-6">
           <div className="flex items-center gap-3 mb-4 border-b pb-4">
             <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
             </div>
             <h3 className="text-xl font-bold">Privacy Policy</h3>
           </div>
           
           <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
             <p>
               Your privacy is important to us. It is Metysara's policy to respect your 
               privacy regarding any information we may collect from you.
             </p>
             <p className="font-semibold text-foreground">Data Collection</p>
             <p>
               We collect information to provide better services, including identifying 
               basic user data (name, email) and usage data to improve our platform. We 
               store data securely using Firebase backend services.
             </p>
             <p className="font-semibold text-foreground">Data Sharing</p>
             <p>
               We do not share your personal information with third parties except to 
               facilitate your requested bookings (e.g., sharing your details with the 
               vendor you book).
             </p>
           </div>
         </Card>

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
