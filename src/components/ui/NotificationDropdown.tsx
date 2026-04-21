import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Bell, CheckCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface NotificationDropdownProps {
  iconClassName?: string;
}

export function NotificationDropdown({ iconClassName = 'text-foreground' }: NotificationDropdownProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
      setNotifications(notes);
    }, (error) => {
      console.error('Notification listener error:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const markAllAsRead = () => {
    notifications.filter(n => !n.read).forEach(n => markAsRead(n.id));
  };

  if (!currentUser) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-muted/50 hover:bg-primary/10 transition-all active:scale-95 focus:outline-none border border-primary/5 shadow-inner"
          aria-label="Notifications"
        >
          <Bell className={`h-5 w-5 ${iconClassName}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center border-2 border-card shadow-lg animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 p-0 max-h-[480px] overflow-y-auto z-50 rounded-[2rem] border-primary/10 shadow-2xl backdrop-blur-2xl bg-card/95">
        <div className="flex justify-between items-center p-5 border-b border-primary/5 bg-primary/5 sticky top-0 z-10 backdrop-blur-md">
          <h3 className="font-bold text-base tracking-tight text-primary">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] text-primary hover:bg-primary/10 px-3 py-1.5 rounded-full font-black uppercase tracking-widest transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="divide-y divide-primary/5">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground italic">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
              No notifications yet
            </div>
          ) : (
            notifications.map(note => (
              <div
                key={note.id}
                className={`p-5 text-sm transition-all cursor-pointer hover:bg-primary/5 relative ${!note.read ? 'bg-primary/[0.02]' : 'opacity-70'}`}
                onClick={() => { 
                  if (!note.read) markAsRead(note.id); 
                  const lowerTitle = (note.title || '').toLowerCase();
                  if (lowerTitle.includes('booking')) navigate('/profile?tab=bookings');
                  else if (lowerTitle.includes('ticket') || lowerTitle.includes('support')) navigate('/profile?tab=support');
                }}
              >
                {!note.read && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(201,169,110,0.8)]" />
                )}
                <p className={`font-bold mb-1 leading-tight ${!note.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {note.title}
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{note.message}</p>
                <p className="text-[9px] text-muted-foreground/40 mt-3 font-medium uppercase tracking-tighter">
                  {note.createdAt && note.createdAt.toMillis
                    ? new Date(note.createdAt.toMillis()).toLocaleString()
                    : 'Just now'}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
