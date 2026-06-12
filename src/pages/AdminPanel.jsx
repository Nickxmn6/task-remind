import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot, getDocs, where, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Megaphone, Save, Loader, Activity, ShieldAlert, CheckCircle, XCircle, Settings, Power, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ToastNotification from '../components/ToastNotification';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('welcome');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [swipeValue, setSwipeValue] = useState(0);
  const { toast, showToast, setToast } = useToast();
  const [deletingChats, setDeletingChats] = useState(false);

  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'security') {
      const q = query(collection(db, 'security_logs'), orderBy('timestamp', 'desc'), limit(50));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const logsList = [];
        querySnapshot.forEach((doc) => {
          logsList.push({ id: doc.id, ...doc.data() });
        });
        setLogs(logsList);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'app'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.welcomeTitle || '');
        setMessage(data.welcomeMessage || '');
        setVersion(data.notifVersion || 0);
        setMaintenanceMode(data.maintenanceMode || false);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newVersion = version + 1;
      await setDoc(doc(db, 'settings', 'app'), {
        welcomeTitle: title,
        welcomeMessage: message,
        notifVersion: newVersion
      }, { merge: true });
      setVersion(newVersion);
      showToast('Welcome Notification berhasil diperbarui!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Gagal menyimpan pengaturan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleMaintenance = async () => {
    setSavingMaintenance(true);
    try {
      const newState = !maintenanceMode;
      await setDoc(doc(db, 'settings', 'app'), { maintenanceMode: newState }, { merge: true });
      setMaintenanceMode(newState);
      showToast(newState ? 'Maintenance Mode AKTIF' : 'Maintenance Mode NONAKTIF', 'success');
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      showToast('Gagal mengubah mode maintenance.', 'error');
    } finally {
      setSavingMaintenance(false);
    }
  };

  useEffect(() => {
    setSwipeValue(maintenanceMode ? 100 : 0);
  }, [maintenanceMode]);

  const handleSwipeEnd = async (e) => {
    if (savingMaintenance) return;
    const val = parseInt(e.target.value);
    
    if (maintenanceMode && val < 50) {
      await toggleMaintenance();
    } else if (!maintenanceMode && val > 50) {
      await toggleMaintenance();
    } else {
      setSwipeValue(maintenanceMode ? 100 : 0);
    }
  };

  const handleDeleteTargetChats = async () => {
    if (!window.confirm('Yakin ingin mengosongkan seluruh Global Chat? Tindakan ini akan menghapus chat dari semua pengguna dan tidak dapat dibatalkan.')) return;
    
    setDeletingChats(true);
    try {
      const q = query(collection(db, 'global_chats'));
      const snapshot = await getDocs(q);
      
      let count = 0;
      const deletePromises = [];
      snapshot.forEach((docSnap) => {
        deletePromises.push(deleteDoc(docSnap.ref));
        count++;
      });
      
      await Promise.all(deletePromises);
      showToast(`Berhasil menghapus seluruh ${count} pesan di Global Chat`, 'success');
    } catch (error) {
      console.error('Error deleting chats:', error);
      showToast('Gagal menghapus pesan.', 'error');
    } finally {
      setDeletingChats(false);
    }
  };

  const getLogIcon = (action) => {
    if (action.includes('FAILED') || action.includes('BANNED')) return <XCircle size={16} className="text-red-400" />;
    if (action.includes('SUCCESS') || action.includes('SIGN_IN') || action.includes('SIGN_UP')) return <CheckCircle size={16} className="text-green-400" />;
    return <ShieldAlert size={16} className="text-orange-400" />;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + date.toLocaleDateString('id-ID');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader className="animate-spin text-white/50" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl relative">
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Panel</h1>
          <p className="text-white/50 mt-1">Pusat kendali dan keamanan EventHub.</p>
        </div>
        
        {/* TABS */}
        <div className="flex items-center p-1 bg-black/20 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('welcome')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'welcome' ? 'bg-white/10 text-white shadow' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Megaphone size={16} />
            Pengumuman
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'security' ? 'bg-red-500/20 text-red-200 border border-red-500/30 shadow' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Activity size={16} />
            Live Monitor
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'system' ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30 shadow' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Settings size={16} />
            System
          </button>
        </div>
      </header>

      {activeTab === 'welcome' && (
        <div className="glass rounded-lg p-6 md:p-8 animate-fadeIn">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            Welcome Notification
          </h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Judul Notifikasi</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl focus:ring-zinc-500 focus:border-zinc-500 block p-3 transition"
                placeholder="Contoh: Pembaruan Sistem EventHub v2.0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Pesan / Pengumuman</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="6"
                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl focus:ring-zinc-500 focus:border-zinc-500 block p-3 transition resize-none"
                placeholder="Tulis pesan pengumuman di sini..."
                required
              ></textarea>
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-white/40">Versi saat ini: {version}</p>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Menyimpan...' : 'Simpan & Publikasikan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="glass rounded-lg p-6 md:p-8 animate-fadeIn space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Maintenance Mode
              </h2>
              <p className="text-white/50 text-sm mt-1">
                Mengaktifkan mode ini akan menutup akses aplikasi dari semua user, kecuali user dengan role Developer.
              </p>
            </div>
            
            <div className="relative w-48 h-12 bg-black/40 border border-white/10 rounded-full shadow-inner flex-shrink-0 group overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
                style={{ width: `${maintenanceMode ? 100 : swipeValue}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className={`text-[10px] font-bold tracking-widest pl-6 ${maintenanceMode ? 'text-white' : 'text-white/40'} transition-colors duration-300`}>
                   {maintenanceMode ? 'MAINTENANCE ON' : 'SWIPE TO LOCK'}
                 </span>
              </div>
              <input 
                type="range"
                min="0" max="100"
                value={swipeValue}
                onChange={(e) => setSwipeValue(e.target.value)}
                onMouseUp={handleSwipeEnd}
                onTouchEnd={handleSwipeEnd}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                disabled={savingMaintenance}
              />
              <div 
                className="absolute top-1 left-1 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-75 pointer-events-none z-10"
                style={{ transform: `translateX(${(swipeValue / 100) * 144}px)` }}
              >
                {savingMaintenance ? <Loader size={16} className="animate-spin text-black" /> : <Power size={16} className={maintenanceMode ? 'text-orange-500' : 'text-black'} />}
              </div>
            </div>
          </div>
          
          {maintenanceMode && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
              <ShieldAlert className="text-orange-400 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-orange-200 font-semibold text-sm">Peringatan: Sistem Sedang Maintenance!</p>
                <p className="text-orange-200/70 text-xs mt-1 leading-relaxed">
                  Semua pengguna reguler yang mencoba mengakses aplikasi saat ini akan dialihkan ke layar Maintenance. Hanya Anda (Developer) yang dapat melihat halaman aplikasi. Jangan lupa matikan kembali setelah perbaikan selesai.
                </p>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trash2 size={18} className="text-red-400" />
                  Kosongkan Global Chat
                </h2>
                <p className="text-white/50 text-sm mt-1">
                  Hapus <strong>semua</strong> chat dari semua pengguna secara permanen.
                </p>
              </div>
              <button
                onClick={handleDeleteTargetChats}
                disabled={deletingChats}
                className="px-4 py-2 bg-red-500/20 text-red-200 border border-red-500/50 hover:bg-red-500/30 rounded-lg transition flex items-center gap-2 flex-shrink-0"
              >
                {deletingChats ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
                {deletingChats ? 'Menghapus...' : 'Hapus Semua'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="glass rounded-lg overflow-hidden border border-white/5 animate-fadeIn">
          <div className="p-4 md:p-6 border-b border-white/5 bg-red-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-red-200 flex items-center gap-2">
                <Activity size={20} className="animate-pulse" />
                Live Security Monitor
              </h2>
              <p className="text-red-200/50 text-xs mt-1">Memantau aktivitas login dan perubahan role secara real-time (50 log terakhir).</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Sistem Aktif
            </div>
          </div>
          
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full text-left border-collapse text-sm min-w-[600px]">
              <thead>
                <tr className="bg-black/20 text-white/40">
                  <th className="py-3 px-4 font-medium">Waktu</th>
                  <th className="py-3 px-4 font-medium">Tindakan</th>
                  <th className="py-3 px-4 font-medium">Email / ID Pengguna</th>
                  <th className="py-3 px-4 font-medium">Detail Ekstra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 text-white/60 whitespace-nowrap">
                      {formatDate(log.isoTime)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getLogIcon(log.action)}
                        <span className={`font-medium tracking-wide text-xs ${
                          log.action.includes('FAILED') ? 'text-red-300' : 'text-white/90'
                        }`}>
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white/80">{log.email}</span>
                      <span className="block text-white/30 text-[10px] mt-0.5">{log.userId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white/50 text-[10px] font-mono bg-black/30 p-2 rounded-lg max-w-xs overflow-x-auto">
                        {log.details ? JSON.stringify(log.details) : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <ShieldAlert size={40} className="text-white/10 mb-3" />
                <p className="text-white/40">Belum ada log keamanan yang tercatat.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
