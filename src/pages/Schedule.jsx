import { useState, useMemo } from 'react'
import { Calendar, Clock, MapPin, Shirt, User } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import './Schedule.css'

const CONVENTION_DAYS = [
  { date: '2026-08-14', label: 'Friday', short: 'Fri', dayNum: 'Aug 14' },
  { date: '2026-08-15', label: 'Saturday', short: 'Sat', dayNum: 'Aug 15' },
  { date: '2026-08-16', label: 'Sunday', short: 'Sun', dayNum: 'Aug 16' },
]

const formatTime = (iso) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const Schedule = () => {
  const { getEventsForDay } = useApp()
  const [selectedDay, setSelectedDay] = useState(CONVENTION_DAYS[0].date)
  const events = useMemo(() => getEventsForDay(selectedDay), [getEventsForDay, selectedDay])
  const activeDay = CONVENTION_DAYS.find(d => d.date === selectedDay)

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h1 className="page-title">
          <Calendar className="page-title-icon" size={32} />
          Master Schedule
        </h1>
        <p className="page-subtitle">The Greatest Showman — 2026 Rainbow Grand Assembly Convention</p>
      </div>

      <div className="schedule-day-tabs" role="tablist" aria-label="Convention days">
        {CONVENTION_DAYS.map(day => (
          <button
            key={day.date}
            role="tab"
            aria-selected={selectedDay === day.date}
            className={`schedule-day-tab ${selectedDay === day.date ? 'active' : ''}`}
            onClick={() => setSelectedDay(day.date)}
          >
            <span className="day-tab-label">{day.short}</span>
            <span className="day-tab-date">{day.dayNum}</span>
          </button>
        ))}
      </div>

      <div className="schedule-content">
        <h2 className="schedule-day-heading">
          {activeDay?.label}, {activeDay?.dayNum} · {events.length} events
        </h2>

        {events.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🎪</span>
            <h3 className="empty-state-title">No events scheduled</h3>
            <p className="empty-state-message">Check another day for the full lineup.</p>
          </div>
        ) : (
          <ol className="schedule-timeline">
            {events.map(event => (
              <li key={event.id} className="event-card">
                <div className="event-time">
                  <Clock size={14} aria-hidden="true" />
                  <span>{formatTime(event.startTime)}</span>
                  <span className="event-time-end">– {formatTime(event.endTime)}</span>
                </div>
                <div className="event-body">
                  <h3 className="event-name">{event.name}</h3>
                  <p className="event-description">{event.description}</p>
                  <div className="event-meta">
                    {event.room && (
                      <span className="event-meta-item"><MapPin size={13} aria-hidden="true" /> {event.room}</span>
                    )}
                    {event.dressCode && (
                      <span className="event-meta-item"><Shirt size={13} aria-hidden="true" /> {event.dressCode}</span>
                    )}
                    {event.presenter && (
                      <span className="event-meta-item"><User size={13} aria-hidden="true" /> {event.presenter}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

export default Schedule
