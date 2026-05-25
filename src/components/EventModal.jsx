import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle, AlertCircle, Upload, ImageIcon, Sparkles } from 'lucide-react'

/**
 * EventModal — receives addEvent / updateEvent / saving from the PARENT
 * via props to avoid creating a duplicate useEvents() instance.
 */
export default function EventModal({ isOpen, onClose, event, addEvent, updateEvent, saving }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: '',
    reminder_enabled: true,
    reminder_minutes: 30,
  })
  const [localLoading, setLocalLoading] = useState(false)
  const [error, setError] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  // Populate form when editing
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        date: event.date,
        time: event.time,
        location: event.location || '',
        category: event.category || '',
        reminder_enabled: event.reminder_enabled ?? true,
        reminder_minutes: event.reminder_minutes ?? 30,
      })
      setPhotoPreview(event.event_photo || null)
    } else {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toTimeString().slice(0, 5)
      setFormData({
        title: '',
        description: '',
        date: today,
        time: now,
        location: '',
        category: '',
        reminder_enabled: true,
        reminder_minutes: 30,
      })
      setPhotoFile(null)
      setPhotoPreview(null)
    }
    setError(null)
  }, [event, isOpen])

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5 MB')
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
    setError(null)
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    setLocalLoading(true)

    try {
      let result

      if (event) {
        // Single update call — photo handled inside updateEvent
        result = await updateEvent(event.id, formData, photoFile || null)
      } else {
        // Single insert + photo handled inside addEvent
        result = await addEvent(formData, photoFile || null)
      }

      if (result.success) {
        onClose()
      } else {
        setError(result.error?.message || 'Failed to save event')
      }
    } catch (err) {
      console.error('Error saving event:', err)
      setError('An error occurred while saving the event')
    } finally {
      setLocalLoading(false)
    }
  }

  const isBusy = localLoading || saving

  if (!isOpen) return null

  return (
    // Overlay — z-60 supaya selalu di atas drawer (z-50)
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 60, animation: 'fadeIn 0.2s ease' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
        onClick={!isBusy ? onClose : undefined}
      />

      {/* Dialog — centered, scrollable, di semua ukuran layar */}
      <div
        className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto glass rounded-[20px]"
        style={{ animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
      >

        {/* ── Header ── */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 sticky top-0 glass rounded-t-[20px] z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {event ? 'Edit Event' : 'New Event'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">

          {/* Error */}
          {error && (
            <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={15} />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Photo upload */}
          <div>
            <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
              Event Photo
            </label>
            <div className="flex items-center gap-4">
              {/* Preview / placeholder */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={22} className="text-white/25" />
                  )}
                </div>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={isBusy}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center transition shadow-lg"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              {/* Upload button */}
              <label className="cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={isBusy}
                />
                <div className="btn-secondary text-sm flex items-center gap-2 py-2 px-4">
                  <Upload size={14} />
                  {photoPreview ? 'Change' : 'Upload Photo'}
                </div>
                <p className="text-white/30 text-xs mt-1.5">Max 5 MB</p>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">
              Title <span className="text-violet-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Event title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="glass-input"
              required
              disabled={isBusy}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Optional description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-input resize-none"
              rows="2"
              disabled={isBusy}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="glass-input"
                required
                disabled={isBusy}
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="glass-input"
                required
                disabled={isBusy}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">Location</label>
            <input
              type="text"
              placeholder="Optional location..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="glass-input"
              disabled={isBusy}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="glass-input"
              disabled={isBusy}
            >
              <option value="">— Select category —</option>
              <option value="Work">💼 Work</option>
              <option value="Personal">🏠 Personal</option>
              <option value="Meeting">👥 Meeting</option>
              <option value="Birthday">🎂 Birthday</option>
              <option value="Other">📌 Other</option>
            </select>
          </div>

          {/* Reminder */}
          <div className="glass rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.reminder_enabled}
                  onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                  className="sr-only"
                  disabled={isBusy}
                />
                <div className={`w-10 h-6 rounded-full transition-all duration-300 ${formData.reminder_enabled ? 'bg-violet-500' : 'bg-white/15'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all duration-300 ${formData.reminder_enabled ? 'left-4' : 'left-0.5'}`} />
                </div>
              </div>
              <span className="text-white/80 text-sm font-medium">Enable Reminder</span>
            </label>

            {formData.reminder_enabled && (
              <select
                value={formData.reminder_minutes}
                onChange={(e) => setFormData({ ...formData, reminder_minutes: parseInt(e.target.value) })}
                className="glass-input text-sm"
                disabled={isBusy}
              >
                <option value="5">5 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isBusy ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {event ? 'Updating…' : 'Saving…'}
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  {event ? 'Update' : 'Create Event'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}