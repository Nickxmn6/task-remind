import { X, Download, Award } from 'lucide-react'

export default function CertificateModal({ isOpen, onClose, event }) {
  if (!isOpen || !event) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 100, animation: 'fadeIn 0.2s ease' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col glass rounded-[20px] overflow-hidden"
        style={{ animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 glass rounded-t-[20px] z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Award size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Event Certificate</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-black/20">
          <img 
            src={event.certificate_url} 
            alt="Certificate" 
            className="max-w-full max-h-[50vh] md:max-h-[60vh] object-contain rounded-xl shadow-2xl border border-white/5"
          />
          
          <div className="w-full mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Close
            </button>
            <a 
              href={event.certificate_url} 
              download={`Certificate-${event.title?.replace(/\s+/g, '-') || 'Event'}.jpg`}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
