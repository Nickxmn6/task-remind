import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useDrive } from '../hooks/useDrive';
import { Send, Image as ImageIcon, Paperclip, X, File, Loader, Terminal, Trash2 } from 'lucide-react';
import ToastNotification from '../components/ToastNotification';
import { useToast } from '../hooks/useToast';

export default function GlobalComms() {
  const { profile } = useAuth();
  const { toast, showToast, setToast } = useToast();
  const { startUpload, downloadFile, activeUploads } = useDrive();
  
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  
  // Image Preview State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  // Removed Audio State
  
  const messagesEndRef = useRef(null);

  // Auto Scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch Messages Real-time
  useEffect(() => {
    const q = query(collection(db, 'global_chats'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs.reverse());
    });
    return () => unsubscribe();
  }, []);

  // Text Message
  const sendTextMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = text;
    setText('');
    try {
      await addDoc(collection(db, 'global_chats'), {
        type: 'text',
        content: msg,
        userId: profile?.id || 'unknown',
        username: profile?.username || 'User',
        email: profile?.email || '',
        role: profile?.role || 'user',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      showToast('Gagal mengirim pesan.', 'error');
    }
  };

  // Image Compress
  const compressImage = (base64Str, maxWidth = 1000) => {
    return new Promise((resolve) => {
      let img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let canvas = document.createElement('canvas');
        let ratio = maxWidth / img.width;
        let width = img.width > maxWidth ? maxWidth : img.width;
        let height = img.width > maxWidth ? img.height * ratio : img.height;
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendImageMessage = async () => {
    if (!selectedImage) return;
    const compressed = await compressImage(selectedImage);
    const caption = imageCaption;
    setSelectedImage(null);
    setImageCaption('');
    try {
      await addDoc(collection(db, 'global_chats'), {
        type: 'image',
        content: compressed,
        caption: caption,
        userId: profile?.id || 'unknown',
        username: profile?.username || 'User',
        email: profile?.email || '',
        role: profile?.role || 'user',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      showToast('Gagal mengirim gambar.', 'error');
    }
  };

  // Removed Audio Recording Logic

  // File Upload
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Simulate finding active upload to show progress in UI if needed, but startUpload runs async
    const res = await startUpload(file);
    if (res && res.success) {
      const fileId = res.data.id;
      await addDoc(collection(db, 'global_chats'), {
        type: 'file',
        fileId: fileId,
        fileName: file.name,
        fileSize: file.size,
        userId: profile?.id || 'unknown',
        username: profile?.username || 'User',
        email: profile?.email || '',
        role: profile?.role || 'user',
        timestamp: serverTimestamp()
      });
      showToast('Dokumen terkirim!', 'success');
    } else {
      showToast('Gagal upload dokumen.', 'error');
    }
  };
  
  const handleDownload = async (fileId, fileName) => {
     showToast('Mendownload file...', 'success');
     await downloadFile({ id: fileId, name: fileName });
  };

  const handleDeleteMessage = async (id) => {
    if (profile?.role !== 'dev') return;
    if (window.confirm('Hapus pesan ini secara permanen?')) {
      await deleteDoc(doc(db, 'global_chats', id));
      showToast('Pesan dihapus.', 'success');
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const d = time.toDate ? time.toDate() : new Date(time);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Removed formatSeconds

  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] max-w-4xl mx-auto relative z-10 animate-fadeIn">
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* HEADER */}
      <header className="glass rounded-t-2xl p-4 flex items-center justify-between border-b border-white/5 shadow-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
            <Terminal className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-green-400 tracking-tight flex items-center gap-2">
              CHAT
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </h1>
            <p className="text-white/40 text-xs font-mono">End-to-End Encryption Enabled</p>
          </div>
        </div>
      </header>

      {/* CHAT AREA */}
      <div className="flex-1 glass bg-black/40 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/30">
            <Terminal size={48} className="mb-4 opacity-20" />
            <p className="font-mono text-sm">INITIALIZING SECURE CHANNEL...</p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.userId === profile?.id;
          const isDev = msg.role === 'dev';
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
              <div className="flex items-end gap-2 max-w-[85%] md:max-w-[70%]">
                
                {/* Delete button (Dev only) */}
                {profile?.role === 'dev' && isMe && (
                  <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition mb-2">
                    <Trash2 size={14} />
                  </button>
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Info */}
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className={`text-xs font-bold ${isDev ? 'text-purple-400' : 'text-green-400'}`}>
                        {msg.username}
                      </span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`relative p-3 rounded-2xl shadow-xl border ${
                    isMe 
                      ? 'bg-green-500/10 border-green-500/20 rounded-br-sm' 
                      : 'bg-white/5 border-white/10 rounded-bl-sm'
                  }`}>
                    {/* TEXT */}
                    {msg.type === 'text' && (
                      <p className="text-white/90 text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                    
                    {/* IMAGE */}
                    {msg.type === 'image' && (
                      <div className="space-y-2">
                        <img src={msg.content} alt="Upload" className="rounded-xl max-h-64 object-cover" />
                        {msg.caption && <p className="text-white/90 text-sm whitespace-pre-wrap">{msg.caption}</p>}
                      </div>
                    )}
                    
                    {/* Removed AUDIO */}
                    
                    {/* FILE */}
                    {msg.type === 'file' && (
                      <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl hover:bg-black/40 transition cursor-pointer" onClick={() => handleDownload(msg.fileId, msg.fileName)}>
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                          <File size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white/90 truncate max-w-[150px] md:max-w-[200px]">{msg.fileName}</p>
                          <p className="text-xs text-white/40">{(msg.fileSize / 1024).toFixed(1)} KB • Klik untuk unduh</p>
                        </div>
                      </div>
                    )}

                    <span className="text-[10px] text-white/30 font-mono mt-1.5 block text-right">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Delete button (Dev only - left side for others' messages) */}
                {profile?.role === 'dev' && !isMe && (
                  <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition mb-2">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="glass rounded-b-2xl p-4 border-t border-white/5 z-20">
        <form onSubmit={sendTextMessage} className="flex items-end gap-2">
          
          {/* Attachments */}
          <div className="flex gap-1 mb-1">
            <button type="button" onClick={() => imageInputRef.current?.click()} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition">
              <ImageIcon size={18} />
            </button>
            <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleImageSelect} />
            
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition">
              <Paperclip size={18} />
            </button>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          </div>
          
          {/* Text Input */}
          <div className="flex-1 bg-black/20 border border-white/10 rounded-2xl flex items-center px-4 overflow-hidden relative">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ketik pesan..."
              className="w-full py-3 bg-transparent border-none focus:outline-none text-white text-sm font-mono placeholder:text-white/20"
            />
          </div>
          
          {/* Send Button */}
          <div className="mb-0.5">
            <button type="submit" className={`w-11 h-11 rounded-xl flex items-center justify-center transition shadow-lg ${text.trim() ? 'bg-green-500 hover:bg-green-400 text-black shadow-green-500/20' : 'bg-white/10 text-white/30'}`}>
              <Send size={18} className="ml-0.5" />
            </button>
          </div>
        </form>
      </div>

      {/* ACTIVE UPLOADS INDICATOR (From Drive) */}
      {activeUploads?.length > 0 && (
        <div className="absolute top-20 right-4 glass-card p-3 shadow-2xl z-50 animate-fadeIn">
          <p className="text-xs text-white/50 mb-2 flex items-center gap-2">
            <Loader size={12} className="animate-spin" /> Uploading {activeUploads.length} file(s)...
          </p>
          {activeUploads.map(up => (
            <div key={up.id} className="w-32 h-1 bg-white/10 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${up.progress}%` }}></div>
            </div>
          ))}
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="max-w-2xl w-full flex flex-col items-center">
            <div className="w-full flex justify-end mb-4">
              <button onClick={() => setSelectedImage(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="glass p-2 rounded-2xl shadow-2xl mb-6 max-h-[60vh] overflow-hidden">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-contain rounded-xl max-h-[58vh]" />
            </div>
            
            <div className="w-full flex gap-3">
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Tambahkan keterangan (opsional)..."
                className="flex-1 glass-input rounded-2xl py-4 px-6 text-white"
                autoFocus
                onKeyDown={(e) => { if(e.key === 'Enter') sendImageMessage() }}
              />
              <button onClick={sendImageMessage} className="w-14 h-14 bg-green-500 hover:bg-green-400 text-black rounded-2xl flex items-center justify-center transition shadow-xl shadow-green-500/20">
                <Send size={20} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Removed Audio Styles */}
    </div>
  );
}
