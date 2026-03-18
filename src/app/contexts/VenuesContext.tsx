import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';

// ... (keep Venue and Comment interfaces identical)
interface Venue {
  id: string; // Updated to string for Firestore 
  ownerId?: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  location: string;
  zone: string;
  price: number;
  rating: number;
  reviews: number;
  capacity: number;
  images: string[];
  type: string;
  city?: string;
  availability?: Record<string, { morning?: boolean, evening?: boolean, fullDay?: boolean }>;
  amenities?: string[];
  packages?: { id: string, name: string, price: number, description: string }[];
  pendingEdits?: any;
}

interface Comment {
  id: string; // Updated to string for Firestore
  venueId: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  date: string;
  photos?: string[];
}

interface VenuesContextType {
  venues: Venue[];
  comments: Comment[];
  updateVenue: (id: string, updates: Partial<Venue>) => Promise<void>;
  addComment: (comment: Omit<Comment, 'id' | 'date'>) => Promise<void>;
  getVenueById: (id: string) => Venue | undefined;
  getCommentsByVenueId: (venueId: string) => Comment[];
}

const VenuesContext = createContext<VenuesContextType | undefined>(undefined);

export function VenuesProvider({ children }: { children: ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    // Listen to Venues
    const unsubscribeVenues = onSnapshot(collection(db, 'venues'), (snapshot) => {
      const venuesData: Venue[] = [];
      snapshot.forEach((doc) => {
        venuesData.push({ id: doc.id, ...doc.data() } as Venue);
      });
      setVenues(venuesData);
    });

    // Listen to Comments
    const unsubscribeComments = onSnapshot(collection(db, 'comments'), (snapshot) => {
      const commentsData: Comment[] = [];
      snapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(commentsData);
    });

    return () => {
      unsubscribeVenues();
      unsubscribeComments();
    };
  }, []);

  const updateVenue = async (id: string, updates: Partial<Venue>) => {
    try {
      await updateDoc(doc(db, 'venues', id), updates);
    } catch (e) {
      console.error("Error updating venue:", e);
    }
  };

  const addComment = async (comment: Omit<Comment, 'id' | 'date'>) => {
    try {
      await addDoc(collection(db, 'comments'), {
        ...comment,
        date: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error adding comment:", e);
    }
  };

  const getVenueById = (id: string) => {
    return venues.find(v => v.id === id);
  };

  const getCommentsByVenueId = (venueId: string) => {
    return comments.filter(c => c.venueId === venueId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  return (
    <VenuesContext.Provider value={{
      venues,
      comments,
      updateVenue,
      addComment,
      getVenueById,
      getCommentsByVenueId,
    }}>
      {children}
    </VenuesContext.Provider>
  );
}

export function useVenues() {
  const context = useContext(VenuesContext);
  if (!context) {
    throw new Error('useVenues must be used within VenuesProvider');
  }
  return context;
}