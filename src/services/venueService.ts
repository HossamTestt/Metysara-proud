import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Venue, Booking } from '../types';

export const getVenueById = async (id: string): Promise<Venue> => {
  const docRef = doc(db, 'venues', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error('Venue not found');
  }
  return { id: docSnap.id, ...docSnap.data() } as Venue;
};

export const updateVenue = async (id: string, data: Partial<Venue>): Promise<void> => {
  const docRef = doc(db, 'venues', id);
  await updateDoc(docRef, data);
};

export const getBookingsForVenue = async (venueId: string): Promise<Booking[]> => {
  const q = query(collection(db, 'bookings'), where('venueId', '==', venueId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Booking);
};
