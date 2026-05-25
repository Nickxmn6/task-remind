import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export default function NotificationsDropdown({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [userId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notifId) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const notif of unread) {
      markAsRead(notif.id);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition relative"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[var(--surface)] animate-pulse" />
        )}
      </button>

      {isOpen && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
          style={{ animation: 'fadeIn 0.2s ease' }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative glass-card w-full max-w-md max-h-[80vh] flex flex-col animate-scale-in shadow-2xl border border-white/10 bg-zinc-900/90">
            <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center bg-black/40 rounded-t-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell size={18} /> Notifikasi
              </h3>
              <div className="flex items-center gap-4">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-medium"
                  >
                    <Check size={14} /> Tandai dibaca
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-3 scrollbar-thin scrollbar-thumb-white/10">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-white/30 text-sm">
                  Tidak ada notifikasi baru.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 rounded-xl border mb-2 transition-colors cursor-pointer flex gap-3 ${!notif.read ? 'bg-blue-500/10 border-blue-500/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg mt-0.5">
                      {notif.fromUsername?.[0]?.toUpperCase() || '@'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] leading-snug break-words ${!notif.read ? 'text-white font-semibold' : 'text-white/80'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] text-blue-300 uppercase tracking-widest font-bold bg-blue-500/20 px-2 py-0.5 rounded-md">
                          {notif.source}
                        </span>
                        <span className="text-xs text-white/40">
                          {notif.timestamp?.toDate ? formatDistanceToNow(notif.timestamp.toDate(), { addSuffix: true, locale: id }) : 'Baru saja'}
                        </span>
                      </div>
                    </div>
                    {!notif.read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0 mt-2 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
