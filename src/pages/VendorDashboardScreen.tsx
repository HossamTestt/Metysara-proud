import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { NotificationDropdown } from '../components/ui/NotificationDropdown';
import { db, storage } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createNotification } from '../utils/notifications';
import { optimizeImage } from '../utils/imageOptimization';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LogOut, Upload, Image as ImageIcon, MapPin, DollarSign, Users, Trash2, Wifi, ParkingCircle, Utensils, Music, AirVent, Camera, Shield, Plus, X, Calendar as CalendarIcon, CheckCircle, Clock, XCircle, MessageSquare, Send, Package, AlertCircle, Edit } from 'lucide-react';

const AVAILABLE_AMENITIES = [
  { icon: Wifi, name: 'Free WiFi' },
  { icon: ParkingCircle, name: 'Valet Parking' },
  { icon: Utensils, name: 'Catering Service' },
  { icon: Music, name: 'Sound System' },
  { icon: AirVent, name: 'Air Conditioning' },
  { icon: Camera, name: 'Photo Booth' },
  { icon: Shield, name: '24/7 Security' },
];

export function VendorDashboardScreen() {
  const { currentUser, userData, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingReceiptId, setUploadingReceiptId] = useState<string | null>(null);
  
  const [editPrice, setEditPrice] = useState(0);
  const [editCapacity, setEditCapacity] = useState(0);
  const [editDesc, setEditDesc] = useState('');
  const [editDescAr, setEditDescAr] = useState('');
  const [editPolicies, setEditPolicies] = useState('');
  const [editPoliciesAr, setEditPoliciesAr] = useState('');
  const [editCategory, setEditCategory] = useState('venue');
  const [editLocation, setEditLocation] = useState('');
  const [editLocationLink, setEditLocationLink] = useState('');
  const [editMorningLabel, setEditMorningLabel] = useState('12:00 PM - 06:00 PM');
  const [editEveningLabel, setEditEveningLabel] = useState('06:00 PM - 12:00 AM');
  
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [editServices, setEditServices] = useState<any[]>([]);
  const [newService, setNewService] = useState<any>({ name: '', nameAr: '', price: 0 });
  const [editPackages, setEditPackages] = useState<any[]>([]);
  const [newPackage, setNewPackage] = useState<any>({ name: '', nameAr: '', price: 0, description: '', descriptionAr: '', image: '' });
  const [isUploadingPackage, setIsUploadingPackage] = useState(false);
  const packageFileInputRef = useRef<HTMLInputElement>(null);
  const [customAmenity, setCustomAmenity] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availability, setAvailability] = useState<Record<string, { morning?: boolean, evening?: boolean, fullDay?: boolean, fullyBooked?: boolean }>>({});
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [newVendorPassword, setNewVendorPassword] = useState('');

  useEffect(() => {
    if (!currentUser || userData?.role !== 'vendor') {
      navigate('/login');
      return;
    }
    
    const fetchVenue = async () => {
      try {
        const q = query(collection(db, 'venues'), where('ownerId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const vData = snapshot.docs[0].data();
          vData.id = snapshot.docs[0].id;
          setVenue(vData);

          const target = vData.pendingEdits || vData;
          setEditPrice(target.price || 0);
          setEditCapacity(target.capacity || 0);
          setEditDesc(target.description || '');
          setEditDescAr(target.descriptionAr || '');
          setEditPolicies(target.policies || '');
          setEditPoliciesAr(target.policiesAr || '');
          setEditCategory(target.type || 'venue');
          setEditLocation(target.location || target.zone || '');
          setEditLocationLink(target.locationLink || '');
          setEditMorningLabel(target.timeSlots?.morningLabel || '12:00 PM - 06:00 PM');
          setEditEveningLabel(target.timeSlots?.eveningLabel || '06:00 PM - 12:00 AM');
          setEditAmenities(target.amenities || []);
          setEditServices(target.services || []);
          setEditPackages(target.packages || []);
          setAvailability(vData.availability || {});
        }

        const bQuery = query(collection(db, 'bookings'), where('vendorId', '==', currentUser.uid));
        const bSnap = await getDocs(bQuery);
        const bookingsWithDetails = await Promise.all(bSnap.docs.map(async (bDoc) => {
          const bData = bDoc.data();
          const bId = bDoc.id;
          let fullData: any = { id: bId, ...bData };
          
          // Try to fetch private details if missing (due to refactor)
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

        setBookings(bookingsWithDetails.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));

        const tQuery = query(collection(db, 'tickets'), where('userId', '==', currentUser.uid));
        const tSnap = await getDocs(tQuery);
        setTickets(tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));

      } catch (err) {
        console.error("Error fetching vendor venue:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVenue();
  }, [currentUser, userData, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveDetails = async () => {
    if (!venue) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const pendingObj = {
        ...(venue.pendingEdits || {}),
        price: editPrice,
        capacity: editCapacity,
        description: editDesc,
        descriptionAr: editDescAr,
        policies: editPolicies,
        policiesAr: editPoliciesAr,
        type: editCategory,
        location: editLocation,
        locationLink: editLocationLink,
        timeSlots: { morningLabel: editMorningLabel, eveningLabel: editEveningLabel },
        amenities: editAmenities,
        services: editServices,
        packages: editPackages,
        status: 'pending'
      };
      await updateDoc(doc(db, 'venues', venue.id), { pendingEdits: pendingObj });
      setVenue({ ...venue, pendingEdits: pendingObj });
      setSuccessMsg('Changes submitted for Admin approval!');
    } catch (e) {
      setErrorMsg('Error updating details. Please try again.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !venue) return;
    setIsUploading(true);
    setErrorMsg('');
    try {
      const originalFile = e.target.files[0];
      const file = await optimizeImage(originalFile);
      // Use venue_images/ path to match storage rules (vendors: 50MB limit)
      const storageRef = ref(storage, `venue_images/${venue.id}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const newImages = [...(venue.pendingEdits?.images || venue.images || []), downloadURL];
      const pendingObj = {
        ...(venue.pendingEdits || {}),
        images: newImages,
        status: 'pending'
      };
      await updateDoc(doc(db, 'venues', venue.id), { pendingEdits: pendingObj });
      setVenue({ ...venue, pendingEdits: pendingObj });
    } catch (error) {
      console.error('Upload error', error);
      setErrorMsg('Error uploading image. Make sure file is under 50MB.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePackageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !venue) return;
    setIsUploadingPackage(true);
    setErrorMsg('');
    try {
      const originalFile = e.target.files[0];
      const file = await optimizeImage(originalFile);
      const storageRef = ref(storage, `venue_images/${venue.id}/packages/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setNewPackage((prev: any) => ({ ...prev, image: downloadURL }));
    } catch (error) {
      console.error('Package image upload error', error);
      setErrorMsg('Error uploading package image.');
    } finally {
      setIsUploadingPackage(false);
    }
  };

  const handleToggleSlot = async (slot: 'morning' | 'evening' | 'fullDay' | 'fullyBooked' | 'clear') => {
    if (!venue || !selectedDate) return;
    const dateStr = selectedDate.getFullYear() + "-" + String(selectedDate.getMonth() + 1).padStart(2, '0') + "-" + String(selectedDate.getDate()).padStart(2, '0');
    const currentSlots = availability[dateStr] || { morning: false, evening: false, fullDay: false, fullyBooked: false };
    
    let newSlots;
    if (slot === 'clear') {
       newSlots = { morning: false, evening: false, fullDay: false, fullyBooked: false };
    } else {
       newSlots = { ...currentSlots, [slot]: !currentSlots[slot] };
       if (slot === 'fullyBooked' && newSlots.fullyBooked) {
          newSlots.morning = false;
          newSlots.evening = false;
          newSlots.fullDay = false;
       }
    }

    const newAvailability = { ...availability };
    const isAllFalse = !newSlots.morning && !newSlots.evening && !newSlots.fullDay && !newSlots.fullyBooked;
    
    if (isAllFalse) {
      delete newAvailability[dateStr];
    } else {
      newAvailability[dateStr] = newSlots;
    }

    setAvailability(newAvailability);
    try {
      await updateDoc(doc(db, 'venues', venue.id), { availability: newAvailability });
    } catch (e) {
      console.error('Calendar save error:', e);
      setErrorMsg('Error saving calendar changes.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus });
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        if (newStatus === 'pending_admin') {
          try {
            const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
            for (const adminDoc of adminsSnap.docs) {
              await createNotification(
                adminDoc.id,
                '📋 New Booking Awaiting Approval',
                `${booking.customerName} has booked ${booking.venueName} on ${booking.date}. Vendor has accepted — please review and confirm.`
              );
            }
          } catch (e) { console.error('Admin notification error:', e); }
        } else if (newStatus === 'rejected') {
          await createNotification(
            booking.customerId,
            '❌ Booking Declined',
            `Unfortunately, your booking request for ${booking.venueName} on ${booking.date} was declined by the venue.`
          );
        }
      }
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      setSuccessMsg(`Booking ${newStatus === 'pending_admin' ? 'accepted' : 'declined'} successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      console.error('Error updating booking:', e);
      setErrorMsg('Error updating booking status. Please try again.');
    }
  };

  const handleReceiptUpload = async (bookingId: string, originalFile: File | undefined) => {
    if (!originalFile) return;
    if (originalFile.size > 10 * 1024 * 1024) {
      setErrorMsg('File too large. Maximum size is 10MB.');
      return;
    }
    setUploadingReceiptId(bookingId);
    setErrorMsg('');
    try {
      const file = await optimizeImage(originalFile);
      // Use booking_receipts/ path — covered by authenticated-write fallback rule
      const storageRef = ref(storage, `booking_receipts/${bookingId}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      await updateDoc(doc(db, 'bookings', bookingId), {
        fullPaymentReceived: true,
        paymentReceiptUrl: downloadURL,
        paymentConfirmedAt: serverTimestamp()
      });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, fullPaymentReceived: true, paymentReceiptUrl: downloadURL } : b));
      setSuccessMsg('Receipt uploaded! Payment marked as completed.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error: any) {
      console.error('Receipt upload error:', error);
      setErrorMsg('Error uploading receipt: ' + error.message);
    } finally {
      setUploadingReceiptId(null);
    }
  };

  const handleSubmitTicket = async () => {
    if (!newTicketSubject || !newTicketMessage || !currentUser) return;
    setIsSubmittingTicket(true);
    setErrorMsg('');
    try {
      const ticketObj = {
        userId: currentUser.uid,
        userName: userData?.name || 'Vendor',
        userEmail: userData?.email || '',
        userPhone: userData?.phone || '',
        subject: newTicketSubject,
        message: newTicketMessage,
        status: 'open',
        userRole: 'vendor',
        createdAt: serverTimestamp(),
        replies: []
      };
      const docRef = await addDoc(collection(db, 'tickets'), ticketObj);
      setTickets([{ id: docRef.id, ...ticketObj }, ...tickets]);
      setNewTicketSubject('');
      setNewTicketMessage('');
      try {
        const supportSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'support')));
        for (const supportDoc of supportSnap.docs) {
          await createNotification(
            supportDoc.id,
            '🎫 New Vendor Support Ticket',
            `${userData?.name || 'Vendor'} submitted a new ticket: "${newTicketSubject}"`
          );
        }
      } catch (e) { console.error('Support notification error:', e); }
      setSuccessMsg('Support ticket submitted! We\'ll get back to you shortly.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      setErrorMsg('Error submitting ticket. Please try again.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );

  // ── Inline feedback banner helper ─────────────────────────────────────
  const FeedbackBanner = () => (
    <>
      {successMsg && (
        <div className="mx-6 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium flex items-center gap-2">
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium flex items-center gap-2">
          ❌ {errorMsg}
        </div>
      )}
    </>
  );

  if (!venue) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
      <h2 className="text-2xl font-bold mb-2">No Venue Assigned</h2>
      <Button onClick={handleLogout} variant="outline" className="mt-4">Log Out</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 pt-[calc(4rem+env(safe-area-inset-top))] pb-24 rounded-b-[3.5rem] -mt-[env(safe-area-inset-top)] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-foreground/5 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h2 className="text-2xl text-primary-foreground font-black tracking-tight">{t?.('Vendor Dashboard', 'لوحة التحكم') || 'Vendor Dashboard'}</h2>
            <p className="text-[10px] text-primary-foreground/60 font-black uppercase tracking-[0.2em]">{venue?.name || 'Managing your venue'}</p>
          </div>
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
              {venue?.images?.[0] ? (
                <img src={venue.images[0]} alt="" className="w-full h-full object-cover rounded-[2rem]" />
              ) : (
                <ImageIcon className="h-12 w-12 text-primary-foreground" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-green-500 rounded-2xl flex items-center justify-center shadow-xl border-4 border-primary">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl text-primary-foreground font-black tracking-tight leading-none mb-2">
              {venue?.name || userData?.name}
            </h3>
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span className="line-clamp-1">{venue?.location || 'Egypt'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20">
        <FeedbackBanner />
        
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="flex w-full overflow-x-auto scrollbar-hide mb-8 text-[10px] h-12 bg-card/80 backdrop-blur-xl p-1.5 rounded-[1.5rem] gap-1 shrink-0 border border-primary/5 shadow-xl">
            <TabsTrigger value="bookings" className="rounded-xl flex-shrink-0 px-4 font-black uppercase tracking-tighter">Bookings</TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-xl flex-shrink-0 px-4 font-black uppercase tracking-tighter">Calendar</TabsTrigger>
            <TabsTrigger value="details" className="rounded-xl flex-shrink-0 px-4 font-black uppercase tracking-tighter">Details</TabsTrigger>
            <TabsTrigger value="packages" className="rounded-xl flex-shrink-0 px-4 font-black uppercase tracking-tighter">Packages</TabsTrigger>
            <TabsTrigger value="support" className="rounded-xl flex-shrink-0 px-4 font-black uppercase tracking-tighter">Support</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl flex-shrink-0 px-4 font-black uppercase tracking-tighter">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <Card className="p-8 text-center border-dashed"><CalendarIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-2" /><p>No bookings yet</p></Card>
            ) : bookings.map(booking => (
              <Card key={booking.id} className={`p-5 border-l-4 ${booking.status === 'pending_vendor' ? 'border-l-yellow-400 bg-yellow-50/10' : 'border-l-primary'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{booking.customerName}</h3>
                    <p className="text-xs text-muted-foreground">#{booking.serialId || booking.id.slice(0,8)} • {new Date(booking.createdAt?.toMillis?.() || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2 py-1 bg-muted rounded text-[10px] font-bold uppercase">{booking.status.replace('_', ' ')}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 bg-muted/30 p-4 rounded-xl text-sm">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Schedule</p>
                    <p className="font-bold">{new Date(booking.date).toLocaleDateString()} • {booking.slot}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Financials</p>
                    <p className="font-bold text-primary">{booking.totalAmount?.toLocaleString()} EGP</p>
                  </div>
                  {booking.packageName && (
                    <div className="col-span-2 border-t pt-2 mt-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Selected Package</p>
                      <p className="font-bold text-primary flex items-center gap-2"><Package className="h-3 w-3"/> {booking.packageName}</p>
                    </div>
                  )}
                  {booking.guests && (
                    <div className="col-span-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Guests</p>
                      <p className="font-bold">{booking.guests}</p>
                    </div>
                  )}
                  {booking.customerPhone && (
                    <div className="col-span-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Contact</p>
                      <p className="font-bold">{booking.customerPhone}</p>
                    </div>
                  )}

                  {booking.services && booking.services.length > 0 && (
                     <div className="col-span-2 border-t pt-2 mt-1">
                       <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Selected Add-ons / Amenities</p>
                       <div className="flex flex-wrap gap-1">
                         {booking.services.map((srv: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white border rounded text-[10px] font-medium capitalize">{srv.replace('_', ' ')}</span>
                         ))}
                       </div>
                     </div>
                  )}

                  {booking.notes && (
                    <div className="col-span-2 border-t pt-2 mt-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Notes</p>
                      <p className="italic text-muted-foreground">"{booking.notes}"</p>
                    </div>
                  )}
                </div>

                {booking.status === 'pending_vendor' && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdateBookingStatus(booking.id, 'pending_admin')} className="flex-1 bg-green-600 hover:bg-green-700">Accept</Button>
                    <Button onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')} variant="outline" className="flex-1 text-red-600">Decline</Button>
                  </div>
                )}

                {booking.status === 'confirmed' && !booking.fullPaymentReceived && (
                  <div className="mt-4 p-4 border rounded-xl bg-orange-50 border-orange-200">
                    <div className="mb-3">
                      <p className="font-bold text-sm text-orange-800">Payment Collection</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Has the customer paid the remaining balance and insurance? Upload the official signed receipt here to confirm.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={(e) => handleReceiptUpload(booking.id, e.target.files?.[0])} 
                        id={`receipt-${booking.id}`} 
                        className="hidden" 
                      />
                      <Button 
                        variant="outline" 
                        className="w-full border-orange-300 text-orange-700 bg-white hover:bg-orange-100" 
                        onClick={() => document.getElementById(`receipt-${booking.id}`)?.click()}
                        disabled={uploadingReceiptId === booking.id}
                      >
                        {uploadingReceiptId === booking.id ? (
                          <span className="flex items-center"><div className="w-4 h-4 border-2 border-orange-700 border-t-transparent rounded-full animate-spin mr-2"></div> Uploading...</span>
                        ) : (
                          <><Upload className="h-4 w-4 mr-2" /> Upload Customer Receipt</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {booking.status === 'confirmed' && booking.fullPaymentReceived && (
                  <div className="mt-4 p-3 border rounded-xl bg-green-50 border-green-200 flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[11px] uppercase tracking-wider text-green-800">Payment Completed</p>
                      <p className="text-xs text-green-700 mt-0.5 mb-1.5">You have successfully documented full payment.</p>
                      <a 
                        href={booking.paymentReceiptUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[11px] font-bold text-green-700 bg-green-200/50 px-2 py-1 rounded inline-block hover:bg-green-200 transition-colors"
                      >
                        View Uploaded Receipt
                      </a>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card className="p-4 border-none shadow-sm">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                className="rounded-xl border p-4 mb-6 bg-white"
                modifiers={{
                  fullyBooked: (date) => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    if (date < today) return false;
                    const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0');
                    // Manually marked OR has a confirmed/pending booking
                    if (availability[dateStr]?.fullyBooked) return true;
                    return bookings.some(b => b.date === dateStr && ['confirmed', 'pending_admin', 'pending_vendor'].includes(b.status));
                  }
                }}
                modifiersClassNames={{
                  fullyBooked: "bg-red-100 text-red-600 font-bold border-red-200"
                }}
              />

              {selectedDate && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm border-b pb-2">Status for {selectedDate.toLocaleDateString()}</h3>
                  {(() => {
                    const dateStr = selectedDate.getFullYear() + "-" + String(selectedDate.getMonth() + 1).padStart(2, '0') + "-" + String(selectedDate.getDate()).padStart(2, '0');
                    const slots = availability[dateStr] || { morning: false, evening: false, fullDay: false, fullyBooked: false };
                    return (
                      <div className="space-y-3">
                        <Button variant={slots.fullyBooked ? "destructive" : "outline"} className="w-full h-12 rounded-xl" onClick={() => handleToggleSlot('fullyBooked')}>
                          {slots.fullyBooked ? "UNBLOCK DATE" : "BLOCK ENTIRE DAY (MARK RED)"}
                        </Button>
                        {!slots.fullyBooked && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant={slots.morning ? "default" : "outline"} className="rounded-xl" onClick={() => handleToggleSlot('morning')}>Morning {slots.morning && '✓'}</Button>
                            <Button variant={slots.evening ? "default" : "outline"} className="rounded-xl" onClick={() => handleToggleSlot('evening')}>Evening {slots.evening && '✓'}</Button>
                          </div>
                        )}
                        <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs" onClick={() => handleToggleSlot('clear')}>Clear Selection</Button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card className="p-6 border-none shadow-sm space-y-4">
              <h2 className="text-lg font-bold">Service Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">English Description</label>
                  <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="min-h-[100px] bg-muted/30 border-none rounded-xl mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Arabic Description</label>
                  <Textarea value={editDescAr} onChange={e => setEditDescAr(e.target.value)} dir="rtl" className="min-h-[100px] bg-muted/30 border-none rounded-xl mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">English Terms & Policies</label>
                  <Textarea value={editPolicies} onChange={e => setEditPolicies(e.target.value)} className="min-h-[100px] bg-muted/30 border-none rounded-xl mt-1" placeholder="Cancellation rules, entry fees, etc." />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Arabic Terms & Policies</label>
                  <Textarea value={editPoliciesAr} onChange={e => setEditPoliciesAr(e.target.value)} dir="rtl" className="min-h-[100px] bg-muted/30 border-none rounded-xl mt-1" placeholder="شروط الإلغاء، رسوم الدخول، إلخ." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Morning Slot Time</label>
                    <Input placeholder="e.g. 12:00 PM - 06:00 PM" value={editMorningLabel} onChange={e => setEditMorningLabel(e.target.value)} className="bg-muted/30 border-none rounded-xl mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Evening Slot Time</label>
                    <Input placeholder="e.g. 06:00 PM - 12:00 AM" value={editEveningLabel} onChange={e => setEditEveningLabel(e.target.value)} className="bg-muted/30 border-none rounded-xl mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Location (Short Text)</label>
                    <Input placeholder="e.g. Cairo, Egypt" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="bg-muted/30 border-none rounded-xl mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Google Maps Link</label>
                    <Input placeholder="https://maps.google.com/..." value={editLocationLink} onChange={e => setEditLocationLink(e.target.value)} className="bg-muted/30 border-none rounded-xl mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Base Price (EGP)</label>
                    <Input type="number" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} className="bg-muted/30 border-none rounded-xl mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Max Capacity</label>
                    <Input type="number" value={editCapacity} onChange={e => setEditCapacity(Number(e.target.value))} className="bg-muted/30 border-none rounded-xl mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground">Service Category</label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger className="bg-muted/30 border-none rounded-xl mt-1 h-10 w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding Venue (قاعة أفراح)</SelectItem>
                        <SelectItem value="funeral">Dar Monasbat (دار مناسبات)</SelectItem>
                        <SelectItem value="photographer">Photographer (مُصور)</SelectItem>
                        <SelectItem value="videographer">Videographer (مصور فيديو)</SelectItem>
                        <SelectItem value="photosession">Photo Session (جلسة تصوير)</SelectItem>
                        <SelectItem value="makeup">Makeup Artist (مكياج)</SelectItem>
                        <SelectItem value="limousine">Limousine (ليموزين)</SelectItem>
                        <SelectItem value="catering">Catering (تقديم طعام)</SelectItem>
                        <SelectItem value="event_hall">Event Hall (قاعة فعاليات)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Amenities Selection */}
                <div className="border-t pt-4">
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">Amenities</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {AVAILABLE_AMENITIES.map(am => (
                      <label key={am.name} className="flex items-center gap-2 text-sm">
                        <input 
                          type="checkbox" 
                          checked={editAmenities.includes(am.name)} 
                          onChange={(e) => {
                            if (e.target.checked) setEditAmenities([...editAmenities, am.name]);
                            else setEditAmenities(editAmenities.filter(a => a !== am.name));
                          }} 
                          className="rounded border-gray-300"
                        />
                        {am.name}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Custom Amenity" value={customAmenity} onChange={e => setCustomAmenity(e.target.value)} />
                    <Button variant="secondary" onClick={() => { if(customAmenity) { setEditAmenities([...editAmenities, customAmenity]); setCustomAmenity(''); }}}>Add</Button>
                  </div>
                  {/* Custom Amenities Render */}
                  {editAmenities.filter(a => !AVAILABLE_AMENITIES.find(am => am.name === a)).length > 0 && (
                    <div className="mt-4 p-3 bg-muted/20 rounded-xl border">
                      <p className="text-xs font-bold text-muted-foreground mb-2">Custom Amenities Provided:</p>
                      <div className="flex flex-wrap gap-2">
                        {editAmenities.filter(a => !AVAILABLE_AMENITIES.find(am => am.name === a)).map(am => (
                          <div key={am} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border shadow-sm text-sm">
                            {am}
                            <button onClick={() => setEditAmenities(editAmenities.filter(x => x !== am))} className="text-red-500 hover:text-red-700 ml-1"><X className="h-3 w-3"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo Upload */}
                <div className="border-t pt-4">
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">Photos</label>
                  <div className="flex gap-2 overflow-x-auto pb-4">
                    {(venue.pendingEdits?.images || venue.images || []).map((img: string, i: number) => (
                      <div key={i} className="relative shrink-0">
                         <img src={img} alt="Venue" className="w-24 h-24 object-cover rounded-xl border shadow-sm" />
                      </div>
                    ))}
                    <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 shrink-0 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted text-muted-foreground">
                       {isUploading ? <p className="text-xs">Uploading...</p> : <><Plus className="h-6 w-6"/><span className="text-xs mt-1">Add Photo</span></>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </div>
                </div>

                <Button onClick={handleSaveDetails} className="w-full rounded-xl h-12">Submit for Review</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <Card className="p-6 border-none shadow-sm space-y-6">
              <h2 className="text-lg font-bold">Pricing Packages</h2>
              <div className="space-y-4">
                {editPackages.map((pkg, idx) => (
                  <div key={idx} className="p-4 border rounded-2xl relative bg-muted/20 flex gap-4">
                    {pkg.image && <img src={pkg.image} alt={pkg.name} className="w-20 h-20 object-cover rounded-xl shrink-0" />}
                    <div className="flex-1">
                      <div className="absolute top-3 right-3 flex gap-2 text-muted-foreground">
                        <button onClick={() => { setNewPackage(pkg); setEditPackages(editPackages.filter((_, i) => i !== idx)); }} className="hover:text-primary"><Edit className="h-4 w-4"/></button>
                        <button onClick={() => setEditPackages(editPackages.filter((_, i) => i !== idx))} className="hover:text-red-500"><Trash2 className="h-4 w-4"/></button>
                      </div>
                      <p className="font-bold pr-16">{pkg.name} / {pkg.nameAr}</p>
                      <p className="text-primary font-bold text-sm">{pkg.price.toLocaleString()} EGP</p>
                      <p className="text-xs text-muted-foreground mt-2">{pkg.description}</p>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-6 space-y-3">
                  <h3 className="font-bold text-sm">Add / Edit Package</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Name (EN)" value={newPackage.name} onChange={e => setNewPackage({...newPackage, name: e.target.value})} />
                    <Input placeholder="Name (AR)" value={newPackage.nameAr} dir="rtl" onChange={e => setNewPackage({...newPackage, nameAr: e.target.value})} />
                  </div>
                  <Input type="number" placeholder="Price (EGP)" value={newPackage.price || ''} onChange={e => setNewPackage({...newPackage, price: Number(e.target.value)})} />
                  <Textarea placeholder="Description (EN)" value={newPackage.description} onChange={e => setNewPackage({...newPackage, description: e.target.value})} />
                  <Textarea placeholder="Description (AR)" value={newPackage.descriptionAr} dir="rtl" onChange={e => setNewPackage({...newPackage, descriptionAr: e.target.value})} />
                  
                  <div className="flex items-center gap-4">
                    {newPackage.image && <img src={newPackage.image} alt="Preview" className="w-16 h-16 object-cover rounded-xl border shadow-sm" />}
                    <Button variant="outline" className="flex-1 h-16 border-dashed" onClick={() => packageFileInputRef.current?.click()} disabled={isUploadingPackage}>
                      {isUploadingPackage ? 'Uploading...' : <><Upload className="h-4 w-4 mr-2"/> Upload Photo / Brochure</>}
                    </Button>
                    <input type="file" ref={packageFileInputRef} className="hidden" accept="image/*" onChange={handlePackageFileUpload} />
                  </div>

                  <Button variant="secondary" className="w-full rounded-xl" onClick={() => { setEditPackages([...editPackages, { ...newPackage, id: newPackage.id || Date.now().toString() }]); setNewPackage({ name:'', nameAr: '', price: 0, description: '', descriptionAr: '', image: '' }); }}>Save to Packages List</Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-none shadow-sm space-y-6">
              <h2 className="text-lg font-bold">Additional Services (Add-ons)</h2>
              <div className="space-y-4">
                {editServices.map((srv, idx) => (
                  <div key={idx} className="p-4 border rounded-2xl relative bg-muted/20">
                    <div className="absolute top-3 right-3 flex gap-2 text-muted-foreground">
                      <button onClick={() => setEditServices(editServices.filter((_, i) => i !== idx))} className="hover:text-red-500"><Trash2 className="h-4 w-4"/></button>
                    </div>
                    <p className="font-bold pr-8">{srv.name} / {srv.nameAr}</p>
                    <p className="text-primary font-bold text-sm">{srv.price.toLocaleString()} EGP</p>
                  </div>
                ))}

                <div className="border-t pt-6 space-y-3">
                  <h3 className="font-bold text-sm">Add New Service</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Service Name (EN)" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                    <Input placeholder="Service Name (AR)" value={newService.nameAr} dir="rtl" onChange={e => setNewService({...newService, nameAr: e.target.value})} />
                  </div>
                  <Input type="number" placeholder="Price (EGP)" value={newService.price || ''} onChange={e => setNewService({...newService, price: Number(e.target.value)})} />
                  
                  <Button variant="secondary" className="w-full rounded-xl" onClick={() => { 
                    if(newService.name && newService.price >= 0) {
                      setEditServices([...editServices, { ...newService, id: newService.name.toLowerCase().replace(/\s+/g, '-') }]);
                      setNewService({ name:'', nameAr: '', price: 0 });
                    }
                  }}>Add to Services</Button>
                </div>
              </div>
            </Card>

            <Button onClick={handleSaveDetails} className="w-full rounded-xl bg-primary h-12 mt-6">Submit Pricing & Services for Review</Button>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
             <Card className="p-6 border-none shadow-sm">
                <h2 className="text-lg font-bold mb-4">Contact Support</h2>
                <div className="space-y-3">
                   <Input placeholder="Subject" value={newTicketSubject} onChange={e => setNewTicketSubject(e.target.value)} />
                   <Textarea placeholder="How can we help?" className="min-h-[100px]" value={newTicketMessage} onChange={e => setNewTicketMessage(e.target.value)} />
                   <Button className="w-full rounded-xl h-12" onClick={handleSubmitTicket} disabled={isSubmittingTicket || !newTicketSubject || !newTicketMessage}>Send Message</Button>
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
             <Card className="p-6 border-none shadow-sm">
                <h2 className="text-lg font-bold mb-4">Account Settings</h2>
                <div className="space-y-4">
                   <div>
                     <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Account Name</label>
                     <Input value={userData?.name || ''} disabled className="bg-muted/50" />
                     <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Shield className="h-3 w-3"/> Changing name must be done via Admin approval. Please contact support.</p>
                   </div>
                   
                   <div className="pt-4 border-t">
                     <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Update Password</label>
                     <Input
                       type="password"
                       placeholder="Enter new password (min. 6 characters)"
                       value={newVendorPassword}
                       onChange={(e) => setNewVendorPassword(e.target.value)}
                       className="bg-muted/30 border-none rounded-xl mb-3"
                     />
                     <Button
                       className="w-full rounded-xl h-12"
                       disabled={newVendorPassword.length < 6}
                       onClick={async () => {
                         setErrorMsg('');
                         setSuccessMsg('');
                         try {
                           const { updatePassword } = await import('firebase/auth');
                           if (currentUser) {
                             await updatePassword(currentUser, newVendorPassword);
                             setSuccessMsg('Password updated successfully!');
                             setNewVendorPassword('');
                             setTimeout(() => setSuccessMsg(''), 4000);
                           }
                         } catch (e: any) {
                           setErrorMsg('Error updating password. You may need to sign in again. ' + e.message);
                         }
                       }}
                     >
                       Update Password
                     </Button>
                   </div>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
