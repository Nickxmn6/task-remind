import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { X, Upload, LogOut, User } from 'lucide-react'

export default function SettingsModal({ isOpen, onClose }) {
  const { profile, updateProfile, signOut } = useAuth()
  const [username, setUsername] = useState(profile?.username || '')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    await updateProfile({ username })
    setLoading(false)
    onClose()
  }

  const handleSignOut = async () => {
    onClose()
    await signOut()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 60, animation: 'fadeIn 0.2s ease' }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
        onClick={!loading ? onClose : undefined}
      />

      <div className="relative glass-card w-full max-w-sm animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-5">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 glass rounded-full flex items-center justify-center">
                <User size={14} className="text-white/60" />
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input"
              placeholder="Your username"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>

          <hr className="border-white/10" />

          {/* Logout — tombol terpisah, type button supaya tidak submit form */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition text-sm font-medium disabled:opacity-40"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}