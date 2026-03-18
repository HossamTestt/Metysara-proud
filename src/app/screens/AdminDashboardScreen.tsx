import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Calendar } from '../components/ui/calendar';
import { useVenues } from '../contexts/VenuesContext';

import { auth, db, storage } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, getDocs, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { NotificationDropdown } from '../components/ui/NotificationDropdown';
import { createNotification } from '../utils/notifications';
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
  Reply
} from 'lucide-react';

const dashboardStats = [
  { label: 'Total Venues', value: '24', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'Total Bookings', value: '156', icon: CalendarIcon, color: 'text-green-600', bg: 'bg-green-100' },
  { label: 'Revenue (Month)', value: '2.4M EGP', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
  { label: 'Active Users', value: '1.2K', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
];

// Removed hardcoded recentBookings

export function AdminDashboardScreen() {
  const navigate = useNavigate();
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
    category: 'venue'
  });

  const [bookings, setBookings] = useState<any[]>([]);
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  
  // Fetch bookings and tickets
  useEffect(() => {
    const fetchData = async () => { // Renamed from fetchBookings to fetchData to encompass tickets
      try {
        const snapshot = await getDocs(collection(db, 'bookings'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setBookings(data);
        
        // Fetch Tickets
        const tSnap = await getDocs(collection(db, 'tickets'));
        const tData = tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setTickets(tData);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      }
    };
    fetchData();
  }, []);

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus
      });
      
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
         await createNotification(booking.userId, `Booking ${newStatus === 'confirmed' ? 'Confirmed' : 'Rejected'}`, `Your booking for ${booking.venueName} has been ${newStatus}.`);
         await createNotification(booking.vendorId, `Booking ${newStatus === 'confirmed' ? 'Confirmed' : 'Rejected'}`, `The booking for ${booking.venueName} has been ${newStatus} by the Admin.`);
      }
      
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      alert(`Booking ${newStatus} successfully!`);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleReplyToTicket = async (ticketId: string) => {
    const text = replyText[ticketId];
    if (!text || !text.trim()) return;

    try {
      const replyObj = {
        message: text,
        adminName: 'Admin', // Assuming admin is logged in, or a default name
        createdAt: new Date()
      };
      
      await updateDoc(doc(db, 'tickets', ticketId), {
        replies: arrayUnion(replyObj),
        status: 'resolved' // auto resolve after answering
      });
      
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
         await createNotification(ticket.userId, 'Support Reply from Admin', `Admin has replied to your ticket: "${ticket.subject}"`);
      }
      
      setTickets(tickets.map(t => {
        if (t.id === ticketId) {
          return { ...t, status: 'resolved', replies: [...(t.replies || []), replyObj] };
        }
        return t;
      }));
      setReplyText({ ...replyText, [ticketId]: '' });
      alert('Reply sent successfully!');
    } catch (e: any) {
      alert("Error sending reply: " + e.message);
    }
  };

  const handleAddVendor = async () => {
    if (!newVendor.email.toLowerCase().endsWith('@metysaravendors.com')) {
      alert("Vendor emails must end with @metysaravendors.com");
      return;
    }

    try {
      // 1. Create User in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, newVendor.email, newVendor.password);
      
      // 2. Add User Details to Firestore
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email: newVendor.email,
        name: newVendor.name,
        phone: newVendor.phone,
        role: 'vendor',
        venueName: newVendor.venueName
      });

      // 3. Optional: Auto-create a sample blank venue assigned to them
      const venueId = Date.now().toString(); // simplified unique ID
      await setDoc(doc(db, 'venues', venueId), {
        id: venueId,
        ownerId: userCred.user.uid,
        name: newVendor.venueName,
        nameAr: newVendor.venueName, // placeholder structure
        description: 'New vendor venue pending setup.',
        descriptionAr: '',
        price: 0,
        capacity: 0,
        location: '',
        zone: '',
        images: [],
        type: newVendor.category,
        rating: 0,
        reviews: 0,
      });

      // Reset and close
      setIsAddVendorDialogOpen(false);
      setNewVendor({ name: '', email: '', password: '', phone: '', venueName: '', category: 'venue' });
      alert("Vendor registered successfully!");
      
    } catch (error: any) {
      console.error("Error creating vendor:", error);
      alert("Error: " + error.message);
    }
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
        type: venue.pendingEdits.type ?? venue.type,
        images: venue.pendingEdits.images ?? venue.images,
        amenities: venue.pendingEdits.amenities ?? venue.amenities,
        packages: venue.pendingEdits.packages ?? venue.packages,
        pendingEdits: null
      };
      await updateDoc(doc(db, 'venues', venue.id), mergedData);
      alert('Vendor edits approved and pushed live!');
    } catch (e: any) {
      alert('Error approving edits: ' + e.message);
    }
  };

  const handleRejectEdits = async (venue: any) => {
    try {
      await updateDoc(doc(db, 'venues', venue.id), {
        pendingEdits: null
      });
      alert('Vendor edits rejected.');
    } catch (e: any) {
      alert('Error rejecting edits: ' + e.message);
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
        const file = files[i];
        const fileRef = ref(storage, `venues/${editingVenue.id}/${Date.now()}_${file.name}`);
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
      alert('Failed to upload images.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
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
      <div className="bg-card px-6 pt-12 pb-6 rounded-b-3xl shadow-sm sticky top-0 z-10 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => navigate('/home')}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl flex-1">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
             <NotificationDropdown />
             <Button 
               onClick={() => setIsAddVendorDialogOpen(true)}
               size="sm" 
               className="bg-primary hover:bg-primary/90"
             >
               <UserPlus className="w-4 h-4 mr-2" />
               Add Vendor
             </Button>
          </div>
        </div>
        <p className="text-muted-foreground">Manage your venues and bookings</p>
      </div>

      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold mb-1">{venues.length}</p>
            <p className="text-sm text-muted-foreground">Total Venues</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-100">
                <CalendarIcon className="h-5 w-5 text-green-600" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold mb-1">{bookings.length}</p>
            <p className="text-sm text-muted-foreground">Total Bookings</p>
          </Card>
          <Card className="p-4 col-span-2">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-yellow-100">
                <MessageSquare className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{tickets.filter(t => t.status === 'open').length}</p>
            <p className="text-sm text-muted-foreground">Open Support Tickets</p>
          </Card>
        </div>
      </div>
      
      {/* Financial Overview (Small Banner) */}
      <div className="px-6 mb-6">
         <Card className="p-4 bg-gradient-to-r from-primary to-primary/80 text-white border-0">
            <div className="grid grid-cols-2 text-center divide-x divide-white/20">
               <div>
                  <p className="text-sm text-primary-foreground/80 mb-1">Total System Revenue</p>
                  <p className="text-2xl font-bold">
                     {bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()} EGP
                  </p>
               </div>
               <div>
                  <p className="text-sm text-primary-foreground/80 mb-1">Platform Fees (10%)</p>
                  <p className="text-2xl font-bold text-green-300">
                     {(bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.totalAmount || 0), 0) * 0.1).toLocaleString()} EGP
                  </p>
               </div>
            </div>
         </Card>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-6 text-xs">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="venues">Venues</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="verification">
              Verify {pendingVenues.length > 0 && `(${pendingVenues.length})`}
            </TabsTrigger>
            <TabsTrigger value="helpdesk">Help Desk</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
             <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 text-center">Revenue by Month (Confirmed)</h3>
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
                <h3 className="text-lg font-semibold mb-2 text-center">Booking Status Distribution</h3>
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
                             { name: 'Confirmed', value: c, fill: '#16a34a' }, // green-600
                             { name: 'Pending', value: p, fill: '#ca8a04' }, // yellow-600
                             { name: 'Rejected', value: r, fill: '#dc2626' } // red-600
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
                             else if(b.status.includes('pending')) p++;
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

          <TabsContent value="venues" className="space-y-4">
            {venues.map((venue) => (
              <Card key={venue.id} className="p-4">
                <div className="flex gap-4">
                  {venue.images && venue.images.length > 0 ? (
                    <img
                      src={venue.images[0]}
                      alt={venue.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{venue.name}</h3>
                        <p className="text-sm text-muted-foreground" dir="rtl">{venue.nameAr}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingCalendarFor(venue)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="View Live Calendar"
                        >
                          <CalendarIcon className="h-4 w-4 text-primary" />
                        </button>
                        <button
                          onClick={() => handleEditVenue(venue)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{venue.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{venue.capacity}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{venue.price.toLocaleString()} EGP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">No bookings found in the system.</div>
            ) : bookings.map((booking) => (
              <Card key={booking.id} className={`p-4 border-l-4 ${booking.status === 'pending_admin' ? 'border-l-blue-500 bg-blue-50/10' : booking.status === 'confirmed' ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">ID: {booking.id.slice(0, 8)}...</p>
                    <p className="font-bold text-lg">{booking.customerName}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 uppercase ${getStatusBadge(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    {booking.status.replace('_', ' ')}
                  </div>
                </div>
                <div className="space-y-2 text-sm bg-muted/20 p-3 rounded border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Venue:</span>
                    <span className="font-medium">{booking.venueName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{booking.date} ({booking.slot})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-bold text-primary">{booking.totalAmount?.toLocaleString()} EGP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Deposit Paid:</span>
                    <span className="font-medium text-green-600">{booking.depositPaid?.toLocaleString()} EGP</span>
                  </div>
                </div>
                
                {booking.status === 'pending_admin' && (
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <Button 
                       onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                       className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                       size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Finish & Confirm
                    </Button>
                    <Button 
                       onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')}
                       variant="outline"
                       className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                       size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                )}
                
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            {pendingVenues.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-200 mb-3" />
                <p>All clear! No pending changes from vendors.</p>
              </div>
            ) : (
              pendingVenues.map((venue: any) => (
                <Card key={venue.id} className="p-4 border-yellow-200 bg-yellow-50/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{venue.name}</h3>
                      <p className="text-xs text-muted-foreground">Sent updates awaiting your review</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleRejectEdits(venue)}
                        className="text-red-500 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleApproveEdits(venue)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm space-y-2 bg-white p-3 rounded-lg border">
                    {venue.pendingEdits?.price !== undefined && venue.pendingEdits.price !== venue.price && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price Change:</span>
                        <span><span className="line-through text-red-400">{venue.price} EGP</span> → <span className="text-green-600 font-bold">{venue.pendingEdits.price} EGP</span></span>
                      </div>
                    )}
                    {venue.pendingEdits?.capacity !== undefined && venue.pendingEdits.capacity !== venue.capacity && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity Change:</span>
                        <span><span className="line-through text-red-400">{venue.capacity}</span> → <span className="text-green-600 font-bold">{venue.pendingEdits.capacity}</span></span>
                      </div>
                    )}
                    {venue.pendingEdits?.type !== undefined && venue.pendingEdits.type !== venue.type && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category Change:</span>
                        <span><span className="line-through text-red-400">{venue.type}</span> → <span className="text-green-600 font-bold">{venue.pendingEdits.type}</span></span>
                      </div>
                    )}
                    {venue.pendingEdits?.images && venue.pendingEdits.images.length !== venue.images?.length && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Images:</span>
                        <span className="font-semibold text-green-600">New photos uploaded ({venue.images?.length || 0} → {venue.pendingEdits.images.length})</span>
                      </div>
                    )}
                    {venue.pendingEdits?.amenities !== undefined && venue.pendingEdits.amenities !== venue.amenities && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amenities:</span>
                        <span className="font-semibold text-green-600">Updated to {venue.pendingEdits.amenities.length} amenities</span>
                      </div>
                    )}
                    {venue.pendingEdits?.packages !== undefined && venue.pendingEdits.packages !== venue.packages && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Packages:</span>
                        <span className="font-semibold text-green-600">Updated to {venue.pendingEdits.packages.length} packages</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="helpdesk" className="space-y-4">
             {tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No support tickets have been submitted.</div>
             ) : tickets.map(ticket => (
                <Card key={ticket.id} className="p-4 border-l-4 border-l-purple-500">
                   <div className="flex justify-between items-start mb-2">
                      <div>
                         <h5 className="font-bold">{ticket.subject}</h5>
                         <p className="text-xs text-muted-foreground flex gap-2">
                            <span>From: {ticket.userName} ({ticket.userRole})</span>
                            <span>•</span>
                            <span>{new Date(ticket.createdAt?.toMillis ? ticket.createdAt.toMillis() : Date.now()).toLocaleDateString()}</span>
                         </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full uppercase font-medium ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                         {ticket.status}
                      </span>
                   </div>
                   
                   <p className="text-sm border-l-2 border-muted pl-3 py-1 my-3 bg-muted/10 italic">"{ticket.message}"</p>
                   
                   {ticket.replies && ticket.replies.length > 0 && (
                      <div className="mt-3 pt-3 border-t bg-purple-50/50 p-3 rounded-lg">
                         <p className="text-xs font-semibold text-purple-700 mb-1">Previous Admin Response:</p>
                         <p className="text-sm text-purple-900">{ticket.replies[ticket.replies.length - 1].message}</p>
                      </div>
                   )}
                   
                   {ticket.status === 'open' && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                         <Textarea 
                            placeholder="Type your response to the user here... (This will mark the ticket as resolved)"
                            value={replyText[ticket.id] || ''}
                            onChange={(e) => setReplyText({...replyText, [ticket.id]: e.target.value})}
                         />
                         <Button 
                            className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                            onClick={() => handleReplyToTicket(ticket.id)}
                            disabled={!replyText[ticket.id]}
                         >
                            <Reply className="w-4 h-4 mr-2" /> Send Reply & Resolve
                         </Button>
                      </div>
                   )}
                </Card>
             ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Venue Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Venue</DialogTitle>
          </DialogHeader>
          {editingVenue && (
            <div className="space-y-4 py-4">
              {/* Name English */}
              <div>
                <label className="block text-sm mb-2">Name (English)</label>
                <Input
                  value={editingVenue.name}
                  onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })}
                />
              </div>

              {/* Name Arabic */}
              <div>
                <label className="block text-sm mb-2">Name (Arabic)</label>
                <Input
                  value={editingVenue.nameAr}
                  onChange={(e) => setEditingVenue({ ...editingVenue, nameAr: e.target.value })}
                  dir="rtl"
                />
              </div>

              {/* Description English */}
              <div>
                <label className="block text-sm mb-2">Description (English)</label>
                <Textarea
                  value={editingVenue.description}
                  onChange={(e) => setEditingVenue({ ...editingVenue, description: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              {/* Description Arabic */}
              <div>
                <label className="block text-sm mb-2">Description (Arabic)</label>
                <Textarea
                  value={editingVenue.descriptionAr}
                  onChange={(e) => setEditingVenue({ ...editingVenue, descriptionAr: e.target.value })}
                  className="min-h-[80px]"
                  dir="rtl"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm mb-2">Price (EGP)</label>
                <Input
                  type="number"
                  value={editingVenue.price}
                  onChange={(e) => setEditingVenue({ ...editingVenue, price: Number(e.target.value) })}
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm mb-2">Capacity</label>
                <Input
                  type="number"
                  value={editingVenue.capacity}
                  onChange={(e) => setEditingVenue({ ...editingVenue, capacity: Number(e.target.value) })}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm mb-2">Location</label>
                <Input
                  value={editingVenue.location}
                  onChange={(e) => setEditingVenue({ ...editingVenue, location: e.target.value })}
                />
              </div>

              {/* Zone */}
              <div>
                <label className="block text-sm mb-2">Zone</label>
                <Input
                  value={editingVenue.zone}
                  onChange={(e) => setEditingVenue({ ...editingVenue, zone: e.target.value })}
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm mb-2">Venue Images</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {(editingVenue.images || []).map((img: string, index: number) => (
                    <div key={index} className="relative group">
                      <img src={img} alt="" className="w-full h-20 object-cover rounded-lg" />
                      <button
                        onClick={() => {
                          const newImages = [...editingVenue.images];
                          newImages.splice(index, 1);
                          setEditingVenue({ ...editingVenue, images: newImages });
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
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
                  disabled={isUploading}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveVenue}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Vendor Dialog */}
      <Dialog open={isAddVendorDialogOpen} onOpenChange={setIsAddVendorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm mb-2">Vendor Owner Name</label>
              <Input
                value={newVendor.name}
                onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                placeholder="Ahmed Ali"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Login Email</label>
              <Input
                type="email"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                placeholder="vendor@metysara.com"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Temporary Password</label>
              <Input
                type="password"
                value={newVendor.password}
                onChange={(e) => setNewVendor({ ...newVendor, password: e.target.value })}
                placeholder="********"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Phone Number</label>
              <Input
                type="tel"
                value={newVendor.phone}
                onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                placeholder="01xxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Service Name (e.g., Grand Palace Hotel, Ahmed Photography)</label>
              <Input
                value={newVendor.venueName}
                onChange={(e) => setNewVendor({ ...newVendor, venueName: e.target.value })}
                placeholder="Grand Palace Hotel"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-primary font-bold">Service Category</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newVendor.category}
                onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
              >
                <option value="venue">Venue / Hall</option>
                <option value="photographer">Photographer</option>
                <option value="videographer">Videographer</option>
                <option value="makeup">Makeup Artist</option>
                <option value="planner">Event Planner</option>
              </select>
            </div>

            <Button
              onClick={handleAddVendor}
              className="w-full bg-primary hover:bg-primary/90 mt-4"
            >
              <Save className="h-4 w-4 mr-2" />
              Register Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Calendar Dialog */}
      <Dialog open={!!viewingCalendarFor} onOpenChange={(open) => !open && setViewingCalendarFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingCalendarFor?.name} - Live Calendar</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <Calendar
              mode="single"
              disabled={(date) => {
                 if (!viewingCalendarFor) return true;
                 const today = new Date();
                 today.setHours(0,0,0,0);
                 if (date < today) return true;
                 if (!viewingCalendarFor.availability || Object.keys(viewingCalendarFor.availability).length === 0) return false;
                 const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0');
                 const slots = viewingCalendarFor.availability[dateStr];
                 if (!slots) return true;
                 return !(slots.morning || slots.evening);
              }}
              className="rounded-md border p-4 mb-4 bg-white"
            />
            <p className="text-sm text-muted-foreground text-center">Dates disabled are blocked out by the vendor.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}