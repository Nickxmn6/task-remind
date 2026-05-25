import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Calendar, Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react'
import ToastNotification from '../components/ToastNotification'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  
  const { signIn, signUp } = useAuth()

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4300)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isLogin) {
        // LOGIN
        console.log('Attempting login with:', email)
        const result = await signIn(email, password)
        console.log('Login result:', result)
        
        if (result.error) {
          let errorMessage = 'Login gagal. Periksa kembali koneksi atau data Anda.'
          if (result.error.message.includes('Invalid login credentials') || result.error.message.includes('invalid-credential')) {
            errorMessage = 'Email atau password salah!'
          } else if (result.error.message.includes('Email not confirmed')) {
            errorMessage = 'Email belum dikonfirmasi. Cek email Anda.'
          }
          showToast(errorMessage, 'error')
        } else {
          showToast('Login berhasil! Selamat datang kembali ✨', 'success')
          // No need to redirect, useAuth will handle
        }
      } else {
        // REGISTER
        if (password.length < 6) {
          showToast('Password harus minimal 6 karakter', 'error')
          setLoading(false)
          return
        }
        
        if (!username.trim()) {
          showToast('Username tidak boleh kosong', 'error')
          setLoading(false)
          return
        }
        
        console.log('Attempting registration with:', email, username)
        const result = await signUp(email, password, username)
        console.log('Register result:', result)
        
        if (result.error) {
          let errorMessage = 'Registrasi gagal. Silakan coba lagi.'
          if (result.error.message.includes('already-in-use') || result.error.message.includes('already registered')) {
            errorMessage = 'Email sudah terdaftar. Silakan login.'
          } else if (result.error.message.includes('password') || result.error.message.includes('weak-password')) {
            errorMessage = 'Password terlalu lemah. Gunakan minimal 6 karakter.'
          } else if (result.error.message.includes('invalid-email')) {
            errorMessage = 'Format email tidak valid.'
          }
          showToast(errorMessage, 'error')
        } else {
          showToast(`Selamat datang ${username || email.split('@')[0]}! Registrasi berhasil 🎉`, 'success')
          // Clear form and switch to login
          setEmail('')
          setPassword('')
          setUsername('')
          setIsLogin(true)
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      showToast('Terjadi kesalahan. Silakan coba lagi.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden">
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Ambient orbs */}
      <div className="orb orb-purple w-96 h-96 absolute -top-20 -left-20 opacity-60 pointer-events-none" />
      <div className="orb orb-blue w-80 h-80 absolute bottom-10 right-0 opacity-50 animate-float delay-500 pointer-events-none" />
      <div className="orb orb-pink w-64 h-64 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 animate-float delay-1000 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-6 sm:p-8 animate-slide-up">
          {/* Logo & Title */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full glass mb-3 sm:mb-4 relative group">
              <Calendar size={28} className="text-white sm:hidden" />
              <Calendar size={36} className="text-white hidden sm:block" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-zinc-400 to-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              EventHub
            </h1>
            <p className="text-white/60 text-sm">Manage your events seamlessly</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="transform transition-all duration-300 animate-slide-up">
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="glass-input pl-10 text-white placeholder-white/40 focus:placeholder-white/60 transition-all"
                    required={!isLogin}
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-zinc-400 to-zinc-500 group-focus-within:w-full transition-all duration-300 rounded-full"></div>
                </div>
              </div>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input pl-10 text-white placeholder-white/40 focus:placeholder-white/60 transition-all"
                required
              />
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-zinc-400 to-zinc-500 group-focus-within:w-full transition-all duration-300 rounded-full"></div>
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input pl-10 text-white placeholder-white/40 focus:placeholder-white/60 transition-all"
                required
              />
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-zinc-400 to-zinc-500 group-focus-within:w-full transition-all duration-300 rounded-full"></div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {isLogin ? 'Logging in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Login' : 'Register'}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-600 to-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>
          
          {/* Switch between login/register */}
          <div className="mt-8 text-center">
            <p className="text-white/50 text-sm mb-2">
              {isLogin ? "New to EventHub?" : "Already have an account?"}
            </p>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white/80 hover:text-white transition-all duration-300 text-sm font-medium flex items-center justify-center gap-1 mx-auto group"
            >
              {isLogin ? "Create an account" : "Sign in"}
              <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-zinc-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-zinc-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </div>
    </div>
  )
}