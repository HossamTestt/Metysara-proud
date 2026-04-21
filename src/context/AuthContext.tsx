import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

type Role = 'customer' | 'vendor' | 'admin' | 'support';

interface UserData {
  uid: string;
  email: string;
  role: Role;
  name: string;
  phone?: string;
  venueId?: string; // If role is vendor
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: Role) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user document to get their exact role
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          } else {
            // Default edge-case fallback layout
            setUserData({ uid: user.uid, email: user.email || '', role: 'customer', name: 'User' });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser || !Capacitor.isNativePlatform()) return;

    const setupPushNotifications = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') {
          console.log('Push notification permissions denied.');
          return;
        }

        await PushNotifications.register();

        await PushNotifications.addListener('registration', async (token) => {
          try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
              fcmToken: token.value
            });
          } catch (err) {
            console.error('Failed to save fcmToken:', err);
          }
        });

        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });

        await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          console.log('Push received:', notification);
          
          // Show a local notification banner if the app is in the foreground
          await LocalNotifications.schedule({
            notifications: [
              {
                title: notification.title || 'New Notification',
                body: notification.body || '',
                id: Math.floor(Math.random() * 1000000),
                extra: notification.data,
                smallIcon: 'ic_stat_notification',
                iconColor: '#D4AF37',
                actionTypeId: '',
                schedule: { at: new Date(Date.now() + 1) },
              }
            ]
          });
        });
      } catch (e) {
        console.error('Error setting up push notifications:', e);
      }
    };

    setupPushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [currentUser]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string, role: Role = 'customer') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create the user document with their role
    const newUserData: UserData = {
      uid: user.uid,
      email: user.email!,
      role,
      name,
    };
    
    await setDoc(doc(db, 'users', user.uid), newUserData);
    setUserData(newUserData);
    setCurrentUser(user);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithGoogle();
      if (result.credential?.idToken) {
        const credential = GoogleAuthProvider.credential(result.credential.idToken);
        const userCred = await signInWithCredential(auth, credential);
        await saveSocialUser(userCred.user);
      }
    } else {
      // Fallback for web browser testing
      const result = await FirebaseAuthentication.signInWithGoogle();
      if (result.credential?.idToken) {
        const credential = GoogleAuthProvider.credential(result.credential.idToken);
        const userCred = await signInWithCredential(auth, credential);
        await saveSocialUser(userCred.user);
      }
    }
  };

  const loginWithFacebook = async () => {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithFacebook();
      if (result.credential?.accessToken) {
        const credential = FacebookAuthProvider.credential(result.credential.accessToken);
        const userCred = await signInWithCredential(auth, credential);
        await saveSocialUser(userCred.user);
      }
    } else {
       // Fallback for web browser testing
       const result = await FirebaseAuthentication.signInWithFacebook();
       if (result.credential?.accessToken) {
         const credential = FacebookAuthProvider.credential(result.credential.accessToken);
         const userCred = await signInWithCredential(auth, credential);
         await saveSocialUser(userCred.user);
       }
    }
  };

  const saveSocialUser = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      const newUserData: UserData = {
        uid: user.uid,
        email: user.email || '',
        role: 'customer',
        name: user.displayName || 'User',
      };
      await setDoc(userDocRef, newUserData);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading, login, register, loginWithGoogle, loginWithFacebook, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
