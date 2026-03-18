import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { Bell, CheckCircle } from 'lucide-react';
import { Card } from './card';

export function NotificationDropdown() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!currentUser) return;

    // Listen to notifications in real-time
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => {
         const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
         const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
         return tB - tA;
      });
      setNotifications(notes);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  };

  const markAllAsRead = () => {
    notifications.filter(n => !n.read).forEach(n => markAsRead(n.id));
  };

  if (!currentUser) return null;

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto shadow-lg z-50 p-0 border">
             <div className="flex justify-between items-center p-3 border-b bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                   <button 
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                   >
                      <CheckCircle className="w-3 h-3" /> Mark all read
                   </button>
                )}
             </div>
             <div className="divide-y">
                {notifications.length === 0 ? (
                   <div className="p-6 text-center text-sm text-muted-foreground">
                      No notifications yet
                   </div>
                ) : (
                   notifications.map(note => (
                      <div 
                         key={note.id} 
                         className={`p-3 text-sm transition-colors hover:bg-muted/50 \${!note.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                         onClick={() => {
                            if (!note.read) markAsRead(note.id);
                         }}
                      >
                         <p className="font-semibold mb-0.5">{note.title}</p>
                         <p className="text-muted-foreground text-xs">{note.message}</p>
                         <p className="text-[10px] text-muted-foreground/60 mt-2 text-right">
                           {note.createdAt && note.createdAt.toMillis ? new Date(note.createdAt.toMillis()).toLocaleString() : 'Just now'}
                         </p>
                      </div>
                   ))
                )}
             </div>
          </Card>
        </>
      )}
    </div>
  );
}
