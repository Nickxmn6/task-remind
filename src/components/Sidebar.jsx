import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Calendar, Home, LogOut, Settings, X, Menu, HardDrive, Shield, Megaphone, Terminal, Radio } from 'lucide-react'
import { useState, useEffect } from 'react'
import SettingsModal from './SettingsModal'
import NotificationsDropdown from './NotificationsDropdown'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const hh = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const ss = time.toLocaleTimeString('id-ID', { second: '2-digit' })
  const date = time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="p-5 border-b border-white/10">
      <div className="flex items-end gap-1.5">
        <span className="text-4xl font-bold text-white tracking-tight">{hh}</span>
        <span className="text-lg font-light text-white/40 mb-0.5">:{ss}</span>
      </div>
      <p className="text-white/40 text-xs mt-1">{date}</p>
    </div>
  )
}

// Isi sidebar — digunakan di desktop sidebar & mobile drawer
function SidebarInner({ profile, onNavClick, onOpenSettings, onSignOut }) {
  const initials = profile?.username?.[0]?.toUpperCase() ?? 'U'
  const [hasNewWebinar, setHasNewWebinar] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'webinars'), orderBy('createdAt', 'desc'), limit(1))
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latestPost = snapshot.docs[0].data()
        const latestTime = latestPost.createdAt?.toMillis?.() || Date.now()
        const lastVisit = parseInt(localStorage.getItem('last_webinar_visit') || '0', 10)
        
        // If post is newer than last visit, and we are not currently on the page
        if (latestTime > lastVisit && window.location.pathname !== '/webinar') {
          setHasNewWebinar(true)
        }
      }
    })
    return () => unsub()
  }, [])

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Orb dekorasi */}
      <div className="absolute top-10 left-6 w-32 h-32 orb orb-purple opacity-60 pointer-events-none" />
      <div className="absolute bottom-20 right-4 w-24 h-24 orb orb-blue opacity-40 pointer-events-none" />

      {/* Clock - hanya desktop */}
      <div className="hidden md:block">
        <LiveClock />
      </div>

      {/* User card */}
      <div className="px-4 pt-4">
        <div className="glass rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-zinc-500/5 pointer-events-none" />
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-zinc-600 flex items-center justify-center text-white font-bold text-base shadow-lg flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{profile?.username ?? 'User'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-emerald-400/80 text-xs">Online</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <NotificationsDropdown userId={profile?.id} />
            <button
              onClick={onOpenSettings}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1.5 mt-2">
        <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Menu</p>
        <NavLink
          to="/"
          end
          onClick={onNavClick}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Home size={18} />
          <span className="text-sm font-medium">Dashboard</span>
        </NavLink>
        <NavLink
          to="/schedule"
          onClick={onNavClick}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Calendar size={18} />
          <span className="text-sm font-medium">Schedule</span>
        </NavLink>
        <NavLink
          to="/drive"
          onClick={onNavClick}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <HardDrive size={18} />
          <span className="text-sm font-medium">Drive</span>
        </NavLink>
        <NavLink
          to="/comms"
          onClick={onNavClick}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Terminal size={18} />
          <span className="text-sm font-medium">Chat</span>
        </NavLink>
        <NavLink
          to="/webinar"
          onClick={() => {
            if (onNavClick) onNavClick();
            localStorage.setItem('last_webinar_visit', Date.now().toString());
            setHasNewWebinar(false);
          }}
          className={({ isActive }) => `nav-link relative ${isActive ? 'active' : ''}`}
        >
          <Radio size={18} />
          <span className="text-sm font-medium">Webinar Info</span>
          {hasNewWebinar && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center h-5 px-1.5 bg-pink-500 rounded text-[9px] font-bold text-white shadow-lg shadow-pink-500/20 animate-pulse">
              NEW
            </div>
          )}
        </NavLink>
        {profile?.role === 'dev' && (
          <>
            <NavLink
              to="/roles"
              onClick={onNavClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Shield size={18} />
              <span className="text-sm font-medium">Role Manager</span>
            </NavLink>
            <NavLink
              to="/admin"
              onClick={onNavClick}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Megaphone size={18} />
              <span className="text-sm font-medium">Admin Panel</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          onClick={onSignOut}
          className="nav-link w-full text-left text-red-400/70 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={17} />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Tutup drawer saat resize ke desktop
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 768) setDrawerOpen(false) }
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Lock body scroll saat drawer terbuka
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const handleSignOut = async () => {
    setDrawerOpen(false)
    await signOut()
  }

  return (
    <>
      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[17rem] flex-col" style={{ zIndex: 40 }}>
        <div className="m-3 flex-1 glass flex flex-col rounded-lg overflow-hidden">
          <SidebarInner
            profile={profile}
            onOpenSettings={() => setShowSettings(true)}
            onSignOut={handleSignOut}
          />
        </div>
      </aside>

      {/* ═══ MOBILE TOP NAVBAR ═══ */}
      <header className="md:hidden fixed top-0 left-0 right-0" style={{ zIndex: 40 }}>
        <div className="glass mx-3 mt-3 rounded-lg px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 hover:bg-white/15 text-white/70 hover:text-white transition"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-zinc-600 flex items-center justify-center">
              <Calendar size={14} className="text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">EventHub</span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-zinc-600 flex items-center justify-center text-white font-bold text-sm shadow">
            {profile?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
        </div>
      </header>

      {/* ═══ MOBILE DRAWER ═══ */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 flex" style={{ zIndex: 50, animation: 'fadeIn 0.2s ease' }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panel */}
          <div
            className="relative w-72 max-w-[85vw] h-full glass flex flex-col rounded-r-3xl overflow-hidden shadow-2xl"
            style={{ animation: 'slideInLeft 0.3s cubic-bezier(0.4,0,0.2,1)' }}
          >
            {/* Close button */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <span className="text-white font-bold">EventHub</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white/60 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <SidebarInner
              profile={profile}
              onNavClick={() => setDrawerOpen(false)}
              onOpenSettings={() => { setShowSettings(true); setDrawerOpen(false) }}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      )}

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}