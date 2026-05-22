import { useState } from 'react'
import { useEvents } from '../hooks/useEvents'
import EventCard from '../components/EventCard'
import EventModal from '../components/EventModal'
import CompleteEventModal from '../components/CompleteEventModal'
import CertificateModal from '../components/CertificateModal'
import { Plus, Search, SlidersHorizontal, X, CalendarDays, Inbox } from 'lucide-react'

const CATEGORY_ICONS = {
  Work: '💼',
  Personal: '🏠',
  Meeting: '👥',
  Birthday: '🎂',
  Other: '📌',
}

export default function Schedule() {
  const { events, loading, saving, filter, setFilter, addEvent, updateEvent, updateEventStatus } = useEvents()
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [completeModal, setCompleteModal] = useState({ open: false, event: null })
  const [certModal, setCertModal] = useState({ open: false, event: null })

  const categories = ['Work', 'Personal', 'Meeting', 'Birthday', 'Other']

  const filteredEvents = events.filter(event => {
    if (filter.category && event.category !== filter.category) return false
    if (
      filter.search &&
      !event.title.toLowerCase().includes(filter.search.toLowerCase()) &&
      !event.description?.toLowerCase().includes(filter.search.toLowerCase())
    ) return false
    return true
  })

  const hasFilter = filter.category || filter.search || filter.date

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Schedule</h1>
          <p className="text-white/50 text-sm mt-0.5">{filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditingEvent(null); setShowModal(true) }}
          className="btn-primary flex items-center gap-1.5 text-sm flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Event</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="glass-card p-3 md:p-4">
        <div className="flex flex-col gap-2.5">
          {/* Search — full width */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" size={16} />
            <input
              type="text"
              placeholder="Search events…"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="glass-input pl-9"
            />
          </div>

          {/* Category + Date + Clear — satu baris di semua ukuran */}
          <div className="flex gap-2">
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="glass-input flex-1 text-sm"
            >
              <option value="">All categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
              ))}
            </select>

            <input
              type="date"
              value={filter.date || ''}
              onChange={(e) => setFilter({ ...filter, date: e.target.value })}
              className="glass-input flex-1 text-sm"
            />

            {hasFilter && (
              <button
                onClick={() => setFilter({ category: '', search: '', date: '' })}
                className="btn-secondary flex items-center gap-1 whitespace-nowrap px-3 text-sm"
              >
                <X size={14} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Event list ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50 text-sm">Loading events…</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <CalendarDays size={28} className="text-white/25" />
            </div>
            <p className="text-white/60 font-medium">
              {hasFilter ? 'No events match your filters' : 'No events yet'}
            </p>
            {!hasFilter && (
              <button
                onClick={() => { setEditingEvent(null); setShowModal(true) }}
                className="btn-primary mt-4 mx-auto flex items-center gap-2 text-sm px-4 py-2"
              >
                <Plus size={15} />
                Create first event
              </button>
            )}
          </div>
        ) : (
          filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => { setEditingEvent(event); setShowModal(true) }}
              onStatusUpdate={() => setCompleteModal({ open: true, event })}
              onViewCertificate={() => setCertModal({ open: true, event })}
            />
          ))
        )}
      </div>

      {/* ── Modals ── */}
      <EventModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingEvent(null) }}
        event={editingEvent}
        addEvent={addEvent}
        updateEvent={updateEvent}
        saving={saving}
      />

      <CompleteEventModal
        isOpen={completeModal.open}
        onClose={() => setCompleteModal({ open: false, event: null })}
        event={completeModal.event}
        onComplete={async (id, file) => {
          await updateEventStatus(id, 'completed', file)
          setCompleteModal({ open: false, event: null })
        }}
      />

      <CertificateModal
        isOpen={certModal.open}
        onClose={() => setCertModal({ open: false, event: null })}
        event={certModal.event}
      />
    </div>
  )
}