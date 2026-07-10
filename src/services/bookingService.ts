import { collection, doc, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Booking } from '../types';

export const getBookingById = async (id: string): Promise<Booking> => {
  const docRef = doc(db, 'bookings', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error('Booking not found');
  }
  return { id: docSnap.id, ...docSnap.data() } as Booking;
};

export const getBookingsByCustomer = async (uid: string): Promise<Booking[]> => {
  const q = query(collection(db, 'bookings'), where('customerId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Booking);
};

export const getBookingsByVendor = async (uid: string): Promise<Booking[]> => {
  const q = query(collection(db, 'bookings'), where('vendorId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Booking);
};

export const cancelBooking = async (id: string, reason: string): Promise<void> => {
  const docRef = doc(db, 'bookings', id);
  await updateDoc(docRef, {
    status: 'cancelled',
    cancellationReason: reason,
    cancelledAt: new Date().toISOString()
  });
};
