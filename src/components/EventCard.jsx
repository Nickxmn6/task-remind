import { Calendar, Clock, MapPin, Bell, CheckCircle, Circle, FileText, Edit2, X } from 'lucide-react'
import { useState } from 'react'

const STATUS_CONFIG = {
  completed: {
    badge: 'badge-completed',
    icon: <CheckCircle size={12} />,
    label: 'Completed',
    glow: 'shadow-[0_0_24px_rgba(16,185,129,0.12)]',
    border: 'border-emerald-500/20',
  },
  ongoing: {
    badge: 'badge-ongoing',
    icon: <Clock size={12} />,
    label: 'Ongoing',
    glow: 'shadow-[0_0_24px_rgba(245,158,11,0.12)]',
    border: 'border-amber-500/20',
  },
  pending: {
    badge: 'badge-pending',
    icon: <Circle size={12} />,
    label: 'Pending',
    glow: 'shadow-[0_0_24px_rgba(99,102,241,0.1)]',
    border: 'border-violet-500/15',
  },
}

const CATEGORY_EMOJIS = {
  Work: '💼',
  Personal: '🏠',
  Meeting: '👥',
  Birthday: '🎂',
  Other: '📌',
}

export default function EventCard({ event, onEdit, onStatusUpdate }) {
  const [showCertModal, setShowCertModal] = useState(false)

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const cfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.pending

  return (
    <div className={`glass-card overflow-hidden border ${cfg.border} ${cfg.glow} group`}>
      <div className="flex">

        {/* ── Photo / placeholder strip ── */}
        <div className="flex-shrink-0 w-20 md:w-32 relative overflow-hidden">
          {event.event_photo ? (
            <img
              src={event.event_photo}
              alt={event.title}
              className="w-full h-full object-cover min-h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full min-h-[110px] bg-gradient-to-br from-violet-600/20 via-purple-600/15 to-indigo-600/20 flex items-center justify-center">
              <Calendar size={22} className="text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 pointer-events-none" />
        </div>

        {/* ── Content ── */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className={`badge ${cfg.badge}`}>
                  {cfg.icon}
                  {cfg.label}
                </span>
                {event.category && (
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}>
                    {CATEGORY_EMOJIS[event.category] ?? '📌'} {event.category}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-white leading-snug truncate mb-2">
                {event.title}
              </h3>

              {/* Meta info */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <Calendar size={12} className="flex-shrink-0" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <Clock size={12} className="flex-shrink-0" />
                  <span>{event.time}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1.5 text-white/50 text-xs">
                    <MapPin size={12} className="flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
                {event.reminder_enabled && (
                  <div className="flex items-center gap-1.5 text-amber-400/70 text-xs">
                    <Bell size={12} className="flex-shrink-0" />
                    <span>{event.reminder_minutes} min before</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <p className="mt-2 text-white/40 text-xs line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
              )}

              {/* Certificate link */}
              {event.certificate_url && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCertModal(true); }}
                  className="mt-2 inline-flex items-center gap-1 text-emerald-400 text-xs hover:text-emerald-300 transition-colors"
                >
                  <FileText size={11} />
                  View Certificate
                </button>
              )}
            </div>

            {/* ── Action buttons ── */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {event.status !== 'completed' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onStatusUpdate?.(event) }}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 transition-all duration-200"
                  title="Mark as completed"
                >
                  <CheckCircle size={16} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onEdit?.(event) }}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 hover:border-white/20 text-white/50 hover:text-white transition-all duration-200"
                title="Edit event"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Certificate Modal ── */}
      {showCertModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); setShowCertModal(false); }}
        >
          <div 
            className="glass-card relative max-w-3xl w-full p-2 md:p-3 border border-white/10 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); setShowCertModal(false); }}
              className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-slate-800 text-white/50 hover:text-white hover:bg-slate-700 border border-white/10 hover:border-white/20 transition-all z-10"
            >
              <X size={18} />
            </button>
            <div className="w-full h-full bg-slate-900/50 rounded-lg overflow-hidden flex items-center justify-center">
              <img 
                src={event.certificate_url} 
                alt="Certificate" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}