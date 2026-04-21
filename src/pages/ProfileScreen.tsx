import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { NotificationDropdown } from '../components/ui/NotificationDropdown';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/layout/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import { db, auth } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { createNotification } from '../utils/notifications';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
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
  Send,
  Home,
  Search,
  Shield,
  FileText,
  Trash2,
  AlertTriangle,
  Mail
} from 'lucide-react';

import { useVenues } from '../context/VenuesContext';

export function ProfileScreen() {
  const { venues, savedVenues: savedVenueIds } = useVenues();
  const savedVenues = venues.filter(v => savedVenueIds.includes(v.id));
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'bookings';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  
  const { currentUser, userData, logout } = useAuth();
  
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(userData?.name || '');
  const [editPhone, setEditPhone] = useState(userData?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const tabFromUrl = new URLSearchParams(location.search).get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search]);

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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/profile?tab=${value}`, { replace: true });
  };

  const handleSubmitTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim() || !userData) return;
    setIsSubmittingTicket(true);
    try {
      const docRef = await addDoc(collection(db, 'tickets'), {
        userId: userData.uid,
        userName: userData.name,
        userEmail: userData.email,
        userPhone: userData.phone || '',
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

      // Notify all support agents about the new ticket
      try {
        const supportSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'support')));
        for (const supportDoc of supportSnap.docs) {
          await createNotification(
            supportDoc.id,
            '🎫 New Support Ticket',
            `${userData.name} submitted a new ticket: "${newTicketSubject}"`
          );
        }
      } catch (e) { console.error('Support notification error:', e); }

      toast.success(language === 'ar' ? 'تم إرسال تذكرة الدعم بنجاح!' : 'Support ticket submitted successfully!');
    } catch (e: any) {
      toast.error((language === 'ar' ? 'خطأ في إرسال التذكرة: ' : 'Error submitting ticket: ') + e.message);
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

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    try {
      // Delete user doc from firestore first
      await deleteDoc(doc(db, 'users', currentUser.uid));
      // Delete auth user
      await deleteUser(currentUser);
      toast.success(language === 'ar' ? 'تم مسح الحساب بنجاح' : 'Account deleted successfully.');
      navigate('/login');
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        toast.error(language === 'ar' ? 'لأسباب أمنية، يرجى تسجيل الخروج والدخول مجدداً قبل محاولة مسح الحساب.' : 'For security reasons, please log out and log back in before deleting your account.');
      } else {
        toast.error((language === 'ar' ? 'خطأ في مسح الحساب: ' : 'Error deleting account: ') + e.message);
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!userData?.uid) return;
    setIsUpdatingProfile(true);
    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        name: editName,
        phone: editPhone
      });
      // Close dialog and let onAuthStateChanged / snapshot listeners refresh userData
      setIsEditProfileOpen(false);
      setIsUpdatingProfile(false);
      // Optimistically update the display name without a full page reload
      setEditName(editName);
      setEditPhone(editPhone);
      toast.success(t('Profile updated successfully!', 'تم تحديث الملف بنجاح!'));
    } catch (e: any) {
      toast.error((language === 'ar' ? 'خطأ في تحديث الملف: ' : 'Error updating profile: ') + e.message);
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser || !currentUser.email) return;
    setIsChangingPassword(true);
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, cred);
      await updatePassword(currentUser, newPassword);
      toast.success(language === 'ar' ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!');
      setIsChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: any) {
      toast.error(language === 'ar' ? 'خطأ في تغيير كلمة المرور. تأكد من كلمة المرور الحالية.' : 'Error changing password. Please ensure your current password is correct.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadReceipt = async (booking: any) => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Helper to load logo
      const loadLogoAsBase64 = async () => {
        try {
          const response = await fetch('/logo.png');
          const blob = await response.blob();
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.error(e);
          return null;
        }
      };

      const base64Logo = await loadLogoAsBase64();

      // ── Branded header band ────────────────────────────────
      pdf.setFillColor(193, 159, 98);
      pdf.rect(0, 0, pageWidth, 44, 'F');

      // Logo box
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(12, 8, 28, 28, 3, 3, 'F');
      if (base64Logo) {
        pdf.addImage(base64Logo, 'PNG', 12, 8, 28, 28);
      } else {
        pdf.setTextColor(193, 159, 98);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('LOGO', 26, 24, { align: 'center' });
      }

      // Brand name
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.text('Metysara', 48, 22);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Your Premium Event Partner  |  متيسرة', 48, 30);

      // Receipt label top-right
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BOOKING RECEIPT', pageWidth - 12, 20, { align: 'right' });
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      pdf.text(`Issued: ${today}`, pageWidth - 12, 27, { align: 'right' });
      const displayId = booking.serialId || (booking.id || 'BOOKING').slice(0, 12).toUpperCase();
      pdf.text(`Ref: #${displayId}`, pageWidth - 12, 35, { align: 'right' });

      // ── Status badge ───────────────────────────────────────
      const isConfirmed = booking.status === 'confirmed';
      const isRejected = ['rejected', 'cancelled'].includes(booking.status);
      const badgeRgb: [number, number, number] = isConfirmed ? [22, 163, 74] : isRejected ? [220, 38, 38] : [234, 88, 12];
      pdf.setFillColor(...badgeRgb);
      pdf.roundedRect(12, 52, 60, 10, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`STATUS: ${(booking.status || 'PENDING').replace(/_/g, ' ').toUpperCase()}`, 42, 58.5, { align: 'center' });

      // ── Customer section ───────────────────────────────────
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CUSTOMER INFORMATION', 12, 74);
      pdf.setDrawColor(193, 159, 98);
      pdf.setLineWidth(0.4);
      pdf.line(12, 76, pageWidth - 12, 76);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      let cy = 82;
      [
        ['Name', booking.customerName || 'N/A'],
        ['Phone', booking.customerPhone || 'N/A'],
        ['Email', booking.customerEmail || 'N/A'],
      ].forEach(([lbl, val]) => {
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(110, 110, 110); pdf.text(`${lbl}:`, 12, cy);
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(30, 30, 30); pdf.text(val, 55, cy);
        cy += 6;
      });

      // ── Booking details table ──────────────────────────────
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text('BOOKING DETAILS', 12, cy + 7);
      pdf.setDrawColor(193, 159, 98);
      pdf.line(12, cy + 9, pageWidth - 12, cy + 9);

      const slotDisplay = booking.slot === 'morning' ? 'Morning (10:00 AM – 3:00 PM)'
        : booking.slot === 'evening' ? 'Evening (6:00 PM – 12:00 AM)' : 'Full Day';
      let formattedDate = booking.date || 'N/A';
      try { formattedDate = new Date(booking.date).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }); } catch { /* keep raw */ }

      autoTable(pdf, {
        startY: cy + 13,
        margin: { left: 12, right: 12 },
        head: [['Detail', 'Information']],
        body: [
          ['Booking ID', displayId],
          ['Venue', booking.venueName || 'N/A'],
          ['Event Date', formattedDate],
          ['Time Slot', slotDisplay],
          ['Number of Guests', `${booking.guests || 'N/A'} guests`],
          ['Package', booking.packageName || 'Standard'],
          ['Special Requests', booking.notes || 'None'],
        ],
        headStyles: { fillColor: [193, 159, 98], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [252, 250, 245] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 52, textColor: [100, 100, 100] }, 1: { cellWidth: 'auto' } },
      });

      // ── Payment summary table ──────────────────────────────
      const tY = (pdf as any).lastAutoTable.finalY + 8;
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(60, 60, 60);
      pdf.text('PAYMENT SUMMARY', 12, tY);
      pdf.setDrawColor(193, 159, 98); pdf.line(12, tY + 2, pageWidth - 12, tY + 2);

      const depositAmt = booking.depositAmount || Math.round((booking.totalAmount || 0) * 0.2);
      const remaining = (booking.totalAmount || 0) - depositAmt;

      autoTable(pdf, {
        startY: tY + 6,
        margin: { left: 12, right: 12 },
        body: [
          ['Total Booking Amount', `${(booking.totalAmount || 0).toLocaleString()} EGP`],
          ['Deposit (20%) — Due After Confirmation', `${depositAmt.toLocaleString()} EGP`],
          ['Remaining Balance (Paid at Venue)', `${remaining.toLocaleString()} EGP`],
          ['Payment Status', booking.paymentStatus === 'deposit_paid' ? '✓ Deposit Paid' : 'Pending Confirmation'],
        ],
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', textColor: [80, 80, 80], cellWidth: 120 }, 1: { fontStyle: 'bold', textColor: [193, 159, 98], halign: 'right' } },
        alternateRowStyles: { fillColor: [252, 250, 245] },
      });

      // ── Notice box ─────────────────────────────────────────
      const nY = (pdf as any).lastAutoTable.finalY + 8;
      pdf.setFillColor(255, 248, 230); pdf.setDrawColor(193, 159, 98);
      pdf.roundedRect(12, nY, pageWidth - 24, 18, 2, 2, 'FD');
      pdf.setTextColor(120, 80, 0); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
      pdf.text('NOTICE:', 16, nY + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.text('This is an official booking receipt from Metysara. Payment is only due after vendor confirmation.', 34, nY + 6);
      pdf.text('The remaining balance is paid directly to the venue on the event day. Keep this receipt for your records.', 16, nY + 13);

      // ── Footer ─────────────────────────────────────────────
      const fY = pageHeight - 20;
      pdf.setDrawColor(200, 190, 175); pdf.setLineWidth(0.3);
      pdf.line(12, fY - 4, pageWidth - 12, fY - 4);
      pdf.setTextColor(150, 150, 150); pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal');
      pdf.text('Commercial Registration No.: [XXXXXXXX]   |   Tax Registration No.: [XXXXXXXXX]', pageWidth / 2, fY, { align: 'center' });
      pdf.text('Metysara Platform • Cairo, Egypt • www.metysara.com', pageWidth / 2, fY + 5, { align: 'center' });
      pdf.text(`© ${new Date().getFullYear()} Metysara. All rights reserved. This document is computer-generated and valid without a physical signature.`, pageWidth / 2, fY + 10, { align: 'center' });

      pdf.save(`Metysara_Receipt_${displayId}.pdf`);
    } catch (e: any) {
      console.error('Receipt error:', e);
      toast.error((language === 'ar' ? 'خطأ في إنشاء الإيصال: ' : 'Error generating receipt: ') + (e?.message || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header with improved gradient and layout */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 pt-[calc(4rem+env(safe-area-inset-top))] pb-24 rounded-b-[3rem] -mt-[env(safe-area-inset-top)] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-foreground/5 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-2xl text-primary-foreground font-black tracking-tight">{t('My Profile', 'حسابي')}</h2>
          <div className="flex gap-2 items-center">
             <div className="bg-white/10 backdrop-blur-md p-0.5 rounded-2xl border border-white/10 shadow-inner">
               <NotificationDropdown iconClassName="text-primary-foreground" />
             </div>
             <button
               onClick={handleLogout}
               className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/20 transition-all active:scale-95 shadow-inner"
             >
               <LogOut className="h-5 w-5 text-primary-foreground" />
             </button>
          </div>
        </div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2rem] bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40 shadow-2xl transition-transform group-hover:scale-105 duration-300">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
            <button
              onClick={() => { setEditName(userData?.name || ''); setEditPhone(userData?.phone || ''); setIsEditProfileOpen(true); }}
              className="absolute -bottom-2 -right-2 w-9 h-9 bg-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-white/90 transition-all active:scale-90 border-4 border-primary"
              title={t('Edit Profile', 'تعديل الملف')}
            >
              <Settings className="h-4 w-4 text-primary" />
            </button>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl text-primary-foreground font-black tracking-tight leading-none mb-2">
              {userData?.name || t('Guest User', 'مستخدم زائر')}
            </h3>
            <p className="text-primary-foreground/70 text-sm font-medium">{userData?.email || t('Not logged in', 'لم يتم تسجيل الدخول')}</p>
            <div className="mt-3 flex gap-2">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest text-primary-foreground/80 border border-white/10">
                {userData?.role || 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - More premium look */}
      <div className="px-6 -mt-14 mb-8 relative z-20">
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'bookings', icon: Calendar, label: t('Bookings', 'الحجوزات'), value: bookings.length },
            { id: 'saved', icon: Heart, label: t('Saved', 'المحفوظات'), value: savedVenues.length },
            { id: 'settings', icon: Settings, label: t('Settings', 'الإعدادات'), value: null }
          ].map((item) => (
            <Card
              key={item.id}
              className={`p-4 rounded-[2rem] text-center cursor-pointer transition-all border-none shadow-xl hover:shadow-2xl active:scale-95 ${activeTab === item.id ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-card text-card-foreground'}`}
              onClick={() => handleTabChange(item.id)}
            >
              <item.icon className={`h-6 w-6 mx-auto mb-2 ${activeTab === item.id ? 'text-primary-foreground' : 'text-primary'}`} />
              {item.value !== null && <p className="text-2xl mb-0.5 font-black leading-none">{item.value}</p>}
              <p className={`text-[10px] uppercase tracking-widest font-black opacity-60 ${item.value === null ? 'mt-2' : ''}`}>{item.label}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="px-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="flex w-full overflow-x-auto scrollbar-hide mb-8 text-[10px] h-12 bg-muted/30 p-1.5 rounded-[1.5rem] gap-1 shrink-0 border border-muted/50">
            <TabsTrigger value="bookings" className="rounded-xl flex-shrink-0 px-4 font-black uppercase tracking-tighter">{t('Bookings', 'الحجوزات')}</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-xl flex-shrink-0 px-4 font-black uppercase tracking-tighter">{t('Saved', 'المحفوظات')}</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl flex-shrink-0 px-4 font-black uppercase tracking-tighter">{t('Settings', 'الإعدادات')}</TabsTrigger>
            <TabsTrigger value="support" className="rounded-xl flex-shrink-0 px-4 font-black uppercase tracking-tighter">{t('Support', 'الدعم')}</TabsTrigger>
            <TabsTrigger value="faq" className="rounded-xl flex-shrink-0 px-4 font-black uppercase tracking-tighter">{t('FAQ', 'الأسئلة')}</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {bookings.length > 0 ? bookings.map((booking) => (
              <Card
                key={booking.id}
                className="overflow-hidden cursor-pointer hover:shadow-xl transition-all active:scale-[0.98] border-none shadow-md rounded-[2rem] group"
                onClick={() => navigate(`/confirmation/${booking.id}`)}
              >
                <div className="flex gap-0">
                  <div className="relative w-32 h-32 overflow-hidden shrink-0">
                    <img
                      src={booking.venueImage || '/placeholder.jpg'}
                      alt={booking.venueName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-1 p-5 bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-black text-sm group-hover:text-primary transition-colors line-clamp-1">{booking.venueName}</h4>
                      <div className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {booking.status.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold mb-4">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] text-primary/50 font-black uppercase tracking-widest">#{booking.serialId || booking.id.slice(0, 8)}</p>
                       {booking.status === 'confirmed' && (
                         <Button 
                            variant="default" 
                            size="sm" 
                            className="text-[9px] h-8 px-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-black uppercase tracking-widest shadow-lg shadow-green-200" 
                            onClick={(e) => { e.stopPropagation(); handleDownloadReceipt(booking); }}
                          >
                           {language === 'ar' ? 'الإيصال' : 'Receipt'}
                         </Button>
                       )}
                    </div>
                  </div>
                </div>
              </Card>
            )) : (
              <div className="text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed border-muted">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="font-bold text-muted-foreground">{t('No bookings found', 'لا توجد حجوزات')}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {savedVenues.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {savedVenues.map((venue) => (
                  <Card
                    key={venue.id}
                    className="overflow-hidden cursor-pointer hover:shadow-xl transition-all active:scale-[0.98] border-none shadow-md rounded-[2rem] group"
                    onClick={() => navigate(`/venue/${venue.id}`)}
                  >
                    <div className="flex gap-0">
                      <div className="relative w-32 h-32 overflow-hidden shrink-0">
                        <img src={venue.images?.[0] || '/placeholder.jpg'} alt={venue.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute top-2 left-2 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </div>
                      </div>
                      <div className="flex-1 p-5 bg-card">
                        <h4 className="font-black text-sm group-hover:text-primary transition-colors line-clamp-1 mb-1">{language === 'ar' ? venue.nameAr : venue.name}</h4>
                        <div className="flex items-center gap-2 mb-3 text-[10px] text-muted-foreground font-bold">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="line-clamp-1">{venue.location}</span>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-0.5 rounded-full">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-[10px] font-black text-yellow-700">{venue.rating}</span>
                          </div>
                          <p className="text-primary font-black text-sm">{venue.price.toLocaleString()} <span className="text-[10px] font-bold opacity-60">{t('EGP', 'ج.م')}</span></p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed border-muted">
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="font-bold text-muted-foreground">{t('No saved venues', 'لا توجد محفوظات')}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              {/* Account Section */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 px-4">{t('Account Settings', 'إعدادات الحساب')}</h4>
                <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
                  <div className="divide-y divide-muted/50">
                    <button
                      onClick={() => { setEditName(userData?.name || ''); setEditPhone(userData?.phone || ''); setIsEditProfileOpen(true); }}
                      className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-all active:bg-muted/50 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="text-left rtl:text-right">
                          <p className="font-bold text-sm">{t('Personal Info', 'المعلومات الشخصية')}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{t('Name, Phone Number', 'الاسم، رقم الهاتف')}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button 
                      onClick={() => setIsChangePasswordOpen(true)} 
                      className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-all active:bg-muted/50 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div className="text-left rtl:text-right">
                          <p className="font-bold text-sm">{t('Security', 'الأمان')}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{t('Password & Protection', 'كلمة المرور والحماية')}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                    </button>
                  </div>
                </Card>
              </div>

              {/* Preferences Section */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 px-4">{t('Preferences', 'التفضيلات')}</h4>
                <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
                  <div className="divide-y divide-muted/50">
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                          <Bell className="h-5 w-5" />
                        </div>
                        <div className="text-left rtl:text-right">
                          <p className="font-bold text-sm">{t('Notifications', 'الإشعارات')}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{notificationsEnabled ? t('Enabled', 'مفعلة') : t('Disabled', 'معطلة')}</p>
                        </div>
                      </div>
                      <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} className="data-[state=checked]:bg-primary" />
                    </div>

                    <button 
                      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} 
                      className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-all active:bg-muted/50 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div className="text-left rtl:text-right">
                          <p className="font-bold text-sm">{t('App Language', 'لغة التطبيق')}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{language === 'en' ? 'English (US)' : 'العربية (مصر)'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">{language === 'en' ? 'EN' : 'AR'}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </div>
                </Card>
              </div>

              {/* App Dashboards (Conditional) */}
              {(userData?.role === 'admin' || userData?.role === 'support' || userData?.role === 'vendor') && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 px-4">{t('Management', 'الإدارة')}</h4>
                  <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
                    <div className="divide-y divide-muted/50">
                      {(userData?.role === 'admin' || userData?.role === 'support') && (
                        <button onClick={() => navigate('/admin')} className="w-full p-5 flex items-center justify-between hover:bg-primary/5 transition-all active:bg-primary/10 group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <Shield className="h-5 w-5" />
                            </div>
                            <div className="text-left rtl:text-right">
                              <p className="font-black text-sm text-primary">{userData.role === 'support' ? t('Support Dashboard', 'لوحة تحكم الدعم') : t('Admin Dashboard', 'لوحة التحكم')}</p>
                              <p className="text-[10px] text-primary/60 font-medium">{t('Manage app settings & users', 'إدارة التطبيق والمستخدمين')}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-primary/30 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                        </button>
                      )}

                      {userData?.role === 'vendor' && (
                        <button onClick={() => navigate('/vendor')} className="w-full p-5 flex items-center justify-between hover:bg-primary/5 transition-all active:bg-primary/10 group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <Home className="h-5 w-5" />
                            </div>
                            <div className="text-left rtl:text-right">
                              <p className="font-black text-sm text-primary">{t('Vendor Dashboard', 'لوحة تحكم المزود')}</p>
                              <p className="text-[10px] text-primary/60 font-medium">{t('Manage your venues & bookings', 'إدارة قاعاتك وحجوزاتك')}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-primary/30 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* Legal & Info Section */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 px-4">{t('Legal & Info', 'قانوني')}</h4>
                <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
                  <div className="divide-y divide-muted/50">
                    <button onClick={() => navigate('/terms')} className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-all active:bg-muted/50 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 group-hover:scale-110 transition-transform">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="text-left rtl:text-right">
                          <p className="font-bold text-sm">{t('Terms of Service', 'شروط الخدمة')}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-all active:bg-muted/50 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 group-hover:scale-110 transition-transform">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div className="text-left rtl:text-right">
                          <p className="font-bold text-sm">{t('Privacy Policy', 'سياسة الخصوصية')}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                    </button>
                  </div>
                </Card>
              </div>

              {/* Danger Zone */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 mb-3 px-4">{t('Danger Zone', 'منطقة الخطر')}</h4>
                <Card className="border border-red-100 shadow-sm overflow-hidden rounded-[2rem] bg-red-50/20">
                  <button onClick={() => setIsDeleteDialogOpen(true)} className="w-full p-5 flex items-center justify-between hover:bg-red-50 transition-all active:bg-red-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="text-left rtl:text-right">
                        <p className="font-black text-sm text-red-700">{t('Delete Account', 'حذف الحساب نهائياً')}</p>
                        <p className="text-[10px] text-red-500/70 font-medium">{t('This action is permanent', 'هذا الإجراء لا يمكن التراجع عنه')}</p>
                      </div>
                    </div>
                    <Trash2 className="h-5 w-5 text-red-300 group-hover:text-red-500 transition-colors" />
                  </button>
                </Card>
              </div>

              <div className="text-center pb-8 opacity-20">
                <img src="/logo.png" alt="" className="w-12 h-12 mx-auto mb-2 grayscale" />
                <p className="text-[10px] font-black tracking-widest uppercase">Metysara v2.4.0</p>
                <p className="text-[8px] font-bold mt-1">MADE WITH ❤️ IN CAIRO</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="support" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-6 border-none shadow-xl bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h3 className="text-lg font-black mb-2 flex items-center gap-2 relative z-10">
                 <MessageSquare className="h-5 w-5" />
                 {t('Live Chat', 'محادثة مباشرة')}
              </h3>
              <p className="text-xs text-primary-foreground/80 mb-6 font-medium relative z-10">
                 {t('Chat directly with our support team for quick assistance and real-time support.', 'تحدث مباشرة مع فريق الدعم لدينا للحصول على مساعدة سريعة ودعم فوري.')}
              </p>
              <Button className="w-full h-14 rounded-2xl bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest shadow-xl shadow-black/10 transition-transform active:scale-95" onClick={() => navigate('/chat')}>
                 <MessageSquare className="w-5 h-5 mr-2" /> {t('Start Live Chat', 'بدء محادثة مباشرة')}
              </Button>
            </Card>

            <Card className="p-6 border-none shadow-md rounded-[2.5rem] bg-card">
              <h3 className="text-base font-black mb-6 flex items-center gap-2">
                 <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                 </div>
                 {t('Send a Ticket', 'إرسال تذكرة')}
              </h3>
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">{t('Subject', 'الموضوع')}</label>
                    <Input placeholder={t('Ticket Subject', 'موضوع التذكرة')} value={newTicketSubject} onChange={(e) => setNewTicketSubject(e.target.value)} className="h-12 bg-muted/30 border-none rounded-2xl px-5" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">{t('Message', 'الرسالة')}</label>
                    <Textarea placeholder={t('How can we help you?', 'كيف يمكننا مساعدتك؟')} className="min-h-[120px] bg-muted/30 border-none rounded-2xl p-5" value={newTicketMessage} onChange={(e) => setNewTicketMessage(e.target.value)} />
                 </div>
                 <Button className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-transform active:scale-95 mt-2" onClick={handleSubmitTicket} disabled={isSubmittingTicket || !newTicketSubject || !newTicketMessage}>
                    <Send className="w-4 h-4 mr-2" /> {t('Submit Ticket', 'إرسال التذكرة')}
                 </Button>
              </div>
            </Card>

            {tickets.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4">{t('Recent Tickets', 'التذاكر السابقة')}</h4>
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="p-5 border-none shadow-sm rounded-2xl hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-sm truncate pr-4">{ticket.subject}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{ticket.message}</p>
                    <p className="text-[9px] text-muted-foreground/50 font-medium">
                      {ticket.createdAt?.toMillis ? new Date(ticket.createdAt.toMillis()).toLocaleDateString() : ''}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="faq" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-8 border-none shadow-xl rounded-[3rem] space-y-8 bg-card relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-12 -mt-12" />
              <h3 className="text-xl font-black tracking-tight">{t('Common Questions', 'الأسئلة الشائعة')}</h3>
              
              <div className="space-y-8">
                {[
                  { q: t('How do I book a venue?', 'كيف يمكنني حجز مكان؟'), a: t('Browse venues, select a date and slot, and submit a request. Pay 20% deposit after confirmation.', 'تصفح الأماكن، اختر التاريخ والفترة، وقدم طلباً. ادفع 20% عربون بعد التأكيد.') },
                  { q: t('When is the balance paid?', 'متى أدفع المبلغ المتبقي؟'), a: t('The remaining 80% is paid directly to the venue provider on the day of your event.', 'يتم دفع الـ 80% المتبقية مباشرة لمقدم الخدمة في يوم الحدث الخاص بك.') },
                  { q: t('What is the refund policy?', 'ما هي سياسة الاسترجاع؟'), a: t('Refunds depend on the venue\'s specific policy shown during the booking process.', 'الاسترداد يعتمد على سياسة المكان الموضحة أثناء عملية الحجز.') },
                  { q: t('How to contact support?', 'كيف أتواصل مع الدعم؟'), a: t('Use Live Chat for instant help or submit a ticket for non-urgent inquiries.', 'استخدم المحادثة المباشرة للمساعدة الفورية أو أرسل تذكرة للاستفسارات.') }
                ].map((faq, i) => (
                  <div key={i} className="group">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-black text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-black text-sm mb-2 group-hover:text-primary transition-colors">{faq.q}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Unified Bottom Navigation - More premium look */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-primary/5 px-8 py-5 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {[
            { id: 'home', icon: Home, label: t('Home', 'الرئيسية'), path: '/home' },
            { id: 'search', icon: Search, label: t('Explore', 'استكشف'), path: '/search' },
            { id: 'saved', icon: Heart, label: t('Saved', 'المحفوظات'), action: () => handleTabChange('saved'), active: activeTab === 'saved' },
            { id: 'bookings', icon: Calendar, label: t('Bookings', 'الحجوزات'), action: () => handleTabChange('bookings'), active: activeTab === 'bookings' }
          ].map((item) => (
            <button 
              key={item.id}
              className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${item.active || (item.id === 'home' && location.pathname === '/home') || (item.id === 'search' && location.pathname === '/search') ? 'text-primary' : 'text-muted-foreground opacity-50'}`} 
              onClick={item.path ? () => navigate(item.path!) : item.action}
            >
              <item.icon className={`h-6 w-6 ${item.active || (item.id === 'home' && location.pathname === '/home') || (item.id === 'search' && location.pathname === '/search') ? 'fill-primary/10' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-[400px] rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6">{t('Edit Profile', 'تعديل الملف الشخصي')}</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Full Name', 'الاسم بالكامل')}</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Phone', 'رقم الهاتف')}</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} type="tel" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsEditProfileOpen(false)}>
                  {t('Cancel', 'إلغاء')}
                </Button>
                <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90" onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? t('Updating...', 'جاري التعديل...') : t('Save Changes', 'حفظ التعديلات')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-[400px] rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6">{t('Change Password', 'تغيير كلمة المرور')}</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Current Password', 'كلمة المرور الحالية')}</label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('New Password', 'كلمة المرور الجديدة')}</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsChangePasswordOpen(false)}>
                  {t('Cancel', 'إلغاء')}
                </Button>
                <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90" onClick={handleChangePassword} disabled={isChangingPassword || !currentPassword || !newPassword}>
                  {isChangingPassword ? t('Updating...', 'جاري التحديث...') : t('Update Password', 'تحديث كلمة المرور')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Account Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl mx-auto p-6 top-[50%] -translate-y-[50%]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              {language === 'ar' ? 'هل أنت متأكد؟' : 'Are you absolutely sure?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {language === 'ar' 
                ? 'هل أنت متأكد من مسح حسابك نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وكل بياناتك ستُمحى.' 
                : 'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be wiped.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-4">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl mt-0">{t('Cancel', 'إلغاء')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600"
            >
              {t('Delete', 'مسح')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
