import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../services/firebase';
import { collection, doc, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, setDoc, getDocs, where, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { createNotification } from '../utils/notifications';

export function ChatScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const adminChatId = searchParams.get('admin');

  const { currentUser, userData } = useAuth();
  const { language, t } = useLanguage();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [chatRef, setChatRef] = useState<any>(null);
  const [chatData, setChatData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentUser || !userData) return;

    const initializeChat = async () => {
      try {
        const chatId = adminChatId || currentUser.uid;
        const cRef = doc(db, 'chats', chatId);
        const cSnap = await getDoc(cRef);
        
        if (!cSnap.exists()) {
          if (adminChatId) {
             console.error("Admin tried to access non-existent chat");
             setIsInitializing(false);
             return;
          }
          // Find the best support agent (round robin / least assigned)
          const supportQ = query(collection(db, 'users'), where('role', '==', 'support'));
          const supportSnap = await getDocs(supportQ);
          
          let assignedSupportId = 'admin'; // fallback
          let assignedSupportName = 'Support';
          if (!supportSnap.empty) {
            // Sort by lastAssigned (oldest first)
            const agents = supportSnap.docs.map(d => ({ id: d.id, ...d.data() }))
              .sort((a: any, b: any) => (a.lastAssigned?.toMillis?.() || 0) - (b.lastAssigned?.toMillis?.() || 0)) as any[];
            
            assignedSupportId = agents[0].id;
            assignedSupportName = agents[0].name || agents[0].email || 'Support Agent';
            
            // Update the agent's lastAssigned timestamp
            await updateDoc(doc(db, 'users', assignedSupportId), {
              lastAssigned: serverTimestamp()
            });
            
            // Notify the agent
            await createNotification(
              assignedSupportId,
              t('New Live Chat', 'محادثة مباشرة جديدة'),
              t(`${userData.name} started a new chat session.`, `بدأ ${userData.name} محادثة جديدة.`)
            );
          }

          const systemMessageText = t(
            `Chat has been transferred to customer service: ${assignedSupportName}`,
            `تم تحويل المحادثة مع خدمة العملاء: ${assignedSupportName}`
          );

          const newChatData = {
            userId: currentUser.uid,
            userName: userData.name || 'User',
            userPhone: userData.phone || 'N/A',
            userEmail: userData.email || 'N/A',
            supportId: assignedSupportId,
            status: 'active',
            lastMessage: systemMessageText,
            updatedAt: serverTimestamp(),
            unreadAdmin: 1,
            unreadUser: 1
          };
          await setDoc(cRef, newChatData);
          setChatData(newChatData);

          // Add the initial system message
          await addDoc(collection(db, 'chats', chatId, 'messages'), {
            senderId: 'system',
            text: systemMessageText,
            timestamp: serverTimestamp(),
          });
        } else {
          setChatData(cSnap.data());
          // Clear unread messages depending on role
          if (adminChatId && cSnap.data().unreadAdmin > 0) {
             await updateDoc(cRef, { unreadAdmin: 0 });
          } else if (!adminChatId && cSnap.data().unreadUser > 0) {
             await updateDoc(cRef, { unreadUser: 0 });
          }
        }
        
        setChatRef(cRef);
        setIsInitializing(false);

        // Listen to messages
        const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Listen to chat doc to update chatData real-time
        const unsubscribeChat = onSnapshot(cRef, (docSnap) => {
            if (docSnap.exists()) {
                setChatData(docSnap.data());
            }
        });

        return () => { unsubscribe(); unsubscribeChat(); };
      } catch (e) {
        console.error('Error initializing chat:', e);
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [currentUser, userData, adminChatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !chatRef) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    const chatId = adminChatId || currentUser.uid;

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: currentUser.uid,
        text: messageText,
        timestamp: serverTimestamp(),
      });

      const updateData: any = {
        lastMessage: messageText,
        updatedAt: serverTimestamp()
      };
      
      if (adminChatId) {
        updateData.unreadUser = (chatData?.unreadUser || 0) + 1;
        // Notify user about new message from support
        await createNotification(
            chatId,
            t('New Message from Support', 'رسالة جديدة من الدعم'),
            messageText.slice(0, 50) + (messageText.length > 50 ? '...' : '')
        );
      } else {
        updateData.unreadAdmin = (chatData?.unreadAdmin || 0) + 1;
        // Notify assigned support agent
        if (chatData?.supportId && chatData.supportId !== 'admin') {
           await createNotification(
              chatData.supportId,
              t(`New Message from ${chatData.userName}`, `رسالة جديدة من ${chatData.userName}`),
              messageText.slice(0, 50) + (messageText.length > 50 ? '...' : '')
           );
        }
      }

      await updateDoc(chatRef, updateData);
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">{t('Connecting to Support...', 'جاري الاتصال بالدعم...')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-card px-6 pt-12 pb-4 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className={`h-5 w-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {adminChatId ? `${chatData?.userName || 'Customer'}` : t('Live Support', 'الدعم المباشر')}
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </h2>
            {adminChatId ? (
              <div className="flex flex-col gap-0.5 mt-1">
                {chatData?.userPhone && <p className="text-xs text-muted-foreground font-medium">📞 {chatData.userPhone}</p>}
                {chatData?.userEmail && <p className="text-xs text-muted-foreground">✉️ {chatData.userEmail}</p>}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t('We typically reply in a few minutes', 'نرد عادة خلال دقائق معدودة')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p>{t('Send a message to start chatting', 'أرسل رسالة لبدء المحادثة')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.senderId === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <div className="bg-muted/50 border border-border/50 px-4 py-1.5 rounded-full">
                    <p className="text-xs font-bold text-muted-foreground text-center">{msg.text}</p>
                  </div>
                </div>
              );
            }

            const isUser = msg.senderId === currentUser?.uid;
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[9px] mt-1 text-right ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-20">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center max-w-2xl mx-auto w-full">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('Type a message...', 'اكتب رسالة...')}
            className="flex-1 h-12 rounded-xl bg-muted/50 border-none"
          />
          <Button type="submit" disabled={!newMessage.trim()} className="h-12 w-12 rounded-xl rounded-full shrink-0">
            <Send className={`h-5 w-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </Button>
        </form>
      </div>
    </div>
  );
}
