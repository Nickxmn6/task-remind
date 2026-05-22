import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function ToastNotification({ message, type, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-5 right-5 z-50 transition-all duration-500 ease-out ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`rounded-2xl shadow-2xl backdrop-blur-xl p-4 min-w-[340px] border ${
        type === 'success' 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {type === 'success' ? (
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="text-green-400" size={16} />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="text-red-400" size={16} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${
              type === 'success' ? 'text-green-300' : 'text-red-300'
            }`}>
              {type === 'success' ? 'Berhasil!' : 'Gagal!'}
            </p>
            <p className="text-white/80 text-sm mt-0.5">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
            className="text-white/40 hover:text-white/80 transition-all p-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}