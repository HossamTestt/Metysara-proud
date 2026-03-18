import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { NotificationDropdown } from '../components/ui/NotificationDropdown';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  User,
  Calendar,
  Heart,
  Settings,
  Bell,
  Globe,
  LogOut,
  ChevronRight,
  MapPin,
  Star,
  MessageSquare,
  Send
} from 'lucide-react';



const savedVenues = [
  {
    id: 3,
    name: 'Al Noor Events Hall',
    nameAr: 'قاعة النور للمناسبات',
    location: 'Alexandria, Egypt',
    rating: 4.7,
    price: 25000,
    image: 'https://images.unsplash.com/photo-1760888563092-17d79ae2703b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB2aWxsYSUyMHdlZGRpbmclMjB2ZW51ZXxlbnwxfHx8fDE3NzE2NDEzMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 4,
    name: 'Golden Ballroom',
    nameAr: 'القاعة الذهبية',
    location: 'New Cairo, Egypt',
    rating: 4.9,
    price: 45000,
    image: 'https://images.unsplash.com/photo-1763231575952-98244918f99b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZXZlbnQlMjBoYWxsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcxNjQxMzI3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export function ProfileScreen() {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  
  const { userData, logout } = useAuth();
  
  // Edit Profile State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(userData?.name || '');
  const [editPhone, setEditPhone] = useState(userData?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);


  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    if (userData?.uid) {
      const fetchTickets = async () => {
        try {
          const q = query(collection(db, 'tickets'), where('userId', '==', userData.uid));
          const snap = await getDocs(q);
          const tData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
             const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
             const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
             return tB - tA;
          });
          setTickets(tData);
        } catch (err) {
          console.error("Error fetching tickets:", err);
        }

        try {
          const bQuery = query(collection(db, 'bookings'), where('customerId', '==', userData.uid));
          const bSnap = await getDocs(bQuery);
          const bData = bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
             const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
             const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
             return tB - tA;
          });
          setBookings(bData);
        } catch (err) {
          console.error("Error fetching bookings:", err);
        }
      };
      fetchTickets();
    }
  }, [userData]);

  const handleSubmitTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim() || !userData) return;
    setIsSubmittingTicket(true);
    try {
      const docRef = await addDoc(collection(db, 'tickets'), {
        userId: userData.uid,
        userName: userData.name,
        userEmail: userData.email,
        subject: newTicketSubject,
        message: newTicketMessage,
        status: 'open',
        userRole: 'customer',
        createdAt: serverTimestamp(),
        replies: []
      });
      setTickets([{
        id: docRef.id,
        subject: newTicketSubject,
        message: newTicketMessage,
        status: 'open',
        createdAt: { toMillis: () => Date.now() },
        replies: []
      }, ...tickets]);
      setNewTicketSubject('');
      setNewTicketMessage('');
      alert('Support ticket submitted successfully. Our team will get back to you soon!');
    } catch (e: any) {
      alert('Error submitting ticket: ' + e.message);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate('/login');
    } catch(e) { console.error(e); }
  };

  const handleUpdateProfile = async () => {
    if (!userData?.uid) return;
    setIsUpdatingProfile(true);
    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        name: editName,
        phone: editPhone
      });
      // Force reload to get new AuthContext data
      window.location.reload(); 
    } catch (e: any) {
      alert("Error updating profile: " + e.message);
      setIsUpdatingProfile(false);
    }
  };

  const handleDownloadReceipt = (booking: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Booking Receipt', 20, 20);
    
    doc.setFontSize(14);
    doc.text('Metysara Platform', 20, 30);
    doc.setFontSize(10);
    doc.text(`Receipt generated on: ${new Date().toLocaleDateString()}`, 20, 36);
    
    autoTable(doc, {
       startY: 45,
       head: [['Detail', 'Information']],
       body: [
          ['Booking ID', booking.id],
          ['Venue', booking.venueName],
          ['Date', booking.date],
          ['Customer Name', userData?.name || 'N/A'],
          ['Customer Phone', userData?.phone || 'N/A'],
          ['Status', booking.status.toUpperCase()],
          ['Total Amount Paid', `${(booking.totalAmount || 0).toLocaleString()} EGP`]
       ],
       theme: 'grid'
    });

    doc.save(`Receipt_${booking.id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-12 pb-20 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-primary-foreground">Profile</h2>
          <div className="flex gap-3">
             <div className="bg-primary-foreground/20 rounded-full flex items-center justify-center p-1 text-primary-foreground">
                <NotificationDropdown />
             </div>
             <button
               onClick={() => navigate('/home')}
               className="p-2 bg-primary-foreground/20 rounded-full hover:bg-primary-foreground/30 transition-colors"
             >
               <LogOut className="h-5 w-5 text-primary-foreground" />
             </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <User className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl text-primary-foreground mb-1">
              {userData?.name || 'Guest User'}
            </h3>
            <p className="text-primary-foreground/80">{userData?.email || 'Not logged in'}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 -mt-12 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl mb-1">{bookings.length}</p>
            <p className="text-xs text-muted-foreground">Bookings</p>
          </Card>
          <Card className="p-4 text-center">
            <Heart className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl mb-1">2</p>
            <p className="text-xs text-muted-foreground">Saved</p>
          </Card>
          <Card className="p-4 text-center">
            <Star className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl mb-1">0</p>
            <p className="text-xs text-muted-foreground">Reviews</p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs defaultValue="bookings">
          <TabsList className="grid w-full grid-cols-4 mb-6 text-xs">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/confirmation/${booking.id}`)}
              >
                <div className="flex gap-4">
                  <img
                    src={booking.venueImage || '/placeholder.jpg'}
                    alt={booking.venueName}
                    className="w-28 h-28 object-cover"
                  />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium mb-1">{booking.venueName}</h4>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs \${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <p className="text-xs text-muted-foreground uppercase text-primary font-bold">{booking.id.slice(0, 8)}</p>
                       {booking.status === 'confirmed' && (
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="text-xs h-8"
                           onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadReceipt(booking);
                           }}
                         >
                           Download Receipt
                         </Button>
                       )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {bookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No bookings yet</p>
                <Button onClick={() => navigate('/home')}>
                  Explore Venues
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="space-y-4">
            {savedVenues.map((venue) => (
              <Card
                key={venue.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/venue/${venue.id}`)}
              >
                <div className="flex gap-4">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="w-28 h-28 object-cover"
                  />
                  <div className="flex-1 p-4">
                    <h4 className="font-medium mb-1">{venue.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2" dir="rtl">
                      {venue.nameAr}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {venue.location}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{venue.rating}</span>
                      </div>
                      <p className="text-primary">
                        {venue.price.toLocaleString()} EGP
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="divide-y divide-border">
              {/* Account Settings */}
              <button 
                onClick={() => {
                  setEditName(userData?.name || '');
                  setEditPhone(userData?.phone || '');
                  setIsEditProfileOpen(true);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{t('Account Information', 'معلومات الحساب')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('Update your profile details', 'تحديث تفاصيل ملفك الشخصي')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Notifications */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive booking updates
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between pl-8">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about bookings
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </div>

              {/* Language */}
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{t('Language', 'اللغة')}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'English' : 'العربية'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Admin Access */}
              <button
                onClick={() => navigate('/admin')}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Admin Dashboard</p>
                    <p className="text-sm text-muted-foreground">
                      Manage venues and bookings
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </Card>

            {/* Logout */}
            <Button
              variant="outline"
              className="w-full h-14 text-lg rounded-xl border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              {t('Logout', 'تسجيل الخروج')}
            </Button>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                 <MessageSquare className="h-5 w-5 text-primary" />
                 Contact Support
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Have an issue with your booking or the app? Send us a message and our support team will help you out.</p>
              
              <div className="space-y-3">
                 <Input 
                    placeholder="Subject (e.g. Booking BK-123 Issue)" 
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                 />
                 <Textarea 
                    placeholder="Describe your issue in detail..." 
                    className="min-h-[100px]"
                    value={newTicketMessage}
                    onChange={(e) => setNewTicketMessage(e.target.value)}
                 />
                 <Button 
                    className="w-full" 
                    onClick={handleSubmitTicket}
                    disabled={isSubmittingTicket || !newTicketSubject || !newTicketMessage}
                 >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Ticket
                 </Button>
              </div>
            </Card>

            <div className="space-y-3">
              <h4 className="font-semibold text-muted-foreground">Your Previous Tickets</h4>
              {tickets.length === 0 ? (
                <p className="text-sm text-center py-4 bg-muted/30 rounded-lg">You have no support tickets.</p>
              ) : (
                tickets.map(ticket => (
                  <Card key={ticket.id} className="p-4">
                     <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold">{ticket.subject}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full uppercase font-medium ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                           {ticket.status}
                        </span>
                     </div>
                     <p className="text-sm text-muted-foreground mb-3">{ticket.message}</p>
                     
                     {ticket.replies && ticket.replies.length > 0 && (
                        <div className="mt-3 pt-3 border-t bg-muted/20 p-3 rounded-lg">
                           <p className="text-xs font-semibold text-primary mb-1">Admin Response:</p>
                           <p className="text-sm italic">{ticket.replies[ticket.replies.length - 1].message}</p>
                        </div>
                     )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 rounded-t-3xl shadow-lg">
        <div className="flex items-center justify-around">
          <button
            className="flex flex-col items-center gap-1 text-muted-foreground"
            onClick={() => navigate('/home')}
          >
            <MapPin className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 text-muted-foreground"
            onClick={() => navigate('/search')}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Explore</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-primary">
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-[400px] w-[90%] rounded-2xl mx-auto">
          <DialogHeader>
            <DialogTitle>{t('Edit Profile', 'تعديل الملف الشخصي')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('Full Name', 'الاسم الكامل')}</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t("Your full name", "الاسم الكامل")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('Phone Number', 'رقم الهاتف')}</label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder={t("Your phone number", "رقم الهاتف")}
                type="tel"
              />
            </div>
            <Button 
               className="w-full h-12" 
               onClick={handleUpdateProfile}
               disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? t('Updating...', 'جاري التحديث...') : t('Save Changes', 'حفظ التغييرات')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
