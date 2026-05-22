import { useAuth } from '../context/AuthContext'
import { useEvents } from '../hooks/useEvents'
import EventCard from '../components/EventCard'
import EventModal from '../components/EventModal'
import CompleteEventModal from '../components/CompleteEventModal'
import CertificateModal from '../components/CertificateModal'
import { Calendar, Clock, Layers, TrendingUp, Plus, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function StatCard({ label, value, icon: Icon, gradient, delay }) {
  return (
    <div className="glass-card p-4 md:p-5 stat-card animate-slide-up" style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-white/45 text-[10px] md:text-xs font-semibold uppercase tracking-widest mb-1.5 md:mb-2 leading-tight">{label}</p>
          <p className="text-3xl md:text-4xl font-bold text-white leading-none">{value}</p>
        </div>
        <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 ml-2 ${gradient}`}>
          <Icon size={17} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const { events, getUpcomingEvents, loading, saving, addEvent, updateEvent, updateEventStatus } = useEvents()
  const [showModal, setShowModal] = useState(false)
  const [completeModal, setCompleteModal] = useState({ open: false, event: null })
  const [certModal, setCertModal] = useState({ open: false, event: null })
  const navigate = useNavigate()

  const upcomingEvents = getUpcomingEvents(7)
  const completedCount = events.filter(e => e.status === 'completed').length

  const stats = [
    {
      label: 'Total Events',
      value: events.length,
      icon: Layers,
      gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
      delay: '0ms',
    },
    {
      label: 'Upcoming (7d)',
      value: upcomingEvents.length,
      icon: Calendar,
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      delay: '60ms',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      delay: '120ms',
    },
  ]

  const greetHour = new Date().getHours()
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">

      {/* ── Hero greeting ── */}
      <div className="glass-card p-5 md:p-7 relative overflow-hidden animate-slide-up">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-violet-600/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-24 bg-gradient-to-t from-blue-600/8 to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-white/40 text-sm font-medium mb-1">{greeting} 👋</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {profile?.username ?? 'User'}
            </h1>
            <p className="text-white/50 text-sm mt-1.5">
              You have <span className="text-violet-300 font-semibold">{upcomingEvents.length}</span> upcoming event{upcomingEvents.length !== 1 ? 's' : ''} this week.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto text-sm"
          >
            <Plus size={16} />
            Quick Add
          </button>
        </div>
      </div>

      {/* ── Stats: 3 kolom di semua ukuran layar ── */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Upcoming events ── */}
      <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '180ms' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Clock size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Upcoming Events</h2>
          </div>
          <button
            onClick={() => navigate('/schedule')}
            className="text-violet-400 hover:text-violet-300 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            View all
            <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Loading…</p>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="py-10 text-center">
            <Calendar size={36} className="text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No upcoming events this week</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4 mx-auto flex items-center gap-1.5 text-sm px-4 py-2"
            >
              <Plus size={14} />
              Create event
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.slice(0, 5).map(event => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => {}}
                onStatusUpdate={() => setCompleteModal({ open: true, event })}
                onViewCertificate={() => setCertModal({ open: true, event })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <EventModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        event={null}
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