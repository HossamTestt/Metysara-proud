import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, arrayUnion, arrayRemove, getDocs, query, limit, startAfter, DocumentSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export interface VenuePackage {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  description: string;
  descriptionAr: string;
}

export interface Venue {
  id: string;
  ownerId?: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr?: string;
  policies?: string;
  policiesAr?: string;
  location: string;
  locationLink?: string;
  zone: string;
  price: number;
  rating: number;
  reviews: number;
  capacity: number;
  images: string[];
  type: string; // wedding, funeral, catering, photographer, videographer, makeup, planner, event_hall
  subType?: string;
  city?: string;
  timeSlots?: { morningLabel?: string; eveningLabel?: string };
  availability?: Record<string, { morning?: boolean, evening?: boolean, fullDay?: boolean, fullyBooked?: boolean }>;
  amenities?: string[];
  packages?: VenuePackage[];
  services?: any[];
  pendingEdits?: any;
}

interface Comment {
  id: string;
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
  savedVenues: string[];
  hasMore: boolean;
  loadMoreVenues: () => Promise<void>;
  updateVenue: (id: string, updates: Partial<Venue>) => Promise<void>;
  addComment: (comment: Omit<Comment, 'id' | 'date'>) => Promise<void>;
  toggleFavorite: (venueId: string) => Promise<void>;
  getVenueById: (id: string) => Venue | undefined;
  getCommentsByVenueId: (venueId: string) => Comment[];
}

const VenuesContext = createContext<VenuesContextType | undefined>(undefined);

export function VenuesProvider({ children }: { children: ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [savedVenues, setSavedVenues] = useState<string[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const venuesQuery = query(collection(db, 'venues'), orderBy('rating', 'desc'), limit(20));
    const unsubscribeVenues = onSnapshot(venuesQuery, (snapshot) => {
      const venuesData: Venue[] = [];
      snapshot.forEach((doc) => {
        venuesData.push({ id: doc.id, ...doc.data() } as Venue);
      });
      setVenues(venuesData);
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastDoc || null);
      setHasMore(snapshot.docs.length === 20);
    });

    return () => {
      unsubscribeVenues();
    };
  }, []);

  // Sync favorites from user document
  useEffect(() => {
    if (!currentUser) {
      setSavedVenues([]);
      return;
    }

    const unsubscribeUser = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSavedVenues(data.favorites || []);
      }
    });

    return () => unsubscribeUser();
  }, [currentUser]);

  const updateVenue = async (id: string, updates: Partial<Venue>) => {
    try {
      await updateDoc(doc(db, 'venues', id), updates);
    } catch (e) {
      console.error("Error updating venue:", e);
    }
  };

  const loadMoreVenues = useCallback(async () => {
    if (!lastVisible || !hasMore) return;
    try {
      const q = query(
        collection(db, 'venues'),
        orderBy('rating', 'desc'),
        startAfter(lastVisible),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const newVenues = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Venue);
      setVenues(prev => [...prev, ...newVenues]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 20);
    } catch (e) {
      console.error('Error loading more venues:', e);
    }
  }, [lastVisible, hasMore]);

  const addComment = async (comment: Omit<Comment, 'id' | 'date'>) => {
    try {
      const newDate = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'comments'), {
        ...comment,
        date: newDate
      });

      // ── Client-side rating calculation removed ──
      // Venue rating and review counts are now updated securely via Cloud Functions (onCommentWritten).
    } catch (e) {
      console.error('Error adding comment:', e);
      throw e;
    }
  };


  const toggleFavorite = async (venueId: string) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const isSaved = savedVenues.includes(venueId);

    try {
      if (isSaved) {
        await updateDoc(userRef, {
          favorites: arrayRemove(venueId)
        });
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(venueId)
        });
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
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
      savedVenues,
      hasMore,
      loadMoreVenues,
      updateVenue,
      addComment,
      toggleFavorite,
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
