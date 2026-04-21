import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const createNotification = async (
  userId: string,
  title: string,
  message: string
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};
