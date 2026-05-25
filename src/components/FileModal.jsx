import { useState } from 'react'
import { X, Download, Trash2, Share2, File, AlertCircle, Users, ExternalLink, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function FileModal({ isOpen, onClose, file, onDelete, onShare, onDownload }) {
  const { user } = useAuth()
  const [shareTarget, setShareTarget] = useState('')
  const [sharing, setSharing] = useState(false)
  const [shareResult, setShareResult] = useState(null)
  const [shareMode, setShareMode] = useState('email')
  
  if (!isOpen || !file) return null

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isOwner = file.owner_id === user?.id

  const handleShare = async (e) => {
    e.preventDefault()
    
    let target = shareTarget
    if (shareMode === 'all') {
      target = 'all'
    } else if (!target.trim()) {
      return
    }

    setSharing(true)
    setShareResult(null)
    const res = await onShare(file.id, target)
    setSharing(false)

    if (res.success) {
      setShareResult({ type: 'success', message: 'Shared successfully!' })
      if (shareMode === 'email') setShareTarget('')
      setTimeout(() => setShareResult(null), 4000)
    } else {
      setShareResult({ type: 'error', message: res.error || 'Failed to share' })
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ zIndex: 60, animation: 'fadeIn 0.2s ease' }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[6px]" onClick={onClose} />

        <div className="relative glass-card w-full sm:max-w-md sm:rounded-lg rounded-t-3xl rounded-b-none h-[85vh] sm:h-auto overflow-y-auto animate-scale-in">
          <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0f172a]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <File size={18} className="text-violet-400" />
            <h2 className="text-base font-bold text-white truncate max-w-[200px]" title={file.name}>{file.name}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Size</p>
              <p className="text-white font-medium">{formatSize(file.size)}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Date</p>
              <p className="text-white font-medium">{new Date(file.created_at).toLocaleDateString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Type</p>
              <p className="text-white font-medium truncate">{file.type || 'Unknown'}</p>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Share Section (Only for owner) */}
          {isOwner && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/70">
                <Share2 size={16} />
                <h3 className="font-semibold text-sm">Share File</h3>
              </div>
              
              <form onSubmit={handleShare} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <select 
                    value={shareMode} 
                    onChange={(e) => setShareMode(e.target.value)}
                    className="glass-input text-sm w-32"
                    disabled={sharing}
                  >
                    <option value="email">Specific Email</option>
                    <option value="all">Everyone</option>
                  </select>
                  
                  {shareMode === 'email' && (
                    <input
                      type="text"
                      placeholder="Enter email address"
                      value={shareTarget}
                      onChange={(e) => setShareTarget(e.target.value)}
                      className="glass-input flex-1 text-sm"
                      disabled={sharing}
                    />
                  )}
                </div>
                
                <button 
                  type="submit" 
                  disabled={sharing || (shareMode === 'email' && !shareTarget.trim())} 
                  className="btn-primary py-2 px-4 text-sm w-full"
                >
                  {sharing ? '...' : shareMode === 'all' ? 'Share with Everyone' : 'Share to Email'}
                </button>
              </form>

              {shareResult && (
                <div 
                  className={`px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5 shadow-sm animate-fade-in border ${
                    shareResult.type === 'success' 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' 
                      : 'bg-red-500/15 text-red-300 border-red-500/20'
                  }`}
                >
                  {shareResult.type === 'success' ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={14} className="text-red-400" />
                    </div>
                  )}
                  <p className="font-medium tracking-wide">{shareResult.message}</p>
                </div>
              )}

              {file.shared_with && file.shared_with.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-white/40 pt-1">
                  <Users size={12} />
                  <span>Shared with {file.shared_with.includes('all') ? 'Everyone' : `${file.shared_with.length} user(s)`}</span>
                </div>
              )}
            </div>
          )}

          {!isOwner && (
            <div className="flex items-center gap-2 text-white/50 text-sm bg-white/5 p-3 rounded-xl border border-white/10">
              <Users size={16} />
              <span>Shared with you</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isOwner && (
              <button 
                onClick={() => onDelete(file)}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                title="Delete File"
              >
                <Trash2 size={16} />
              </button>
            )}
            
            <button 
              onClick={() => onDownload(file)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download
            </button>
          </div>

        </div>
      </div>
    </div>
    </>
  )
}
