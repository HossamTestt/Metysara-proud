import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { LogOut, Upload, Image as ImageIcon, MapPin, DollarSign, Users, Trash2, Wifi, ParkingCircle, Utensils, Music, AirVent, Camera, Shield, Plus, X, Calendar as CalendarIcon, CheckCircle, Clock, XCircle, MessageSquare, Send } from 'lucide-react';

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
  const navigate = useNavigate();
  const [venue, setVenue] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editPrice, setEditPrice] = useState(0);
  const [editCapacity, setEditCapacity] = useState(0);
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('venue');
  
  // Packages and Amenities State
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [editPackages, setEditPackages] = useState<{ id: string, name: string, price: number, description: string }[]>([]);
  const [newPackage, setNewPackage] = useState({ name: '', price: 0, description: '' });
  const [customAmenity, setCustomAmenity] = useState('');
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availability, setAvailability] = useState<Record<string, { morning?: boolean, evening?: boolean, fullDay?: boolean }>>({});
  
  // Bookings state
  // Bookings state
  const [bookings, setBookings] = useState<any[]>([]);

  // Support Tickets State
  const [tickets, setTickets] = useState<any[]>([]);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

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
          setVenue(vData);
          if (vData.pendingEdits) {
            setEditPrice(vData.pendingEdits.price ?? vData.price ?? 0);
            setEditCapacity(vData.pendingEdits.capacity ?? vData.capacity ?? 0);
            setEditDesc(vData.pendingEdits.description ?? vData.description ?? '');
            setEditCategory(vData.pendingEdits.type ?? vData.type ?? 'venue');
            setEditAmenities(vData.pendingEdits.amenities ?? vData.amenities ?? []);
            setEditPackages(vData.pendingEdits.packages ?? vData.packages ?? []);
          } else {
            setEditPrice(vData.price || 0);
            setEditCapacity(vData.capacity || 0);
            setEditDesc(vData.description || '');
            setEditCategory(vData.type || 'venue');
            setEditAmenities(vData.amenities || []);
            setEditPackages(vData.packages || []);
          }
          setAvailability(vData.availability || {});
        }

        // Fetch vendor bookings
        const bQuery = query(collection(db, 'bookings'), where('vendorId', '==', currentUser.uid));
        const bSnap = await getDocs(bQuery);
        const bData = bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setBookings(bData);

        // Fetch vendor support tickets
        const tQuery = query(collection(db, 'tickets'), where('userId', '==', currentUser.uid));
        const tSnap = await getDocs(tQuery);
        const tData = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setTickets(tData);

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

  const handleSubmitTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim() || !currentUser || !userData) return;
    setIsSubmittingTicket(true);
    try {
      const docRef = await addDoc(collection(db, 'tickets'), {
        userId: currentUser.uid,
        userName: userData.name || 'Vendor',
        userEmail: currentUser.email,
        subject: newTicketSubject,
        message: newTicketMessage,
        status: 'open',
        userRole: 'vendor',
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
      alert('Support ticket submitted successfully!');
    } catch (e: any) {
      alert('Error submitting ticket: ' + e.message);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!venue) return;
    try {
      const pendingObj = {
        ...(venue.pendingEdits || {}),
        price: editPrice,
        capacity: editCapacity,
        description: editDesc,
        type: editCategory,
        amenities: editAmenities,
        packages: editPackages,
        status: 'pending'
      };
      
      await updateDoc(doc(db, 'venues', venue.id), {
        pendingEdits: pendingObj
      });
      setVenue({ ...venue, pendingEdits: pendingObj });
      alert('Changes submitted for Admin approval!');
    } catch (e) {
      console.error(e);
      alert('Error updating details.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !venue) return;

    setIsUploading(true);
    const newImageUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Create a unique path in Firebase Storage
        const fileRef = ref(storage, `venues/${venue.id}/${Date.now()}_${file.name}`);
        
        await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(fileRef);
        newImageUrls.push(downloadUrl);
      }

      // Update Firestore venue with the new array of image URLs
      const existingImages = venue.pendingEdits?.images || venue.images || [];
      const updatedImages = [...existingImages, ...newImageUrls];
      
      const pendingObj = {
        ...(venue.pendingEdits || {}),
        images: updatedImages,
        status: 'pending'
      };

      await updateDoc(doc(db, 'venues', venue.id), {
        pendingEdits: pendingObj
      });
      
      setVenue({ ...venue, pendingEdits: pendingObj });
      alert('Images submitted for Admin approval!');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload images.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async (indexToRemove: number) => {
    if (!venue) return;
    const existingImages = venue.pendingEdits?.images || venue.images || [];
    const newImages = [...existingImages];
    newImages.splice(indexToRemove, 1);
    
    const pendingObj = {
      ...(venue.pendingEdits || {}),
      images: newImages,
      status: 'pending'
    };

    await updateDoc(doc(db, 'venues', venue.id), {
      pendingEdits: pendingObj
    });
    setVenue({ ...venue, pendingEdits: pendingObj });
  };

  const handleToggleSlot = async (slot: 'morning' | 'evening' | 'fullDay' | 'blockAll') => {
    if (!venue || !selectedDate) return;
    const dateStr = selectedDate.getFullYear() + "-" + String(selectedDate.getMonth() + 1).padStart(2, '0') + "-" + String(selectedDate.getDate()).padStart(2, '0');
    const currentSlots = availability[dateStr] || { morning: false, evening: false, fullDay: false };
    
    let newSlots;
    if (slot === 'blockAll') {
       newSlots = { morning: false, evening: false, fullDay: false };
    } else {
       newSlots = { ...currentSlots, [slot]: !currentSlots[slot] };
    }
    
    const newAvailability = {
      ...availability,
      [dateStr]: newSlots
    };
    
    setAvailability(newAvailability);
    setVenue({ ...venue, availability: newAvailability });
    
    // Auto-live save
    try {
      await updateDoc(doc(db, 'venues', venue.id), {
        availability: newAvailability
      });
    } catch (e) {
      console.error(e);
      alert('Error saving calendar slot');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus
      });
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      alert(`Booking ${newStatus === 'pending_admin' ? 'accepted' : 'declined'} successfully!`);
    } catch (e) {
      console.error(e);
      alert('Error updating booking status');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading your vendor profile...</div>;
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-background pb-6 flex flex-col">
        <div className="bg-card px-6 pt-12 pb-6 rounded-b-3xl shadow-sm sticky top-0 z-10 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <img src="/متيسرة 04-03.png" alt="Metysara" className="w-10 h-auto" />
               <h1 className="text-xl font-bold flex-1">Vendor Portal</h1>
            </div>
            <button 
               onClick={handleLogout}
               className="p-2 text-red-500 rounded-full hover:bg-red-50 transition-colors"
            >
               <LogOut className="h-5 w-5" />
            </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <MapPin className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
          <h2 className="text-2xl font-bold mb-2">No Venue Assigned</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Your vendor account is active, but you haven't been assigned a hall or location yet. Please contact the Metysara administration to link your venue.
          </p>
          <Button onClick={handleLogout} variant="outline" className="w-full max-w-xs">
            Log Out for Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-card px-6 pt-12 pb-6 rounded-b-3xl shadow-sm sticky top-0 z-10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <img src="/متيسرة 04-03.png" alt="Metysara" className="w-10 h-auto" />
             <h1 className="text-xl font-bold flex-1">Vendor Portal</h1>
          </div>
          <button 
             onClick={handleLogout}
             className="p-2 text-red-500 rounded-full hover:bg-red-50 transition-colors"
          >
             <LogOut className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground text-sm">Welcome back, {userData?.name}</p>
          {venue.pendingEdits && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium border border-yellow-200">
              Edits Pending Admin Approval
            </span>
          )}
        </div>
      </div>

      <div className="px-6 mb-6">
         <Card className="p-4 bg-gradient-to-r from-primary to-primary/80 text-white border-0">
            <div className="grid grid-cols-2 text-center divide-x divide-white/20">
               <div>
                  <p className="text-sm text-primary-foreground/80 mb-1">Your Total Earnings</p>
                  <p className="text-2xl font-bold">
                     {bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()} EGP
                  </p>
               </div>
               <div>
                  <p className="text-sm text-primary-foreground/80 mb-1">Total Bookings</p>
                  <p className="text-2xl font-bold text-green-300">
                     {bookings.length}
                  </p>
               </div>
            </div>
         </Card>
      </div>

      <div className="px-6">
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="w-full grid grid-cols-6 mb-6 text-xs">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
             <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-center">Your Monthly Revenue</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                       const monthlyData: Record<string, number> = {};
                       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                       months.forEach(m => monthlyData[m] = 0);
                       bookings.forEach(b => {
                         if (b.status === 'confirmed' && b.date && b.totalAmount) {
                           try {
                             const m = months[new Date(b.date).getMonth()];
                             if(m) monthlyData[m] += b.totalAmount;
                           } catch(e){}
                         }
                       });
                       return months.map(name => ({ name, revenue: monthlyData[name] }));
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString()} EGP`, "Revenue"]} cursor={{fill: 'transparent'}} />
                      <Bar dataKey="revenue" fill="#be123c" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </Card>

             <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-center">Your Booking Leads</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                           let c = 0, p = 0, r = 0;
                           bookings.forEach(b => {
                             if(b.status === 'confirmed') c++;
                             else if(b.status?.includes('pending')) p++;
                             else r++;
                           });
                           return [
                             { name: 'Confirmed', value: c, fill: '#16a34a' },
                             { name: 'Pending', value: p, fill: '#ca8a04' },
                             { name: 'Rejected', value: r, fill: '#dc2626' }
                           ].filter(d => d.value > 0);
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(() => {
                           let c = 0, p = 0, r = 0;
                           bookings.forEach(b => {
                             if(b.status === 'confirmed') c++;
                             else if(b.status?.includes('pending')) p++;
                             else r++;
                           });
                           return [
                             { name: 'Confirmed', value: c, fill: '#16a34a' },
                             { name: 'Pending', value: p, fill: '#ca8a04' },
                             { name: 'Rejected', value: r, fill: '#dc2626' }
                           ].filter(d => d.value > 0).map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.fill} />
                           ));
                        })()}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-xs font-medium">
                   <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600"></span> Confirmed</div>
                   <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-600"></span> Pending</div>
                   <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600"></span> Rejected</div>
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Booking Requests</h2>
              <span className="text-sm text-muted-foreground">{bookings.length} Total</span>
            </div>
            
            {bookings.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">No bookings yet</h3>
                <p className="text-sm text-muted-foreground">When customers book your venue, they will appear here.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <Card key={booking.id} className={`p-5 border-l-4 ${booking.status === 'pending_vendor' ? 'border-l-yellow-400 bg-yellow-50/10' : booking.status === 'pending_admin' ? 'border-l-blue-400' : booking.status === 'confirmed' ? 'border-l-green-500' : 'border-l-red-500 opacity-70'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{booking.customerName}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Venue: {booking.venueName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                          ${booking.status === 'pending_vendor' ? 'bg-yellow-100 text-yellow-800' : 
                            booking.status === 'pending_admin' ? 'bg-blue-100 text-blue-800' : 
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {booking.status === 'pending_vendor' && <Clock className="h-3 w-3" />}
                          {booking.status === 'pending_admin' && <Clock className="h-3 w-3" />}
                          {booking.status === 'confirmed' && <CheckCircle className="h-3 w-3" />}
                          {booking.status === 'rejected' && <XCircle className="h-3 w-3" />}
                          {booking.status.replace('_', ' ')}
                        </span>
                        <p className="text-sm font-semibold mt-1">{booking.totalAmount?.toLocaleString()} EGP Total</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-background/50 p-3 rounded-lg border">
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Event Date</p>
                        <p className="font-medium flex items-center gap-1">
                           <CalendarIcon className="h-4 w-4 text-primary" />
                           {new Date(booking.date).toLocaleDateString()} ({booking.slot} slot)
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Contact</p>
                        <p className="font-medium">{booking.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Deposit Paid</p>
                        <p className="font-medium text-green-600">{booking.depositPaid?.toLocaleString()} EGP</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Balance Due</p>
                        <p className="font-medium text-red-500">{(booking.totalAmount - booking.depositPaid)?.toLocaleString()} EGP</p>
                      </div>
                    </div>

                    {booking.status === 'pending_vendor' && (
                      <div className="flex gap-3 pt-2">
                        <Button 
                          onClick={() => handleUpdateBookingStatus(booking.id, 'pending_admin')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Request
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')}
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}
                    {booking.status === 'pending_admin' && (
                      <p className="text-sm text-blue-600 italic mt-2 text-center bg-blue-50 py-2 rounded">
                        You have accepted this. Waiting for final Admin confirmation.
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* Venue Info Card */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">{venue.name}</h2>
          
          <div className="space-y-4">
            <div>
               <label className="block text-sm mb-1 text-muted-foreground">Service Category</label>
               <select 
                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mb-4"
                 value={editCategory}
                 onChange={(e) => setEditCategory(e.target.value)}
               >
                 <option value="venue">Venue / Hall</option>
                 <option value="photographer">Photographer</option>
                 <option value="videographer">Videographer</option>
                 <option value="makeup">Makeup Artist</option>
                 <option value="planner">Event Planner</option>
               </select>
               <label className="block text-sm mb-1 text-muted-foreground">About the Service / Venue</label>
               <Textarea 
                 value={editDesc} 
                 onChange={(e) => setEditDesc(e.target.value)}
                 className="min-h-[100px]"
               />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm mb-1 text-muted-foreground">Price (EGP)</label>
                 <Input 
                   type="number" 
                   value={editPrice} 
                   onChange={(e) => setEditPrice(Number(e.target.value))}
                 />
               </div>
               <div>
                 <label className="block text-sm mb-1 text-muted-foreground">Capacity (Guests)</label>
                 <Input 
                   type="number" 
                   value={editCapacity} 
                   onChange={(e) => setEditCapacity(Number(e.target.value))}
                 />
               </div>
            </div>

            <Button onClick={handleSaveDetails} className="w-full">
              Save Details
            </Button>
          </div>
        </Card>

        {/* Image Management */}
        <Card className="p-4">
           <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
             <ImageIcon className="w-5 h-5 text-primary" />
             Hall Layout & Images
           </h2>

           <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
             {(venue.pendingEdits?.images || venue.images || []).map((imgUrl: string, index: number) => (
                <div key={index} className="relative group aspect-square">
                  <img src={imgUrl} alt="Venue" className="w-full h-full object-cover rounded-lg border" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-90 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
             ))}
             {(!(venue.pendingEdits?.images || venue.images)?.length) && (
               <div className="col-span-2 p-4 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                 No images uploaded yet. Show off your venue!
               </div>
             )}
           </div>

           <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
           >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload New Photos"}
           </Button>
           <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
           />
        </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-center">Manage Availability</h2>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(day) => day && setSelectedDate(day)}
                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                className="rounded-md border mb-6 flex justify-center p-4 bg-white"
              />
              {selectedDate && (
                <div className="space-y-4">
                  <h3 className="font-medium border-b pb-2">
                    Slots for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric'})}
                  </h3>
                  
                  {(() => {
                     const dateStr = selectedDate.getFullYear() + "-" + String(selectedDate.getMonth() + 1).padStart(2, '0') + "-" + String(selectedDate.getDate()).padStart(2, '0');
                     const slots = availability[dateStr] || { morning: false, evening: false, fullDay: false };
                     return (
                        <div className="flex flex-col gap-3">
                           {venue.type === 'venue' || venue.type === 'wedding' ? (
                             <>
                               <div className="flex items-center justify-between p-3 border rounded-lg">
                                 <div>
                                   <p className="font-semibold">Morning Slot</p>
                                   <p className="text-sm text-muted-foreground">10:00 AM - 03:00 PM</p>
                                 </div>
                                 <Button 
                                   variant={slots.morning ? "default" : "outline"}
                                   className={slots.morning ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                   onClick={() => handleToggleSlot('morning')}
                                 >
                                   {slots.morning ? "Available" : "Mark Available"}
                                 </Button>
                               </div>
                               <div className="flex items-center justify-between p-3 border rounded-lg">
                                 <div>
                                   <p className="font-semibold">Evening Slot</p>
                                   <p className="text-sm text-muted-foreground">06:00 PM - 12:00 AM</p>
                                 </div>
                                 <Button 
                                   variant={slots.evening ? "default" : "outline"}
                                   className={slots.evening ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                   onClick={() => handleToggleSlot('evening')}
                                 >
                                   {slots.evening ? "Available" : "Mark Available"}
                                 </Button>
                               </div>
                             </>
                           ) : (
                             <div className="flex items-center justify-between p-3 border rounded-lg">
                               <div>
                                 <p className="font-semibold">Full Day Availability</p>
                                 <p className="text-sm text-muted-foreground">Available for the whole day</p>
                               </div>
                               <Button 
                                 variant={slots.fullDay ? "default" : "outline"}
                                 className={slots.fullDay ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                 onClick={() => handleToggleSlot('fullDay')}
                               >
                                 {slots.fullDay ? "Available" : "Mark Available"}
                               </Button>
                             </div>
                           )}

                           {/* Block Entire Day Button */}
                           {(slots.morning || slots.evening || slots.fullDay) && (
                             <Button 
                               variant="destructive"
                               className="w-full mt-2"
                               onClick={() => handleToggleSlot('blockAll')}
                             >
                               Block Entire Date
                             </Button>
                           )}
                        </div>
                     );
                  })()}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            {/* Amenities Card */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-center">Included Amenities</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                 {AVAILABLE_AMENITIES.map((amenity, index) => {
                   const Icon = amenity.icon;
                   const isSelected = editAmenities.includes(amenity.name);
                   return (
                     <button
                       key={index}
                       type="button"
                       onClick={() => {
                         if (isSelected) {
                            setEditAmenities(editAmenities.filter(a => a !== amenity.name));
                         } else {
                            setEditAmenities([...editAmenities, amenity.name]);
                         }
                       }}
                       className={`p-3 rounded-lg border flex items-center gap-2 text-sm transition-colors text-left ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                     >
                       <Icon className="h-4 w-4" />
                       <span className="flex-1">{amenity.name}</span>
                       {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                     </button>
                   );
                 })}
                 {editAmenities.filter(a => !AVAILABLE_AMENITIES.some(def => def.name === a)).map((customName, idx) => (
                   <button
                     key={`custom-${idx}`}
                     type="button"
                     onClick={() => setEditAmenities(editAmenities.filter(a => a !== customName))}
                     className="p-3 rounded-lg border flex items-center gap-2 text-sm transition-colors text-left border-primary bg-primary/10 text-primary"
                   >
                     <Plus className="h-4 w-4" />
                     <span className="flex-1">{customName}</span>
                     <div className="w-2 h-2 rounded-full bg-primary" />
                   </button>
                 ))}
              </div>
              <div className="flex gap-2 mb-4">
                <Input 
                  placeholder="Custom amenity (e.g. Smoke Machine)" 
                  value={customAmenity}
                  onChange={e => setCustomAmenity(e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    if (customAmenity.trim() && !editAmenities.includes(customAmenity.trim())) {
                      setEditAmenities([...editAmenities, customAmenity.trim()]);
                    }
                    setCustomAmenity('');
                  }}
                >
                  Add Custom
                </Button>
              </div>
              <Button onClick={handleSaveDetails} className="w-full">Save Options</Button>
            </Card>

            {/* Packages Card */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-center">Custom Pricing Packages</h2>
              
              <div className="space-y-3 mb-6">
                {editPackages.map((pkg, idx) => (
                  <div key={idx} className="p-3 border rounded-lg relative">
                     <button 
                       onClick={() => setEditPackages(editPackages.filter(p => p.id !== pkg.id))}
                       className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                     <h3 className="font-bold">{pkg.name}</h3>
                     <p className="font-medium text-primary mb-1">{pkg.price.toLocaleString()} EGP</p>
                     <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  </div>
                ))}
                {editPackages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No packages added yet. E.g "Morning Package".</p>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                 <h3 className="font-medium text-sm text-muted-foreground">Add New Package</h3>
                 <Input 
                   placeholder="Package Name (e.g. Basic Package)" 
                   value={newPackage.name}
                   onChange={e => setNewPackage({...newPackage, name: e.target.value})}
                 />
                 <Input 
                   type="number"
                   placeholder="Price (EGP)" 
                   value={newPackage.price || ''}
                   onChange={e => setNewPackage({...newPackage, price: Number(e.target.value)})}
                 />
                 <Textarea 
                   placeholder="What is included in this package?" 
                   value={newPackage.description}
                   onChange={e => setNewPackage({...newPackage, description: e.target.value})}
                   className="min-h-[60px]"
                 />
                 <Button 
                   variant="secondary" 
                   className="w-full"
                   disabled={!newPackage.name || !newPackage.price}
                   onClick={() => {
                     setEditPackages([...editPackages, { ...newPackage, id: Date.now().toString() }]);
                     setNewPackage({ name: '', price: 0, description: '' });
                   }}
                 >
                   <Plus className="h-4 w-4 mr-1" /> Add Package
                 </Button>
              </div>

              <div className="mt-4">
                <Button onClick={handleSaveDetails} className="w-full bg-primary hover:bg-primary/90">
                  Submit Packages for Approval
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Support Tab for Vendors */}
          <TabsContent value="support" className="space-y-6">
            <Card className="p-4 border-primary/20 bg-primary/5">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                 <MessageSquare className="h-5 w-5 text-primary" />
                 Vendor Support Tickets
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Have an issue with your account, venue, or a specific booking? Submit a ticket to the administration team.</p>
              
              <div className="space-y-3">
                 <Input 
                    placeholder="Subject (e.g. Venue Edit Help, Booking BK-123)" 
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
                    Submit Ticket to Admin
                 </Button>
              </div>
            </Card>

            <div className="space-y-3">
              <h4 className="font-semibold text-muted-foreground">Your Previous Tickets</h4>
              {tickets.length === 0 ? (
                <p className="text-sm text-center py-4 border border-dashed rounded-lg bg-background">You have not submitted any support tickets.</p>
              ) : (
                tickets.map(ticket => (
                  <Card key={ticket.id} className="p-4 border-l-4 border-l-primary">
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
    </div>
  );
}
