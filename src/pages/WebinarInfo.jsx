import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Repeat, Send, MoreHorizontal, CheckCircle2, Trash2 } from 'lucide-react'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow, format } from 'date-fns'
import { id } from 'date-fns/locale'

function ThreadPost({ post, onLike, onDelete, currentUserId }) {
  const hasLiked = post.likes?.includes(currentUserId)
  const isVerified = post.author.role === 'dev' || post.author.role === 'admin'
  const isAuthor = post.authorId === currentUserId

  const dateObj = post.createdAt?.toDate()
  const timeDisplay = dateObj 
    ? `${format(dateObj, 'dd MMM yyyy, HH:mm', { locale: id })} (${formatDistanceToNow(dateObj, { addSuffix: true, locale: id })})`
    : 'Baru saja'

  return (
    <div className="border-b border-white/10 p-4 sm:p-5 hover:bg-white/[0.02] transition-colors duration-200">
      <div className="flex gap-3 sm:gap-4">
        {/* Left Col: Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-zinc-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 relative">
            {post.author.avatar}
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-[var(--surface)] rounded-full p-[2px]">
                <CheckCircle2 size={14} className="text-blue-400" />
              </div>
            )}
          </div>
          <div className="w-[1.5px] h-full bg-white/10 mt-3 rounded-full" />
        </div>

        {/* Right Col: Content */}
        <div className="flex-1 min-w-0 pb-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white font-semibold text-[15px]">{post.author.name}</span>
              <span className="text-white/40 text-sm">
                @{post.author.name.toLowerCase().replace(/\s+/g, '')}
              </span>
              <span className="text-white/40 text-sm">·</span>
              <span className="text-white/40 text-sm">{timeDisplay}</span>
            </div>
            <div className="flex items-center">
              {isAuthor && (
                <button 
                  onClick={() => onDelete(post.id)}
                  className="text-white/30 hover:text-red-400 transition-colors p-1 mr-1"
                  title="Hapus postingan"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button className="text-white/40 hover:text-white/80 transition-colors p-1 -mr-2">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="mt-1 text-[15px] text-white/90 leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </div>

          {/* Optional Image Attachment (can be added later) */}
          {post.image && (
            <div className="mt-3 rounded-xl overflow-hidden border border-white/10 max-h-[300px] bg-zinc-900/50">
              <img 
                src={post.image} 
                alt="Post attachment" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-6 mt-4">
            <button 
              onClick={() => onLike(post.id, hasLiked)}
              className={`flex items-center gap-2 text-sm group ${hasLiked ? 'text-pink-500' : 'text-white/50 hover:text-white/80'} transition-colors`}
            >
              <div className={`p-1.5 rounded-full group-hover:bg-pink-500/10 transition-colors ${hasLiked ? 'bg-pink-500/10' : ''}`}>
                <Heart size={18} className={hasLiked ? 'fill-current' : ''} />
              </div>
              <span className={hasLiked ? 'font-medium' : ''}>{post.likes?.length || 0}</span>
            </button>
            <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors group">
              <div className="p-1.5 rounded-full group-hover:bg-white/10 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span>{post.commentsCount || 0}</span>
            </button>
            <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors group">
              <div className="p-1.5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                <Repeat size={18} className="group-hover:text-emerald-400 transition-colors" />
              </div>
              <span>{post.repostsCount || 0}</span>
            </button>
            <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors group">
              <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                <Send size={18} className="group-hover:text-blue-400 transition-colors" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WebinarInfo() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [newPostContent, setNewPostContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const currentUserInitials = profile?.username?.[0]?.toUpperCase() ?? 'U'

  // Minta izin notifikasi saat komponen dimuat
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    let isInitialLoad = true
    const q = query(collection(db, 'webinars'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      
      // Trigger notification untuk post baru
      if (!isInitialLoad && 'Notification' in window && Notification.permission === 'granted') {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data()
            // Jangan beri notifikasi jika yang posting adalah diri sendiri
            if (user && data.authorId !== user.id) {
               new Notification(`Info Webinar: ${data.author.name}`, {
                 body: data.content.substring(0, 60) + (data.content.length > 60 ? '...' : ''),
               })
            }
          }
        })
      }

      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPosts(postsData)
      setLoading(false)
      isInitialLoad = false
    })

    return () => unsubscribe()
  }, [user])

  const handleLike = async (postId, hasLiked) => {
    if (!user) return
    const postRef = doc(db, 'webinars', postId)
    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.id)
        })
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.id)
        })
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleDelete = async (postId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus postingan ini?")) {
      try {
        await deleteDoc(doc(db, 'webinars', postId))
      } catch (error) {
        console.error("Error deleting post:", error)
        alert("Gagal menghapus: " + error.message)
      }
    }
  }

  const handleSubmitPost = async (e) => {
    e.preventDefault()
    if (!newPostContent.trim() || !user || isSubmitting) return

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, 'webinars'), {
        authorId: user.id,
        author: {
          name: profile?.username || 'User',
          avatar: currentUserInitials,
          role: profile?.role || 'member'
        },
        content: newPostContent.trim(),
        likes: [],
        commentsCount: 0,
        repostsCount: 0,
        createdAt: serverTimestamp()
      })
      setNewPostContent('')
    } catch (error) {
      console.error("Error adding post: ", error)
      alert("Gagal memposting: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Webinar Info</h1>
          <p className="text-white/50 text-sm mt-1">Pengumuman & informasi event terbaru</p>
        </div>
      </div>

      {/* Main Feed Container */}
      <div className="glass-card !rounded-2xl bg-[var(--surface)] border border-white/10 overflow-hidden shadow-2xl relative">
        {/* Glow effect at the top */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        
        {/* Create Post Header */}
        <form onSubmit={handleSubmitPost} className="p-4 sm:p-5 border-b border-white/10 flex gap-3 sm:gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-zinc-600 flex items-center justify-center text-white font-bold flex-shrink-0 mt-1">
            {currentUserInitials}
          </div>
          <div className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Mulai thread baru..."
              className="w-full bg-transparent border-none text-[15px] text-white placeholder:text-white/40 focus:ring-0 resize-none outline-none min-h-[44px]"
              rows={newPostContent.split('\n').length > 1 ? Math.min(newPostContent.split('\n').length, 5) : 1}
            />
            <div className="flex justify-end mt-2">
              <button 
                type="submit" 
                disabled={!newPostContent.trim() || isSubmitting}
                className="btn-primary text-xs py-1.5 px-5 rounded-full font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>

        {/* Posts Feed */}
        <div className="flex flex-col min-h-[200px]">
          {loading ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3"></div>
              <p className="text-white/40 text-sm">Memuat timeline...</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <ThreadPost 
                key={post.id} 
                post={post} 
                onLike={handleLike}
                onDelete={handleDelete} 
                currentUserId={user?.id} 
              />
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={24} className="text-white/20" />
              </div>
              <p className="text-white/60 font-medium mb-1">Belum ada thread</p>
              <p className="text-white/30 text-sm">Jadilah yang pertama memulai diskusi!</p>
            </div>
          )}
        </div>
        
        {/* End of Feed Message */}
        {!loading && posts.length > 0 && (
          <div className="p-8 text-center border-t border-white/5">
            <p className="text-white/30 text-sm">Tidak ada thread lagi.</p>
          </div>
        )}
      </div>
    </div>
  )
}
