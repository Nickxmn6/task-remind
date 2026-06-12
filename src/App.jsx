import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Suspense, lazy, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './lib/firebase'
import { Settings } from 'lucide-react'

const AuthPage = lazy(() => import('./pages/AuthPage'))
const MainLayout = lazy(() => import('./components/MainLayout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Drive = lazy(() => import('./pages/Drive'))
const RoleManager = lazy(() => import('./pages/RoleManager'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const GlobalComms = lazy(() => import('./pages/GlobalComms'))
const WebinarInfo = lazy(() => import('./pages/WebinarInfo'))

// Premium splash screen
function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-zinc-600 opacity-30 blur-lg animate-pulse" />
          <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-violet-500 to-zinc-700 flex items-center justify-center shadow-xl">
            <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full" style={{ borderWidth: 3, animation: 'spin 0.8s linear infinite' }} />
          </div>
        </div>
        <p className="text-white/50 text-sm font-medium tracking-wide">Loading EventHub…</p>
      </div>
    </div>
  )
}

// Maintenance screen
function MaintenanceScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[var(--surface)]">
      {/* Ambient orbs */}
      <div className="orb orb-purple w-[500px] h-[500px] absolute -top-32 -left-32 opacity-40 pointer-events-none" />
      <div className="orb orb-blue w-[400px] h-[400px] absolute bottom-0 right-0 opacity-30 animate-float pointer-events-none" />

      <div className="glass-card max-w-md w-full p-8 text-center animate-scale-in relative z-10">
        <div className="w-20 h-20 mx-auto rounded-lg bg-gradient-to-br from-zinc-500/20 to-zinc-600/20 border border-zinc-500/30 flex items-center justify-center mb-6 shadow-xl shadow-zinc-500/10">
          <Settings size={36} className="text-zinc-400 animate-[spin_4s_linear_infinite]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">System Maintenance</h1>
        <p className="text-white/60 text-sm leading-relaxed mb-8">
          EventHub is currently undergoing scheduled maintenance to improve your experience. We'll be back shortly!
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
          <span className="text-xs text-white/50 font-medium tracking-widest uppercase">Developer at work</span>
        </div>
      </div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, profile, loading, signOut } = useAuth()
  if (loading) return <SplashScreen />
  if (!user) return <Navigate to="/auth" replace />
  if (profile?.status === 'banned' || profile?.status === 'timeout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]">
        <div className="glass-card p-8 text-center max-w-sm w-full mx-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/60 text-sm mb-6">
            Your account has been {profile.status}. Please contact the administrator.
          </p>
          <button onClick={() => signOut()} className="btn-primary w-full py-2">Sign Out</button>
        </div>
      </div>
    )
  }
  return children
}

function DevRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <SplashScreen />
  if (!user) return <Navigate to="/auth" replace />
  if (profile?.role !== 'dev') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  const [maintenance, setMaintenance] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'app'), 
      (docSnap) => {
        if (docSnap.exists()) {
          setMaintenance(docSnap.data().maintenanceMode || false)
        }
        setSettingsLoading(false)
      },
      (error) => {
        console.error('Error fetching settings:', error)
        setSettingsLoading(false)
      }
    )
    return () => unsub()
  }, [])

  if (loading || settingsLoading) return <SplashScreen />

  const isAuthPage = window.location.pathname === '/auth'
  if (maintenance && profile?.role !== 'dev' && !isAuthPage) {
    return <MaintenanceScreen />
  }

  return (
    <Suspense fallback={<SplashScreen />}>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="drive" element={<Drive />} />
          <Route path="comms" element={<GlobalComms />} />
          <Route path="webinar" element={<WebinarInfo />} />
          <Route path="roles" element={
            <DevRoute>
              <RoleManager />
            </DevRoute>
          } />
          <Route path="admin" element={
            <DevRoute>
              <AdminPanel />
            </DevRoute>
          } />
        </Route>
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App