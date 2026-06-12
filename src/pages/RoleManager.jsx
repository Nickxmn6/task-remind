import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, User, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logSecurityEvent } from '../lib/securityLogger';

function Toggle({ checked, onChange, disabled, colorClass }) {
  return (
    <label className={`relative inline-flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input type="checkbox" className="sr-only peer" checked={checked || false} onChange={onChange} disabled={disabled} />
      <div className={`w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${colorClass}`}></div>
    </label>
  );
}

export default function RoleManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const { profile } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'profiles'));
      const usersList = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setSaving(userId);
    try {
      await updateDoc(doc(db, 'profiles', userId), {
        role: newRole
      });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      const targetUser = users.find(u => u.id === userId);
      logSecurityEvent('ROLE_CHANGED', profile.id, profile.email, { targetUserId: userId, targetUserEmail: targetUser?.email, newRole });
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Gagal mengubah role. Pastikan Anda memiliki akses.');
    } finally {
      setSaving(null);
    }
  };

  const handleStatusChange = async (userId, type, isChecked) => {
    setSaving(userId);
    let newStatus = 'active';
    if (isChecked) newStatus = type;

    try {
      await updateDoc(doc(db, 'profiles', userId), {
        status: newStatus
      });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      const targetUser = users.find(u => u.id === userId);
      logSecurityEvent('STATUS_CHANGED', profile.id, profile.email, { targetUserId: userId, targetUserEmail: targetUser?.email, newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal mengubah status.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader className="animate-spin text-white/50" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Role Manager</h1>
          <p className="text-white/50 mt-1 text-sm md:text-base">Atur akses dan status pengguna.</p>
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-lg bg-gradient-to-br from-zinc-500 to-zinc-600 flex items-center justify-center shadow-lg">
          <Shield className="text-white w-5 h-5 md:w-6 md:h-6" />
        </div>
      </header>

      {/* MOBILE VIEW (Cards) */}
      <div className="md:hidden space-y-4">
        {users.map((u) => {
          const isMe = u.id === profile?.id;
          const isBanned = u.status === 'banned';
          const isTimeout = u.status === 'timeout';

          return (
            <div key={u.id} className={`glass-card p-4 rounded-lg border border-white/5 ${isBanned ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${isBanned ? 'bg-red-500/50' : 'bg-gradient-to-br from-violet-500 to-zinc-600'
                    }`}>
                    {u.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <span className="text-white font-semibold block leading-tight">{u.username || 'User'}</span>
                    <span className="text-white/40 text-xs block mt-0.5 max-w-[150px] truncate">{u.email || '-'}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.role === 'dev'
                    ? 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
                    : 'bg-white/10 text-white/70 border border-white/10'
                  }`}>
                  {u.role === 'dev' ? 'DEV' : 'USER'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/20 rounded-xl p-3 flex flex-col items-center justify-center">
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">Ban</span>
                  <Toggle checked={isBanned} onChange={(e) => handleStatusChange(u.id, 'banned', e.target.checked)} disabled={saving === u.id || isMe} colorClass="peer-checked:bg-red-500" />
                </div>
                <div className="bg-black/20 rounded-xl p-3 flex flex-col items-center justify-center">
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">Timeout</span>
                  <Toggle checked={isTimeout} onChange={(e) => handleStatusChange(u.id, 'timeout', e.target.checked)} disabled={saving === u.id || isMe || isBanned} colorClass="peer-checked:bg-orange-500" />
                </div>
              </div>

              <div>
                <select
                  value={u.role || 'user'}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  disabled={saving === u.id || isMe}
                  className="bg-white/5 border border-white/10 text-white text-sm rounded-xl focus:ring-zinc-500 focus:border-zinc-500 block w-full p-3 disabled:opacity-50 appearance-none text-center cursor-pointer hover:bg-white/10 transition"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="user">Role: User</option>
                  <option value="dev">Role: Dev</option>
                </select>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="p-8 text-center text-white/50 glass rounded-lg">
            Belum ada pengguna terdaftar.
          </div>
        )}
      </div>

      {/* DESKTOP VIEW (Table) */}
      <div className="hidden md:block glass rounded-lg overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="py-4 px-6 text-white/50 font-medium text-sm">Pengguna</th>
                <th className="py-4 px-6 text-white/50 font-medium text-sm">Role Saat Ini</th>
                <th className="py-4 px-6 text-white/50 font-medium text-sm text-center">Ban</th>
                <th className="py-4 px-6 text-white/50 font-medium text-sm text-center">Timeout</th>
                <th className="py-4 px-6 text-white/50 font-medium text-sm text-right">Aksi Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u.id === profile?.id;
                const isBanned = u.status === 'banned';
                const isTimeout = u.status === 'timeout';

                return (
                  <tr key={u.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition ${isBanned ? 'opacity-60' : ''}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${isBanned ? 'bg-red-500/50' : 'bg-gradient-to-br from-violet-500 to-zinc-600'
                          }`}>
                          {u.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <span className="text-white font-medium block">{u.username || 'User'}</span>
                          <span className="text-white/40 text-xs block">{u.email || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${u.role === 'dev'
                          ? 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
                          : 'bg-white/10 text-white/70 border border-white/10'
                        }`}>
                        {u.role === 'dev' ? <Shield size={12} className="mr-1.5" /> : <User size={12} className="mr-1.5" />}
                        {u.role === 'dev' ? 'Dev' : 'User'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Toggle
                          checked={isBanned}
                          onChange={(e) => handleStatusChange(u.id, 'banned', e.target.checked)}
                          disabled={saving === u.id || isMe}
                          colorClass="peer-checked:bg-red-500"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Toggle
                          checked={isTimeout}
                          onChange={(e) => handleStatusChange(u.id, 'timeout', e.target.checked)}
                          disabled={saving === u.id || isMe || isBanned}
                          colorClass="peer-checked:bg-orange-500"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end">
                        <select
                          value={u.role || 'user'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={saving === u.id || isMe}
                          className="bg-black/20 border border-white/10 text-white text-sm rounded-lg focus:ring-zinc-500 focus:border-zinc-500 block w-28 p-2.5 disabled:opacity-50 appearance-none text-center cursor-pointer hover:bg-white/10 transition"
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="user">User</option>
                          <option value="dev">Dev</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-8 text-center text-white/50">
              Belum ada pengguna terdaftar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
