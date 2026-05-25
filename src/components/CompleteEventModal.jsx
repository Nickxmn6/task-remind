import { useState } from 'react'
import { X, Upload, CheckCircle, FileText } from 'lucide-react'

export default function CompleteEventModal({ isOpen, onClose, event, onComplete }) {
  const [certificateFile, setCertificateFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setCertificateFile(file)
    setLoading(true)
    try {
      await onComplete(event.id, file)
    } finally {
      setLoading(false)
      setCertificateFile(null)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setCertificateFile(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 60, animation: 'fadeIn 0.2s ease' }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
        onClick={!loading ? handleClose : undefined}
      />

      <div className="relative glass-card w-full max-w-md animate-scale-in">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle size={16} className="text-emerald-400" />
            </div>
            <h2 className="text-base font-bold text-white">Complete Event</h2>
          </div>
          <button onClick={handleClose} disabled={loading} className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Event info */}
          <div className="text-center py-2">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle size={26} className="text-emerald-400" />
            </div>
            <p className="text-white font-semibold">{event?.title}</p>
            <p className="text-white/45 text-sm mt-1">Upload a certificate to mark this event as completed</p>
          </div>

          {/* File drop zone */}
          <label className="block cursor-pointer group">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
              loading || certificateFile
                ? 'border-emerald-500/50 bg-emerald-500/8'
                : 'border-white/15 bg-white/3 group-hover:border-white/30 group-hover:bg-white/6'
            }`}>
              {loading || certificateFile ? (
                <div className="py-2 animate-fade-in">
                  <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-emerald-400 text-sm font-medium">Uploading & Completing…</p>
                  {certificateFile && <p className="text-emerald-300/70 text-xs mt-1 truncate px-4">{certificateFile.name}</p>}
                </div>
              ) : (
                <div className="animate-fade-in">
                  <Upload size={28} className="mx-auto mb-2 text-white/30 group-hover:text-white/50 transition-colors" />
                  <p className="text-white/50 text-sm font-medium group-hover:text-white/70 transition-colors">Click to select certificate</p>
                  <p className="text-white/25 text-xs mt-1.5">PDF, PNG, JPG — max 5 MB</p>
                </div>
              )}
            </div>
          </label>

          <div className="flex gap-3">
            <button type="button" onClick={handleClose} disabled={loading} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}