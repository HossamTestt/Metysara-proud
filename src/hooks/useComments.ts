import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

// Assume Comment type exists, defining a basic one if not in types yet
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  venueId: string;
  rating: number;
  text: string;
  createdAt: any;
  photos?: string[];
}

export function useComments(venueId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'comments'),
      where('venueId', '==', venueId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[];
        setComments(fetchedComments);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching comments:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [venueId]);

  return { comments, loading };
}
