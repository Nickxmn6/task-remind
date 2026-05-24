import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Drive from './pages/Drive'
import RoleManager from './pages/RoleManager'
import AdminPanel from './pages/AdminPanel'
import GlobalComms from './pages/GlobalComms'
import { useEffect, useState } from 'react'

// Premium splash screen
function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 100%)' }}>
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 opacity-30 blur-lg animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl">
            <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full" style={{ borderWidth: 3, animation: 'spin 0.8s linear infinite' }} />
          </div>
        </div>
        <p className="text-white/50 text-sm font-medium tracking-wide">Loading EventHub…</p>
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 100%)' }}>
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
  const { user, loading } = useAuth()
  if (loading) return <SplashScreen />
  
  return (
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