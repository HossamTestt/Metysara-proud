export type Role = 'customer' | 'vendor' | 'admin' | 'support';

export type BookingStatus = 'pending_vendor' | 'pending_admin' | 'confirmed' | 'rejected' | 'cancelled' | 'rate_limit';

export type PaymentMethod = 'bank' | 'venue';

export type BookingSlot = 'morning' | 'evening' | 'fullDay';

export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid';

export interface UserData {
  uid: string;
  email: string;
  role: Role;
  name: string;
  phone?: string;
  venueId?: string; // If role is vendor
  fcmToken?: string;
  notificationsEnabled?: boolean;
}

export interface VenuePackage {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  features?: string[];
}

export interface Venue {
  id: string;
  name: string;
  nameAr?: string;
  type: string;
  subType?: string;
  description: string;
  descriptionAr?: string;
  location: string;
  zone?: string;
  locationLink?: string;
  price: number;
  capacity: number;
  images: string[];
  rating?: number;
  amenities?: string[];
  policies?: string;
  policiesAr?: string;
  packages?: VenuePackage[];
  services?: typeof import('../constants').additionalServices;
  availability?: Record<string, { fullyBooked?: boolean; morning?: boolean; evening?: boolean; fullDay?: boolean }>;
  timeSlots?: {
    morningLabel?: string;
    eveningLabel?: string;
  };
  vendorId?: string;
  ownerId?: string;
  reviews?: number;
}

export interface Booking {
  id: string;
  serialId?: string;
  venueId: string;
  venueName?: string;
  venueNameAr?: string;
  venueImage?: string;
  customerId: string;
  vendorId?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  date: string;
  slot: BookingSlot;
  paymentMethod?: PaymentMethod | null;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  guests?: number;
  packageName?: string;
  packageId?: string;
  totalAmount?: number;
  depositAmount?: number;
  notes?: string;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any;
}

export interface BookingPrivateDetails {
  bookingId: string;
  paymentMethod?: string;
  transactionId?: string;
}

export interface Ticket {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  subject: string;
  message: string;
  status: 'open' | 'closed' | 'in_progress';
  userRole?: string;
  createdAt: any;
  replies: any[];
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
  isRead?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  createdAt: any;
  isRead: boolean;
  type?: string;
  data?: any;
}
