import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Ticket } from '../types';

export const createTicket = async (data: Omit<Ticket, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'tickets'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getTicketsByUser = async (uid: string): Promise<Ticket[]> => {
  const q = query(collection(db, 'tickets'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Ticket);
};
