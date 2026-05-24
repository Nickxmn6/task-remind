import { File, FileText, Image as ImageIcon, Archive, FileQuestion, Users } from 'lucide-react'

export default function FileCard({ file, onClick }) {
  const getFileIcon = (type, name) => {
    if (type.startsWith('image/')) return <ImageIcon size={24} className="text-blue-400" />
    if (type.includes('pdf')) return <FileText size={24} className="text-red-400" />
    if (name.endsWith('.zip') || name.endsWith('.rar')) return <Archive size={24} className="text-amber-400" />
    if (type.startsWith('text/')) return <FileText size={24} className="text-gray-400" />
    return <FileQuestion size={24} className="text-violet-400" />
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isShared = file.shared_with && file.shared_with.length > 0;

  return (
    <div 
      onClick={onClick}
      className="glass-card p-4 hover:bg-white/5 cursor-pointer transition-colors group flex flex-col items-center text-center gap-3 relative"
    >
      {isShared && (
        <div className="absolute top-2 right-2 text-white/30" title="Shared file">
          <Users size={14} />
        </div>
      )}
      
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {getFileIcon(file.type, file.name)}
      </div>
      
      <div className="w-full">
        <p className="text-white text-sm font-medium truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-white/40 text-xs mt-0.5">
          {formatSize(file.size)}
        </p>
      </div>
    </div>
  )
}
