import { useState } from 'react'
import { useDrive } from '../hooks/useDrive'
import FileCard from '../components/FileCard'
import FileModal from '../components/FileModal'
import ToastNotification from '../components/ToastNotification'
import { Upload, HardDrive, Search, X, Pause, Play } from 'lucide-react'

export default function Drive() {
  const { files, loading, activeUploads, startUpload, cancelUpload, deleteFile, shareFile, downloadFile } = useDrive()
  const [search, setSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [toast, setToast] = useState(null)

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleUploadClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async (e) => {
      const selectedFiles = Array.from(e.target.files)
      for (const file of selectedFiles) {
        const res = await startUpload(file)
        if (res && res.success) {
          setToast({ message: `Successfully uploaded ${file.name}`, type: 'success' })
        } else if (res && !res.success) {
          setToast({ message: `Failed to upload ${file.name}`, type: 'error' })
        }
      }
    }
    input.click()
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-row justify-between items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2 truncate">
            <HardDrive className="text-violet-400 flex-shrink-0" size={24} /> 
            <span className="truncate">My Drive</span>
          </h1>
          <p className="text-white/50 text-xs md:text-sm mt-0.5 md:mt-1">{files.length} file{files.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={handleUploadClick}
          className="btn-primary flex items-center gap-2 text-xs md:text-sm px-3 md:px-4 py-2 flex-shrink-0"
        >
          <Upload size={16} className="flex-shrink-0" />
          <span className="hidden sm:inline">Upload File</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </div>

      {activeUploads && activeUploads.length > 0 && (
        <div className="space-y-3">
          {activeUploads.map(upload => (
            <div key={upload.id} className="glass-card p-4 flex flex-col gap-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate" title={upload.file.name}>{upload.file.name}</p>
                  <p className="text-white/50 text-xs mt-0.5 flex items-center gap-2">
                    <span>{formatSize(upload.bytesTransferred)} / {formatSize(upload.totalBytes)}</span>
                    <span>•</span>
                    <span className={upload.state === 'error' || upload.state === 'timeout' ? 'text-red-400' : 'text-emerald-400'}>{Math.round(upload.progress)}%</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2 md:ml-4">
                  <button onClick={() => cancelUpload(upload.id)} className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition" title="Cancel">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${upload.state === 'error' || upload.state === 'timeout' ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              {upload.state === 'error' && (
                <p className="text-red-400 text-xs mt-1">Error: {upload.errorMessage || 'Blocked by server. Please try again.'}</p>
              )}
              {upload.state === 'timeout' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-1">
                  <p className="text-red-400 text-sm font-bold mb-1">Upload Connection Timeout</p>
                  <p className="text-red-300/80 text-xs leading-relaxed">
                    Firebase Storage could not be reached. Please check your Firebase Console: go to <strong>Storage</strong> and click <strong>"Get Started"</strong> to initialize the storage bucket. Also, check your Storage Rules to ensure writes are allowed.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="glass-card p-3 md:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── File Grid ── */}
      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Loading files…</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <HardDrive size={28} className="text-white/25" />
          </div>
          <p className="text-white/60 font-medium">
            {search ? 'No files match your search' : 'No files uploaded yet'}
          </p>
          {!search && (
            <button
              onClick={handleUploadClick}
              className="btn-secondary mt-4 mx-auto flex items-center gap-2 text-sm px-4 py-2"
            >
              <Upload size={15} />
              Upload your first file
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map(file => (
            <FileCard
              key={file.id}
              file={file}
              onClick={() => setSelectedFile(file)}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <FileModal
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        file={selectedFile}
        onDelete={async (file) => {
          await deleteFile(file)
          setSelectedFile(null)
        }}
        onShare={shareFile}
        onDownload={downloadFile}
      />
    </div>
  )
}
