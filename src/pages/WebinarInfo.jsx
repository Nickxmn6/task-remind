import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Heart, MessageCircle, Repeat, Send, MoreHorizontal, CheckCircle2, Trash2, Image as ImageIcon, X, Loader } from 'lucide-react'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow, format } from 'date-fns'
import { id } from 'date-fns/locale'

// Helper function to compress images
const compressImage = (file, maxWidth = 1024, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Output as base64 string
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
};

const ThreadPost = React.memo(function ThreadPost({ post, onLike, onDelete, onComment, currentUserId, currentUserProfile }) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const optionsRef = useRef(null)

  const hasLiked = post.likes?.includes(currentUserId)
  const isVerified = post.author.role === 'dev' || post.author.role === 'admin'
  const isAuthor = post.authorId === currentUserId

  const dateObj = post.createdAt?.toDate()
  const timeDisplay = dateObj 
    ? `${format(dateObj, 'dd MMM yyyy, HH:mm', { locale: id })} (${formatDistanceToNow(dateObj, { addSuffix: true, locale: id })})`
    : 'Baru saja'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopyText = () => {
    if (post.content) {
      navigator.clipboard.writeText(post.content)
      setShowOptions(false)
      alert("Teks berhasil disalin!")
    }
  }

  const handleSubmitComment = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    onComment(post.id, commentText)
    setCommentText('')
  }

  return (
    <>
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
            <div className="flex items-start justify-between relative" ref={optionsRef}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-white font-semibold text-[15px]">{post.author.name}</span>
                <span className="text-white/40 text-sm">
                  @{post.author.name.toLowerCase().replace(/\s+/g, '')}
                </span>
                <span className="text-white/40 text-sm">·</span>
                <span className="text-white/40 text-sm">{timeDisplay}</span>
              </div>
              
              {/* 3 Dots Menu */}
              <div className="flex items-center relative">
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-white/40 hover:text-white/80 transition-colors p-1 -mr-2"
                >
                  <MoreHorizontal size={18} />
                </button>
                
                {/* Dropdown Options */}
                {showOptions && (
                  <div className="absolute right-0 top-8 w-40 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-1 z-10 overflow-hidden animate-fade-in">
                    {post.content && (
                      <button 
                        onClick={handleCopyText}
                        className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
                      >
                        Salin Teks
                      </button>
                    )}
                    {(isAuthor || currentUserProfile?.role === 'dev') && (
                      <button 
                        onClick={() => {
                          onDelete(post.id);
                          setShowOptions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-between"
                      >
                        Hapus <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Optional Image Attachment */}
            {post.image && (
              <div 
                onClick={() => setIsPreviewOpen(true)}
                className="mt-2 mb-2 rounded-xl overflow-hidden border border-white/10 max-h-[400px] bg-zinc-900/50 cursor-pointer hover:opacity-95 transition-opacity"
              >
                <img 
                  src={post.image} 
                  alt="Post attachment" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Body */}
            {post.content && (
              <div className="mt-1 text-[15px] text-white/90 leading-relaxed whitespace-pre-wrap break-words">
                {post.content}
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
              
              <button 
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-2 text-sm group ${showComments ? 'text-blue-400' : 'text-white/50 hover:text-white/80'} transition-colors`}
              >
                <div className={`p-1.5 rounded-full group-hover:bg-blue-400/10 transition-colors ${showComments ? 'bg-blue-400/10' : ''}`}>
                  <MessageCircle size={18} className={showComments ? 'fill-current' : ''} />
                </div>
                <span className={showComments ? 'font-medium' : ''}>{post.commentsCount || 0}</span>
              </button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
                {/* Existing Comments */}
                <div className="space-y-4 mb-4">
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {comment.avatar}
                        </div>
                        <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-none p-3 text-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-semibold text-white">{comment.username}</span>
                            {comment.role === 'dev' && <CheckCircle2 size={12} className="text-blue-400" />}
                          </div>
                          <p className="text-white/80 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/30 text-sm text-center py-2">Belum ada komentar.</p>
                  )}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleSubmitComment} className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-zinc-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {currentUserProfile?.username?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Tulis balasan..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!commentText.trim()}
                    className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500 flex-shrink-0"
                  >
                    <Send size={14} className="ml-0.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {isPreviewOpen && post.image && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center backdrop-blur-md animate-fade-in p-4 sm:p-8"
          onClick={() => setIsPreviewOpen(false)}
        >
          {/* Top Gradient Bar for the X Button */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
          
          <button 
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/25 hover:scale-110 transition-all shadow-2xl backdrop-blur-md z-20 border border-white/10"
          >
            <X size={24} />
          </button>
          
          <div className="relative w-full h-full max-w-5xl flex items-center justify-center">
            <img 
              src={post.image} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.6)] border border-white/5"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </>
  )
})

export default function WebinarInfo() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [newPostContent, setNewPostContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)

  const currentUserInitials = profile?.username?.[0]?.toUpperCase() ?? 'U'


  useEffect(() => {
    let isInitialLoad = true
    const q = query(collection(db, 'webinars'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      

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

  const handleLike = useCallback(async (postId, hasLiked) => {
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
  }, [user])

  const handleDelete = useCallback(async (postId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus postingan ini?")) {
      try {
        await deleteDoc(doc(db, 'webinars', postId))
      } catch (error) {
        console.error("Error deleting post:", error)
        alert("Gagal menghapus: " + error.message)
      }
    }
  }, [])

  const handleComment = useCallback(async (postId, commentText) => {
    if (!user || !commentText.trim()) return;
    const postRef = doc(db, 'webinars', postId);
    try {
      const currentPost = posts.find(p => p.id === postId);
      const newComment = {
        id: Date.now().toString() + Math.random().toString(),
        userId: user.id,
        username: profile?.username || 'User',
        avatar: profile?.username?.[0]?.toUpperCase() ?? 'U',
        role: profile?.role || 'member',
        text: commentText.trim(),
        createdAt: new Date().toISOString()
      };
      
      await updateDoc(postRef, {
        comments: arrayUnion(newComment),
        commentsCount: (currentPost?.commentsCount || 0) + 1
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Gagal mengirim komentar: " + error.message);
    }
  }, [user, profile, posts]);

  const handleSubmitPost = async (e) => {
    e.preventDefault()
    if ((!newPostContent.trim() && !selectedImage) || !user || isSubmitting) return

    setIsSubmitting(true)
    try {
      let imageUrl = null;
      if (selectedImage) {
        // Compress image and get base64 string
        imageUrl = await compressImage(selectedImage);
      }

      const postData = {
        authorId: user.id,
        author: {
          name: profile?.username || 'User',
          avatar: currentUserInitials,
          role: profile?.role || 'member'
        },
        content: newPostContent.trim(),
        image: imageUrl,
        likes: [],
        commentsCount: 0,
        repostsCount: 0,
        createdAt: serverTimestamp()
      };

      // Jika ada gambar, kita tunggu sampai addDoc selesai agar aman
      if (selectedImage) {
        await addDoc(collection(db, 'webinars'), postData);
      } else {
        // Optimistic update: Jangan ditunggu jika hanya teks! Biarkan berjalan di background.
        addDoc(collection(db, 'webinars'), postData).catch(error => {
          console.error("Error background posting:", error);
          alert("Gagal memposting (Teks): " + error.message);
        });
      }

      setNewPostContent('')
      setSelectedImage(null)
      if (fileInputRef.current) fileInputRef.current.value = '';
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
            {selectedImage && (
              <div className="mb-3 relative inline-block">
                <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-lg">
                  <img 
                    src={URL.createObjectURL(selectedImage)} 
                    alt="Preview" 
                    className="max-h-48 object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-400 shadow-xl"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Mulai thread baru..."
              className="w-full bg-transparent border-none text-[15px] text-white placeholder:text-white/40 focus:ring-0 resize-none outline-none min-h-[44px]"
              rows={newPostContent.split('\n').length > 1 ? Math.min(newPostContent.split('\n').length, 5) : 1}
            />
            
            <div className="flex items-center justify-between mt-2 border-t border-white/5 pt-3">
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  hidden 
                  accept="image/*" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedImage(e.target.files[0]);
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                  title="Lampirkan Gambar"
                >
                  <ImageIcon size={18} />
                </button>
              </div>
              <button 
                type="submit" 
                disabled={(!newPostContent.trim() && !selectedImage) || isSubmitting}
                className="btn-primary text-xs py-1.5 px-5 rounded-full font-bold disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    Memposting...
                  </>
                ) : 'Post'}
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
                onComment={handleComment}
                currentUserId={user?.id} 
                currentUserProfile={profile}
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
