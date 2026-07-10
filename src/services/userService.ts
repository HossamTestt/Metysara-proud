import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserData } from '../types';

export const updateUserProfile = async (uid: string, data: Partial<UserData>): Promise<void> => {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, data);
};

export const getAdmins = async (): Promise<UserData[]> => {
  const q = query(collection(db, 'users'), where('role', 'in', ['admin', 'support']));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as unknown as UserData);
};
