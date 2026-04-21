import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Calendar } from '../components/ui/calendar';
import { useVenues } from '../context/VenuesContext';
import { useAuth } from '../context/AuthContext';
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

import { auth, db, storage, firebaseConfig } from '../services/firebase';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, getDocs, getDoc, arrayUnion, deleteDoc, serverTimestamp, addDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { NotificationDropdown } from '../components/ui/NotificationDropdown';
import { createNotification } from '../utils/notifications';
import { optimizeImage } from '../utils/imageOptimization';
import {
  ArrowLeft,
  Plus,
  MapPin,
  DollarSign,
  Users,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Save,
  Upload,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  MessageSquare,
  Send,
  Reply,
  Package,
  FileText,
  Eye,
  BarChart3,
  Shield,
  Key,
  Star,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { SeedArabicLoader } from '../components/SeedArabicLoader';

export function AdminDashboardScreen() {
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const isSupport = userData?.role === 'support';
  const { venues, updateVenue } = useVenues();
  const [editingVenue, setEditingVenue] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingCalendarFor, setViewingCalendarFor] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Vendor Form State
  const [isAddVendorDialogOpen, setIsAddVendorDialogOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    venueName: '',
    category: 'venue',
    locationLink: ''
  });

  const [isAddSupportDialogOpen, setIsAddSupportDialogOpen] = useState(false);
  const [newSupport, setNewSupport] = useState({ name: '', email: '', password: '', phone: '' });

  const [viewingVenue, setViewingVenue] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [bookings, setBookings] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [liveChats, setLiveChats] = useState<any[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'venue' | 'review' } | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [policies, setPolicies] = useState({ termsEn: '', termsAr: '', privacyEn: '', privacyAr: '', isSaving: false });
  const [reviews, setReviews] = useState<any[]>([]);

  // Marketing Notification State
  const [promoTitle, setPromoTitle] = useState('');
  const [promoBody, setPromoBody] = useState('');
  const [isSendingPromo, setIsSendingPromo] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState('');

  // Global feedback banner state
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminError, setAdminError] = useState('');
  const showSuccess = (msg: string) => { setAdminSuccess(msg); setAdminError(''); setTimeout(() => setAdminSuccess(''), 4000); };
  const showError = (msg: string) => { setAdminError(msg); setAdminSuccess(''); setTimeout(() => setAdminError(''), 6000); };

  // Reset confirmation state
  const [resetStep, setResetStep] = useState(0); // 0=idle, 1=confirm1, 2=confirm2
  const [resetInput, setResetInput] = useState('');
  
  const handleSendPromo = async () => {
    if (!promoTitle.trim() || !promoBody.trim()) return;
    setIsSendingPromo(true);
    try {
      await addDoc(collection(db, 'global_notifications'), {
        title: promoTitle,
        body: promoBody,
        createdAt: serverTimestamp(),
        sentBy: userData?.uid || 'admin',
        status: 'pending'
      });
      setPromoSuccess('Global notification scheduled successfully!');
      setPromoTitle('');
      setPromoBody('');
      setTimeout(() => setPromoSuccess(''), 5000);
    } catch (e: any) {
      showError('Error scheduling notification: ' + e.message);
    }
    setIsSendingPromo(false);
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'bookings'));
        const bookingsWithDetails = await Promise.all(snapshot.docs.map(async (bDoc) => {
          const bData = bDoc.data();
          const bId = bDoc.id;
          let fullData: any = { id: bId, ...bData };
          
          // Fetch private details if missing (due to refactor)
          if (!bData.customerName || !bData.customerPhone) {
            try {
              const pSnap = await getDocs(collection(db, 'bookings', bId, 'private_details'));
              const pDoc = pSnap.docs.find(d => d.data().type === 'contact');
              if (pDoc) {
                const pData = pDoc.data();
                fullData = {
                  ...fullData,
                  customerName: pData.customerName || fullData.customerName,
                  customerPhone: pData.customerPhone || fullData.customerPhone,
                  customerEmail: pData.customerEmail || fullData.customerEmail,
                  notes: pData.notes || fullData.notes,
                  services: pData.services || fullData.services,
                };
              }
            } catch (e) {
              console.log(`Could not fetch details for booking ${bId}:`, e);
            }
          }
          return fullData;
        }));
        
        setBookings(bookingsWithDetails.sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        }));
        
        const tSnap = await getDocs(collection(db, 'tickets'));
        const tData = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setTickets(tData);

        const cSnap = await getDocs(query(collection(db, 'chats'), orderBy('updatedAt', 'desc')));
        const cData = cSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLiveChats(cData);

        const pSnap = await getDoc(doc(db, 'settings', 'legal'));
        if (pSnap.exists()) {
          setPolicies((p) => ({ ...p, ...pSnap.data(), isSaving: false }));
        }

        // Fetch all reviews
        const rSnap = await getDocs(collection(db, 'comments'));
        const rData = rSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setReviews(rData);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      }
    };
    fetchData();
  }, []);

  const fetchLiveChats = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'chats'), orderBy('updatedAt', 'desc')));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLiveChats(data);
    } catch (err) {
      console.error("Error fetching live chats:", err);
    }
  };

  const handleSavePolicies = async () => {
    setPolicies(p => ({ ...p, isSaving: true }));
    try {
      await setDoc(doc(db, 'settings', 'legal'), {
        termsEn: policies.termsEn,
        termsAr: policies.termsAr,
        privacyEn: policies.privacyEn,
        privacyAr: policies.privacyAr,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showSuccess('Policies saved successfully!');
    } catch(e: any) { showError(e.message); }
    setPolicies(p => ({ ...p, isSaving: false }));
  };

  const handleResetVendorPassword = async (venue: any) => {
    try {
      if (!venue.ownerId) { showError('No owner assigned to this venue.'); return; }
      const userDoc = await getDoc(doc(db, 'users', venue.ownerId));
      if (!userDoc.exists()) { showError('Vendor user account not found.'); return; }
      const vendorEmail = userDoc.data().email;
      if (!vendorEmail) { showError('No email found for this vendor.'); return; }
      await sendPasswordResetEmail(auth, vendorEmail);
      showSuccess(`Password reset email sent to ${vendorEmail}.`);
    } catch (e: any) {
      showError('Error sending reset email: ' + e.message);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus });
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        const label = newStatus === 'confirmed' ? 'Confirmed ✅' : 'Rejected';
        await createNotification(booking.customerId, `Booking ${label}`, `Your booking for ${booking.venueName} on ${booking.date} has been ${newStatus === 'confirmed' ? 'confirmed! You can now proceed with payment.' : 'rejected. Please try a different date.'}`);
        await createNotification(booking.vendorId, `Booking ${label}`, `The booking for ${booking.venueName} on ${booking.date} has been ${newStatus} by Admin.`);
      }
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      showSuccess(`Booking ${newStatus === 'confirmed' ? 'approved and confirmed' : 'rejected'} successfully.`);
    } catch (e: any) {
      showError('Error updating booking: ' + e.message);
    }
  };

  const handleReplyToTicket = async (ticketId: string) => {
    const text = replyText[ticketId];
    if (!text || !text.trim()) return;
    try {
      const replyObj = {
        message: text,
        adminName: isSupport ? 'Support' : 'Admin',
        createdAt: new Date()
      };
      await updateDoc(doc(db, 'tickets', ticketId), {
        replies: arrayUnion(replyObj),
        status: 'resolved'
      });
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        await createNotification(ticket.userId, 'Support Reply', `${isSupport ? 'Support' : 'Admin'} has replied to your ticket: "${ticket.subject}"`);
      }
      setTickets(tickets.map(t => {
        if (t.id === ticketId) return { ...t, status: 'resolved', replies: [...(t.replies || []), replyObj] };
        return t;
      }));
      setReplyText({ ...replyText, [ticketId]: '' });
      showSuccess('Reply sent successfully!');
    } catch (e: any) {
      showError('Error sending reply: ' + e.message);
    }
  };

  const handleEscalateTicket = async (ticketId: string) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), { status: 'escalated' });
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'escalated' } : t));
      showSuccess('Ticket escalated to Admin.');
    } catch (e: any) {
      showError('Error escalating ticket: ' + e.message);
    }
  };

  const handleAddSupport = async () => {
    if (!newSupport.email.toLowerCase().endsWith('@metysarasupport.com')) {
      showError('Support emails must end with @metysarasupport.com');
      return;
    }
    try {
      const appName = 'SecondaryApp';
      const secondaryApp = getApps().find(app => app.name === appName) || initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, newSupport.email, newSupport.password);
      await secondaryAuth.signOut();
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email: newSupport.email,
        name: newSupport.name,
        phone: newSupport.phone,
        role: 'support'
      });
      setIsAddSupportDialogOpen(false);
      setNewSupport({ name: '', email: '', password: '', phone: '' });
      showSuccess('Support Agent registered successfully!');
    } catch (error: any) {
      console.error('Error creating support:', error);
      showError('Error: ' + error.message);
    }
  };

  const handleResetAllData = async () => {
    if (resetStep === 0) { setResetStep(1); return; }
    if (resetStep === 1 && resetInput !== 'RESET') {
      showError('You must type RESET (in capitals) exactly.');
      return;
    }
    setResetStep(0);
    setResetInput('');
    try {
      const collectionsToReset = ['bookings', 'tickets', 'notifications'];
      for (const colName of collectionsToReset) {
        const snapshot = await getDocs(collection(db, colName));
        for (const d of snapshot.docs) {
          await deleteDoc(doc(db, colName, d.id));
        }
      }
      setBookings([]);
      setTickets([]);
      showSuccess('Database reset successfully.');
    } catch (error: any) {
      showError('Reset error: ' + error.message);
    }
  };

  const handleAddVendor = async () => {
    if (!newVendor.email.toLowerCase().endsWith('@metysaravendors.com')) {
      showError('Vendor emails must end with @metysaravendors.com');
      return;
    }
    try {
      const appName = 'SecondaryApp';
      const secondaryApp = getApps().find(app => app.name === appName) || initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, newVendor.email, newVendor.password);
      await secondaryAuth.signOut();
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email: newVendor.email,
        name: newVendor.name,
        phone: newVendor.phone,
        role: 'vendor',
        venueName: newVendor.venueName
      });
      const venueId = Date.now().toString();
      await setDoc(doc(db, 'venues', venueId), {
        id: venueId,
        ownerId: userCred.user.uid,
        name: newVendor.venueName,
        nameAr: newVendor.venueName,
        description: 'New vendor venue pending setup.',
        descriptionAr: '',
        price: 0,
        capacity: 0,
        location: '',
        locationLink: newVendor.locationLink || '',
        zone: '',
        images: [],
        type: newVendor.category,
        rating: 0,
        reviews: 0,
        packages: [],
        amenities: []
      });
      setIsAddVendorDialogOpen(false);
      setNewVendor({ name: '', email: '', password: '', phone: '', venueName: '', category: 'venue', locationLink: '' });
      showSuccess('Vendor registered successfully!');
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      showError('Error: ' + error.message);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    try {
      await deleteDoc(doc(db, 'venues', venueId));
      showSuccess('Venue deleted successfully.');
    } catch (e: any) {
      showError('Error deleting venue: ' + e.message);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, 'comments', reviewId));
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      showSuccess('Review deleted.');
    } catch (e: any) {
      showError('Error deleting review: ' + e.message);
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'venue') {
      handleDeleteVenue(deleteTarget.id);
    } else {
      handleDeleteReview(deleteTarget.id);
    }
    setIsDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleEditVenue = (venue: any) => {
    setEditingVenue({ ...venue });
    setIsEditDialogOpen(true);
  };

  const pendingVenues = venues.filter((v: any) => v.pendingEdits);

  const handleApproveEdits = async (venue: any) => {
    if (!venue.pendingEdits) return;
    try {
      const mergedData = {
        price: venue.pendingEdits.price ?? venue.price,
        capacity: venue.pendingEdits.capacity ?? venue.capacity,
        description: venue.pendingEdits.description ?? venue.description,
        descriptionAr: venue.pendingEdits.descriptionAr ?? venue.descriptionAr,
        type: venue.pendingEdits.type ?? venue.type,
        images: venue.pendingEdits.images ?? venue.images,
        amenities: venue.pendingEdits.amenities ?? venue.amenities,
        packages: venue.pendingEdits.packages ?? venue.packages,
        services: venue.pendingEdits.services ?? venue.services ?? [],
        location: venue.pendingEdits.location ?? venue.location ?? '',
        locationLink: venue.pendingEdits.locationLink ?? venue.locationLink ?? '',
        policies: venue.pendingEdits.policies ?? venue.policies ?? '',
        policiesAr: venue.pendingEdits.policiesAr ?? venue.policiesAr ?? '',
        timeSlots: venue.pendingEdits.timeSlots ?? venue.timeSlots ?? {},
        pendingEdits: null
      };
      await updateDoc(doc(db, 'venues', venue.id), mergedData);
      showSuccess('Vendor edits approved and pushed live!');
    } catch (e: any) {
      showError('Error approving edits: ' + e.message);
    }
  };

  const handleRejectEdits = async (venue: any) => {
    try {
      await updateDoc(doc(db, 'venues', venue.id), { pendingEdits: null });
      showSuccess('Vendor edits rejected.');
    } catch (e: any) {
      showError('Error rejecting edits: ' + e.message);
    }
  };

  const handleSaveVenue = () => {
    if (editingVenue) {
      updateVenue(editingVenue.id, editingVenue);
      setIsEditDialogOpen(false);
      setEditingVenue(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingVenue) return;
    setIsUploading(true);
    const newImageUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const originalFile = files[i];
        const file = await optimizeImage(originalFile);
        // Use venue_images/ to match storage rules (admin: unlimited size)
        const fileRef = ref(storage, `venue_images/${editingVenue.id}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(fileRef);
        newImageUrls.push(downloadUrl);
      }
      setEditingVenue({
        ...editingVenue,
        images: [...(editingVenue.images || []), ...newImageUrls]
      });
    } catch (error) {
      console.error('Error uploading:', error);
      showError('Failed to upload images.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      pending_vendor: 'bg-orange-100 text-orange-700',
      pending_admin: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      open: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'pending_vendor':
      case 'pending_admin':
      case 'open':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-xl px-6 pt-14 pb-6 rounded-b-[2.5rem] shadow-sm sticky top-0 z-30 mb-6 border-b border-primary/5">
        {/* Row 1: Back + Title + Notification */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-muted/50 hover:bg-primary/10 text-foreground transition-all active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">
                {isSupport ? 'Support' : 'Admin'}{' '}
                <span className="text-primary">Dashboard</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1 opacity-70">
                {isSupport ? 'Agent Access' : 'Full Control'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationDropdown iconClassName="text-primary" />
          </div>
        </div>

        {/* Row 2: Action buttons */}
        {!isSupport && (
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide -mx-2 px-2">
            <Button 
              onClick={() => setIsAddSupportDialogOpen(true)} 
              variant="outline" 
              className="rounded-2xl shrink-0 h-11 px-4 border-dashed border-primary/30 hover:bg-primary/5 text-xs font-bold"
            >
              <Users className="w-4 h-4 mr-2 text-primary" /> Add Support
            </Button>
            <Button 
              onClick={() => setIsAddVendorDialogOpen(true)} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-2xl shrink-0 h-11 px-4 text-xs font-bold"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Add Vendor
            </Button>
            
            {userData?.email === 'hossam_admin@metysara.com' && (
              <div className="ml-auto flex items-center gap-2">
                {resetStep === 0 ? (
                  <Button 
                    onClick={() => setResetStep(1)} 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl shrink-0 h-11 w-11 p-0"
                    title="Reset All Data"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                    <input
                      autoFocus
                      value={resetInput}
                      onChange={e => setResetInput(e.target.value)}
                      placeholder='Type RESET'
                      className="h-11 text-xs border border-red-200 rounded-2xl px-4 w-32 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-red-300"
                    />
                    <Button 
                      onClick={handleResetAllData} 
                      variant="destructive" 
                      className="rounded-2xl h-11 px-4 text-xs font-bold shadow-lg shadow-red-200" 
                      disabled={resetInput !== 'RESET'}
                    >
                      Confirm
                    </Button>
                    <button 
                      onClick={() => { setResetStep(0); setResetInput(''); }} 
                      className="text-xs font-bold text-muted-foreground px-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global feedback banner */}
      {adminSuccess && (
        <div className="mx-4 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
          ✅ {adminSuccess}
        </div>
      )}
      {adminError && (
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium">
          ❌ {adminError}
        </div>
      )}

      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 border-none shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{venues.length}</p>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Venues</p>
          </Card>
          <Card className="p-4 border-none shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-100">
                <CalendarIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{bookings.length}</p>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Bookings</p>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs defaultValue={isSupport ? "bookings" : "venues"} className="w-full">
          <TabsList className={`flex w-full justify-start overflow-x-auto scrollbar-hide mb-6 text-[10px] h-12 bg-muted/50 p-1 rounded-xl shrink-0 gap-1`}>
            {!isSupport && <TabsTrigger value="venues" className="flex-shrink-0 px-3">Venues</TabsTrigger>}
            <TabsTrigger value="bookings" className="flex-shrink-0 px-3">Bookings</TabsTrigger>
            {!isSupport && (
              <TabsTrigger value="verification" className="flex-shrink-0 px-3">
                Verify {pendingVenues.length > 0 && `(${pendingVenues.length})`}
              </TabsTrigger>
            )}
            <TabsTrigger value="helpdesk" className="flex-shrink-0 px-3">Tickets</TabsTrigger>
            <TabsTrigger value="livechats" className="flex-shrink-0 px-3">Live Chats {liveChats.filter(c => c.unreadAdmin > 0).length > 0 && `(${liveChats.filter(c => c.unreadAdmin > 0).length})`}</TabsTrigger>
            {!isSupport && <TabsTrigger value="analytics" className="flex-shrink-0 px-3">Stats</TabsTrigger>}
            {!isSupport && <TabsTrigger value="marketing" className="flex-shrink-0 px-3">Marketing (SMS & Push)</TabsTrigger>}
            {!isSupport && <TabsTrigger value="reviews" className="flex-shrink-0 px-3">Reviews {reviews.length > 0 && `(${reviews.length})`}</TabsTrigger>}
            {!isSupport && <TabsTrigger value="policies" className="flex-shrink-0 px-3">Policies</TabsTrigger>}
          </TabsList>

          <TabsContent value="venues" className="space-y-4">
            {venues.map((venue) => (
              <Card key={venue.id} className="p-4 border-none shadow-sm">
                <div className="flex gap-4">
                  <img
                    src={venue.images?.[0] || 'https://via.placeholder.com/100'}
                    alt=""
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-bold text-sm">{venue.name}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase">{venue.type}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setViewingVenue(venue); setIsViewDialogOpen(true); }} className="p-2 hover:bg-blue-50 text-blue-500 rounded-full" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEditVenue(venue)} className="p-2 hover:bg-green-50 text-green-500 rounded-full" title="Edit Venue">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setDeleteTarget({ id: venue.id, type: 'venue' }); setIsDeleteDialogOpen(true); }} className="p-2 hover:bg-red-50 text-red-500 rounded-full" title="Delete Venue">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {venue.location}</div>
                      <div className="flex items-center gap-1"><DollarSign className="h-3 w-3"/> {venue.price.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className={`p-4 border-none shadow-sm border-l-4 ${booking.status === 'pending_admin' ? 'border-l-blue-500 bg-blue-50/10' : 'border-l-muted'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-sm">{booking.customerName}</h3>
                    <p className="text-xs text-muted-foreground">{booking.venueName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase mt-1">ID: {booking.serialId || booking.id.slice(0, 8)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-4 rounded-xl mb-4">
                  <div><span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Date & Time</span><span className="font-bold">{booking.date} • {booking.slot}</span></div>
                  <div><span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Guests</span><span className="font-bold">{booking.guests || 'N/A'}</span></div>
                  <div><span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Phone</span><span className="font-bold">{booking.customerPhone || 'N/A'}</span></div>
                  {booking.customerEmail && (
                    <div className="col-span-2"><span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Email</span><span className="font-bold text-primary">{booking.customerEmail}</span></div>
                  )}
                  {!isSupport && (
                    <div><span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Total Paid</span><span className="font-bold text-primary">{booking.totalAmount?.toLocaleString() || 0} EGP</span></div>
                  )}
                  
                  {booking.packageName && (
                     <div className="col-span-2 border-t pt-2 mt-1">
                       <span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Selected Package</span>
                       <span className="font-bold text-primary flex items-center gap-1"><Package className="h-3 w-3"/> {booking.packageName}</span>
                     </div>
                  )}

                  {booking.services && booking.services.length > 0 && (
                     <div className="col-span-2 border-t pt-2 mt-1">
                       <span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Selected Add-ons / Amenities</span>
                       <div className="flex flex-wrap gap-1">
                         {booking.services.map((srv: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white border rounded text-[10px] font-medium capitalize">{srv.replace('_', ' ')}</span>
                         ))}
                       </div>
                     </div>
                  )}

                  {booking.notes && (
                     <div className="col-span-2 border-t pt-2 mt-1">
                       <span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Customer Notes</span>
                       <span className="text-gray-700 italic">"{booking.notes}"</span>
                     </div>
                  )}
                </div>

                {booking.status === 'confirmed' && booking.fullPaymentReceived && (
                  <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-200 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-bold text-[10px] uppercase text-green-800 tracking-widest">Payment Collected</p>
                        <p className="text-[10px] text-green-700">Venue confirmed full payment.</p>
                      </div>
                    </div>
                    <a 
                      href={booking.paymentReceiptUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] font-bold bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition"
                    >
                      View Receipt
                    </a>
                  </div>
                )}

                {booking.status === 'pending_admin' && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')} className="flex-1 bg-green-600 hover:bg-green-700">Approve & Confirm</Button>
                    <Button onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')} variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">Reject</Button>
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            {pendingVenues.length === 0 ? (
              <div className="text-center py-12 opacity-50"><CheckCircle className="h-12 w-12 mx-auto mb-2"/><p>No pending approvals</p></div>
            ) : pendingVenues.map((venue: any) => (
              <Card key={venue.id} className="p-5 border-2 border-yellow-100 bg-yellow-50/10 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{venue.name}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Review Updates</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApproveEdits(venue)} className="bg-green-600 h-8 rounded-lg">Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejectEdits(venue)} className="text-red-600 h-8 rounded-lg">Reject</Button>
                  </div>
                </div>

                <div className="space-y-3 bg-white p-4 rounded-xl border border-yellow-100">
                  {venue.pendingEdits.price !== undefined && venue.pendingEdits.price !== venue.price && (
                    <div className="text-xs flex justify-between"><span>Price Change:</span> <span className="font-bold text-green-600">{venue.price} → {venue.pendingEdits.price} EGP</span></div>
                  )}
                  {venue.pendingEdits.capacity !== undefined && venue.pendingEdits.capacity !== venue.capacity && (
                    <div className="text-xs flex justify-between border-t pt-2 mt-2"><span>Capacity Change:</span> <span className="font-bold text-blue-600">{venue.capacity || 0} → {venue.pendingEdits.capacity} Guests</span></div>
                  )}
                  {venue.pendingEdits.description && venue.pendingEdits.description !== venue.description && (
                    <div className="text-xs border-t pt-2 mt-2">
                      <p className="font-bold mb-1 flex items-center gap-1"><FileText className="h-3 w-3"/> Description Updated:</p>
                      <p className="text-muted-foreground italic truncate">{venue.pendingEdits.description}</p>
                    </div>
                  )}
                  {venue.pendingEdits.amenities && JSON.stringify(venue.pendingEdits.amenities) !== JSON.stringify(venue.amenities) && (
                    <div className="text-xs border-t pt-2 mt-2">
                      <p className="font-bold mb-1 flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Amenities Updated:</p>
                      <div className="flex flex-wrap gap-1">
                        {venue.pendingEdits.amenities.map((am: string, i: number) => (
                           <span key={i} className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-700">{am}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {venue.pendingEdits.images && JSON.stringify(venue.pendingEdits.images) !== JSON.stringify(venue.images) && (
                    <div className="text-xs border-t pt-2 mt-2">
                      <p className="font-bold mb-2 flex items-center gap-1"><Upload className="h-3 w-3"/> Photos Updated:</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {venue.pendingEdits.images.map((img: string, i: number) => (
                           <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded-md border" />
                        ))}
                      </div>
                    </div>
                  )}
                  {venue.pendingEdits.packages && (
                    <div className="text-xs border-t pt-2 mt-2">
                      <p className="font-bold mb-2 flex items-center gap-1"><Package className="h-3 w-3"/> Packages Updated ({venue.pendingEdits.packages.length}):</p>
                      <div className="space-y-2">
                        {venue.pendingEdits.packages.map((pkg: any, i: number) => (
                           <div key={i} className="bg-gray-50 p-2 rounded border border-gray-100 flex justify-between">
                              <div>
                                 <p className="font-bold">{pkg.name}</p>
                                 <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{pkg.description}</p>
                              </div>
                              <span className="font-bold text-primary">{pkg.price} EGP</span>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {venue.pendingEdits.services && venue.pendingEdits.services.length > 0 && (
                    <div className="text-xs border-t pt-2 mt-2">
                      <p className="font-bold mb-2 flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Services (Add-ons) Updated ({venue.pendingEdits.services.length}):</p>
                      <div className="space-y-1">
                        {venue.pendingEdits.services.map((srv: any, i: number) => (
                           <div key={i} className="bg-gray-50 p-2 rounded border border-gray-100 flex justify-between">
                              <div>{srv.name} / {srv.nameAr}</div>
                              <span className="font-bold text-primary">{srv.price} EGP</span>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {((venue.pendingEdits.location !== undefined && venue.pendingEdits.location !== venue.location) || venue.pendingEdits.locationLink !== venue.locationLink) && (
                    <div className="text-xs border-t pt-2 mt-2">
                      <p className="font-bold mb-1 flex items-center gap-1"><MapPin className="h-3 w-3"/> Location Updated:</p>
                      {venue.pendingEdits.location && <p>Short: {venue.pendingEdits.location}</p>}
                      {venue.pendingEdits.locationLink && <p className="truncate">Link: {venue.pendingEdits.locationLink}</p>}
                    </div>
                  )}
                  {(venue.pendingEdits.policies || venue.pendingEdits.policiesAr) && (
                    <div className="text-xs border-t pt-2 mt-2">
                      <p className="font-bold mb-1 flex items-center gap-1"><FileText className="h-3 w-3"/> Policies Updated:</p>
                      {venue.pendingEdits.policies && <p className="truncate">EN: {venue.pendingEdits.policies}</p>}
                      {venue.pendingEdits.policiesAr && <p className="truncate" dir="rtl">AR: {venue.pendingEdits.policiesAr}</p>}
                    </div>
                  )}
                  {venue.pendingEdits.timeSlots && (
                    <div className="text-xs border-t pt-2 mt-2">
                      <p className="font-bold mb-1 flex items-center gap-1"><Clock className="h-3 w-3"/> Time Slots Updated:</p>
                      <p>Morning: {venue.pendingEdits.timeSlots.morningLabel}</p>
                      <p>Evening: {venue.pendingEdits.timeSlots.eveningLabel}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="helpdesk" className="space-y-4">
             {isSupport ? (
                // Support View tickets
               tickets.filter(t => t.status !== 'escalated').map(ticket => (
                  <Card key={ticket.id} className="p-4 border-none shadow-sm border-l-4 border-l-purple-500">
                     <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-sm">{ticket.subject}</h5>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{ticket.status}</span>
                     </div>
                     {/* Customer contact info visible to support */}
                     <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                       {ticket.userName && <p className="text-xs font-bold text-primary flex items-center gap-1"><span className="text-muted-foreground font-normal">From:</span> {ticket.userName}</p>}
                       {ticket.userEmail && <p className="text-xs font-bold text-primary flex items-center gap-1"><span className="text-muted-foreground font-normal">Email:</span> {ticket.userEmail}</p>}
                       {ticket.userPhone && <p className="text-xs font-bold text-primary"><span className="text-muted-foreground font-normal">Phone:</span> {ticket.userPhone}</p>}
                     </div>
                     <p className="text-xs text-muted-foreground mb-3 italic">"{ticket.message}"</p>
                     {ticket.status === 'open' && (
                        <div className="flex flex-col gap-2">
                           <div className="flex gap-2">
                             <Input placeholder="Type reply..." value={replyText[ticket.id] || ''} onChange={e => setReplyText({...replyText, [ticket.id]: e.target.value})} className="h-8 text-xs" />
                             <Button size="sm" onClick={() => handleReplyToTicket(ticket.id)} className="bg-purple-600 h-8">Reply</Button>
                           </div>
                           <Button size="sm" variant="outline" onClick={() => handleEscalateTicket(ticket.id)} className="text-red-500 border-red-200 mt-2 h-8 w-full">Escalate to Admin</Button>
                        </div>
                     )}
                  </Card>
               ))
             ) : (
               // Admin View
               tickets.map(ticket => (
                  <Card key={ticket.id} className={`p-4 border-none shadow-sm border-l-4 ${ticket.status === 'escalated' ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <h5 className="font-bold text-sm">Ticket #{ticket.id.slice(0, 8)} - {ticket.subject}</h5>
                           <p className="text-[10px] text-muted-foreground">Opened by ID: {ticket.userId || 'Unknown'}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                           ticket.status === 'escalated' ? 'bg-red-100 text-red-800' : 
                           ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>{ticket.status}</span>
                     </div>
                     <div className="text-xs bg-muted/30 p-3 rounded-lg mt-3">
                        <p className="font-medium mb-1">Status Update:</p>
                        {ticket.status === 'resolved' ? (
                           <p className="text-green-700">Replied & Closed by Support.</p>
                        ) : ticket.status === 'escalated' ? (
                           <p className="text-red-600 font-bold">Requires Admin Attention!</p>
                        ) : (
                           <p className="text-muted-foreground">Pending Support Reply.</p>
                        )}
                        {ticket.replies && ticket.replies.length > 0 && (
                           <p className="mt-2 text-primary italic border-t border-border/50 pt-2">Last Reply: {ticket.replies[ticket.replies.length - 1].message}</p>
                        )}
                     </div>
                  </Card>
               ))
             )}
          </TabsContent>

          <TabsContent value="livechats" className="space-y-4">
             <div className="flex items-center justify-between mb-6 bg-primary/5 p-4 rounded-3xl border border-primary/10">
               <div>
                 <h2 className="text-lg font-black flex items-center gap-2">
                   <MessageSquare className="h-5 w-5 text-primary" />
                   Live Support <span className="text-primary/50 text-sm font-normal">({liveChats.length})</span>
                 </h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active Customer Sessions</p>
               </div>
               <Button size="sm" variant="ghost" onClick={fetchLiveChats} className="rounded-xl hover:bg-primary/10 text-primary">
                 <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
               </Button>
             </div>
             
             {liveChats.length === 0 ? (
               <div className="text-center py-24 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted">
                 <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                 <p className="text-sm text-muted-foreground font-medium">No active chats at the moment.</p>
                 <p className="text-[10px] text-muted-foreground mt-1">New chats will appear here automatically.</p>
               </div>
             ) : (
               <div className="grid gap-3">
                 {liveChats.filter(chat => isSupport ? chat.supportId === currentUser?.uid : true).map((chat) => (
                   <Card 
                     key={chat.id} 
                     className="p-5 border-none shadow-sm cursor-pointer hover:shadow-md hover:bg-muted/50 transition-all active:scale-[0.98] rounded-3xl group relative overflow-hidden"
                     onClick={() => navigate(`/chat?admin=${chat.id}`)}
                   >
                     {chat.unreadAdmin > 0 && (
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(201,169,110,0.5)]" />
                     )}
                     <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg shadow-inner">
                           {chat.userName?.charAt(0)?.toUpperCase() || 'U'}
                         </div>
                         <div>
                           <h5 className="font-bold text-sm flex items-center gap-2 group-hover:text-primary transition-colors">
                             {chat.userName || 'Customer'}
                             {chat.unreadAdmin > 0 && (
                               <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-lg shadow-red-200">
                                 {chat.unreadAdmin} NEW
                               </span>
                             )}
                           </h5>
                           <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                             Last interaction: {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                           </p>
                         </div>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${chat.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {chat.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                       </div>
                     </div>
                     {chat.lastMessage && (
                       <div className="mt-3 pl-16">
                         <p className="text-xs text-muted-foreground line-clamp-1 italic italic">
                           "{chat.lastMessage}"
                         </p>
                       </div>
                     )}
                   </Card>
                 ))}
               </div>
             )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 border-none shadow-sm flex flex-col items-center justify-center text-center">
                   <div className="p-3 bg-blue-100 rounded-full mb-3 text-blue-600"><TrendingUp className="h-6 w-6"/></div>
                   <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-primary">
                     {bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()} EGP
                   </p>
                   <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Total Platform Revenue</p>
                </Card>
                <Card className="p-6 border-none shadow-sm flex flex-col items-center justify-center text-center">
                   <div className="p-3 bg-green-100 rounded-full mb-3 text-green-600"><BarChart3 className="h-6 w-6"/></div>
                   <p className="text-3xl font-bold text-green-600">{bookings.length}</p>
                   <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Total Bookings</p>
                </Card>
             </div>

             <Card className="p-6 border-none shadow-sm">
                <h3 className="font-bold mb-6 text-lg">Booking Volume by Status</h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                         { name: 'Pending', count: bookings.filter(b => b.status === 'pending_vendor' || b.status === 'pending_admin').length },
                         { name: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
                         { name: 'Rejected', count: bookings.filter(b => b.status === 'rejected').length }
                      ]}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                   </ResponsiveContainer>
                 </div>
             </Card>
          </TabsContent>

          <TabsContent value="marketing" className="space-y-6">
             <Card className="p-6 border-none shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                  <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                    <Send className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">Global Notifications & Promos</h3>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6">
                  Send a <b>Global Push Notification</b> to ALL registered users. This is free and unlimited. 
                  <br /><br />
                  <i>Note: For actual SMS (text messages) to phone numbers, an API provider like Twilio is required. Contact support to integrate your account.</i>
                </p>

                <div className="space-y-4 max-w-xl">
                   <div>
                     <label className="text-xs font-bold text-muted-foreground mb-1 block">Notification Title</label>
                     <Input 
                        placeholder="e.g. 🎁 Special Ramadan Discount!" 
                        value={promoTitle} 
                        onChange={e => setPromoTitle(e.target.value)} 
                        className="h-12 border-none bg-muted/50 rounded-xl"
                     />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-muted-foreground mb-1 block">Notification Message</label>
                     <Textarea 
                        placeholder="e.g. Get 20% off all venues when you book this week..." 
                        value={promoBody} 
                        onChange={e => setPromoBody(e.target.value)} 
                        className="min-h-[120px] bg-muted/50 border-none rounded-xl mt-1" 
                     />
                   </div>

                   {promoSuccess && (
                     <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
                       ✅ {promoSuccess}
                     </div>
                   )}

                   <Button 
                      onClick={handleSendPromo} 
                      disabled={isSendingPromo || !promoTitle.trim() || !promoBody.trim()} 
                      className="w-full h-12 text-md font-bold rounded-xl mt-4 bg-purple-600 hover:bg-purple-700"
                   >
                     {isSendingPromo ? 'Sending...' : 'Send Global Push Notification'}
                   </Button>
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
             <Card className="p-6 border-none shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                  <Shield className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">Global App Policies</h3>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-4">
                     <h4 className="font-bold">Terms of Service</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="text-xs font-bold text-muted-foreground mb-1 block">English terms</label>
                         <Textarea className="h-48" value={policies.termsEn} onChange={e => setPolicies({...policies, termsEn: e.target.value})} />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-muted-foreground mb-1 block">Arabic terms</label>
                         <Textarea className="h-48" dir="rtl" value={policies.termsAr} onChange={e => setPolicies({...policies, termsAr: e.target.value})} />
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4 border-t pt-6">
                     <h4 className="font-bold">Privacy Policy</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="text-xs font-bold text-muted-foreground mb-1 block">English privacy</label>
                         <Textarea className="h-48" value={policies.privacyEn} onChange={e => setPolicies({...policies, privacyEn: e.target.value})} />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-muted-foreground mb-1 block">Arabic privacy</label>
                         <Textarea className="h-48" dir="rtl" value={policies.privacyAr} onChange={e => setPolicies({...policies, privacyAr: e.target.value})} />
                       </div>
                     </div>
                   </div>

                   <Button onClick={handleSavePolicies} disabled={policies.isSaving} className="w-full h-12 text-lg rounded-xl mt-4">
                      {policies.isSaving ? 'Saving...' : 'Save All Policies'}
                   </Button>
                </div>
             </Card>
           </TabsContent>

          {/* ── Reviews Tab ── */}
          <TabsContent value="reviews" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold">All Customer Reviews</h2>
              <span className="text-xs text-muted-foreground">{reviews.length} total</span>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-16 opacity-50">
                <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No reviews yet</p>
              </div>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} className="p-4 border-none shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm truncate">{review.userName || 'Anonymous'}</p>
                        <div className="flex gap-0.5 shrink-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1">
                        Venue ID: <span className="font-mono">{review.venueId}</span> &bull; {new Date(review.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{review.comment}</p>
                      {review.photos && review.photos.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {review.photos.map((photo: string, pi: number) => (
                            <img key={pi} src={photo} alt="" className="w-12 h-12 object-cover rounded-lg border" />
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setDeleteTarget({ id: review.id, type: 'review' }); setIsDeleteDialogOpen(true); }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                      title="Delete Review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Support Dialog */}
      <Dialog open={isAddSupportDialogOpen} onOpenChange={setIsAddSupportDialogOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-3xl mx-auto p-6 top-[50%] -translate-y-[50%]">
          <DialogHeader>
            <DialogTitle className="text-xl">Register Support Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Full Name" value={newSupport.name} onChange={e => setNewSupport({...newSupport, name: e.target.value})} />
            <Input placeholder="Email (@metysarasupport.com)" value={newSupport.email} onChange={e => setNewSupport({...newSupport, email: e.target.value})} />
            <Input placeholder="Phone Number" value={newSupport.phone} onChange={e => setNewSupport({...newSupport, phone: e.target.value})} />
            <Input type="password" placeholder="Temporary Password" value={newSupport.password} onChange={e => setNewSupport({...newSupport, password: e.target.value})} />
            <Button className="w-full bg-primary hover:bg-primary/90 h-12" onClick={handleAddSupport}>Create Account</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Vendor Dialog */}
      <Dialog open={isAddVendorDialogOpen} onOpenChange={setIsAddVendorDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Register New Vendor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Owner Full Name" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} />
            <Input placeholder="Login Email (@metysaravendors.com)" value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} />
            <Input type="password" placeholder="Temporary Password" value={newVendor.password} onChange={e => setNewVendor({...newVendor, password: e.target.value})} />
            <Input placeholder="Phone Number" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} />
            <Input placeholder="Service/Venue Name" value={newVendor.venueName} onChange={e => setNewVendor({...newVendor, venueName: e.target.value})} />
            <Input placeholder="Google Maps Link (Geo Location)" value={newVendor.locationLink || ''} onChange={e => setNewVendor({...newVendor, locationLink: e.target.value})} />
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Service Category</label>
              <Input 
                list="service-categories"
                placeholder="Select or type custom category" 
                value={newVendor.category} 
                onChange={e => setNewVendor({...newVendor, category: e.target.value})} 
              />
              <datalist id="service-categories">
                <option value="venue" />
                <option value="event_hall" />
                <option value="funeral" />
                <option value="catering" />
                <option value="photographer" />
                <option value="videographer" />
                <option value="makeup" />
                <option value="planner" />
              </datalist>
            </div>
            <Button onClick={handleAddVendor} className="w-full h-12 rounded-xl bg-primary">Create Vendor Account</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>Edit Venue Details</DialogTitle></DialogHeader>
          {editingVenue && (
            <div className="space-y-4 py-4">
              <Input placeholder="Name (EN)" value={editingVenue.name} onChange={e => setEditingVenue({...editingVenue, name: e.target.value})} />
              <Input placeholder="Name (AR)" value={editingVenue.nameAr} dir="rtl" onChange={e => setEditingVenue({...editingVenue, nameAr: e.target.value})} />
              <Textarea placeholder="Description (EN)" value={editingVenue.description} onChange={e => setEditingVenue({...editingVenue, description: e.target.value})} />
              <Textarea placeholder="Description (AR)" value={editingVenue.descriptionAr} dir="rtl" onChange={e => setEditingVenue({...editingVenue, descriptionAr: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Price" value={editingVenue.price} onChange={e => setEditingVenue({...editingVenue, price: Number(e.target.value)})} />
                <Input type="number" placeholder="Capacity" value={editingVenue.capacity} onChange={e => setEditingVenue({...editingVenue, capacity: Number(e.target.value)})} />
              </div>
              <Button onClick={handleSaveVenue} className="w-full h-12 rounded-xl bg-primary">Save Live Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Venue Details Viewer */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[500px] w-[95%] rounded-2xl max-h-[90vh] overflow-y-auto">
          {viewingVenue && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{viewingVenue.name}</span>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] uppercase">{viewingVenue.type}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {(viewingVenue.images || []).map((img: string, i: number) => (
                    <img key={i} src={img} alt="" className="w-24 h-24 object-cover rounded-xl border shrink-0" />
                  ))}
                  {(!viewingVenue.images || viewingVenue.images.length === 0) && (
                    <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400">No Photos</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl">
                   <div><p className="text-xs text-muted-foreground font-bold">Base Price</p><p className="font-bold text-primary">{viewingVenue.price?.toLocaleString()} EGP</p></div>
                   <div><p className="text-xs text-muted-foreground font-bold">Capacity</p><p className="font-bold">{viewingVenue.capacity} Guests</p></div>
                   <div className="col-span-2"><p className="text-xs text-muted-foreground font-bold">Location</p><p>{viewingVenue.location}</p></div>
                   <div className="col-span-2"><p className="text-xs text-muted-foreground font-bold">Description</p><p className="text-xs text-gray-700">{viewingVenue.description}</p></div>
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500"/> Amenities ({viewingVenue.amenities?.length || 0})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(viewingVenue.amenities || []).map((am: string, i: number) => (
                       <span key={i} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs border">{am}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Package className="h-4 w-4 text-primary"/> Packages ({viewingVenue.packages?.length || 0})</h4>
                  <div className="space-y-2">
                    {(viewingVenue.packages || []).map((pkg: any, i: number) => (
                       <div key={i} className="bg-white border p-3 rounded-xl flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-bold text-sm">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                          </div>
                          <span className="font-bold text-primary whitespace-nowrap">{pkg.price?.toLocaleString()} EGP</span>
                       </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl mx-auto p-6 top-[50%] -translate-y-[50%]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {deleteTarget?.type === 'venue' 
                ? 'Are you sure you want to permanently delete this venue? This action cannot be undone.'
                : 'Are you sure you want to permanently delete this review?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-4">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
