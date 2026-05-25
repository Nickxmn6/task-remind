import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Megaphone, X } from 'lucide-react';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifData, setNotifData] = useState(null);
  const { profile, updateProfile } = useAuth();

  useEffect(() => {
    if (!profile) return;
    
    const checkNotif = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'app'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const userSeenVersion = profile.lastSeenNotif || 0;
          
          if (data.notifVersion && data.notifVersion > userSeenVersion) {
            setNotifData(data);
            setIsOpen(true);
          }
        }
      } catch (error) {
        console.error('Error fetching global notif:', error);
      }
    };
    
    checkNotif();
  }, [profile]);

  const handleClose = async () => {
    setIsOpen(false);
    if (notifData?.notifVersion) {
      await updateProfile({ lastSeenNotif: notifData.notifVersion });
    }
  };

  if (!isOpen || !notifData) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleClose} />
      
      <div 
        className="relative w-[90vw] max-w-md glass rounded-xl overflow-hidden shadow-2xl p-8"
        style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-zinc-500/20 to-transparent pointer-events-none rounded-bl-full" />
        
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition"
        >
          <X size={18} />
        </button>

        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-zinc-500 to-zinc-600 flex items-center justify-center shadow-xl mb-6">
          <Megaphone className="text-white" size={28} />
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight mb-3">
          {notifData.welcomeTitle || 'Pengumuman Baru'}
        </h2>
        
        <div className="text-white/70 text-sm leading-relaxed mb-8 whitespace-pre-wrap">
          {notifData.welcomeMessage || 'Ada pembaruan sistem yang perlu Anda ketahui.'}
        </div>

        <button
          onClick={handleClose}
          className="w-full btn-primary py-3 text-base font-semibold"
        >
          Saya Mengerti
        </button>
      </div>
    </div>
  );
}
