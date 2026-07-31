import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Clock, MapPin, Shirt, User, X } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { getEventSpeakerTags } from '../data/speakerSchedule'
import './Schedule.css'

const buildConventionDays = (startDate, numberOfDays) => {
  const start = new Date(`${startDate || '2026-08-14'}T00:00:00`)
  const count = Number(numberOfDays) || 3

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const iso = date.toISOString().slice(0, 10)
    return {
      date: iso,
      label: date.toLocaleDateString('en-US', { weekday: 'long' }),
      short: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }
  })
}

const formatTime = (iso) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const formatDay = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

const Schedule = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { getEventsForDay, sheetData, appConfig } = useApp()
  const conventionDays = useMemo(() => buildConventionDays(appConfig.startDate, appConfig.numberOfDays), [appConfig.startDate, appConfig.numberOfDays])
  const sourceEvents = useMemo(() => sheetData.events, [sheetData.events])
  const speakers = sheetData.speakers.length ? sheetData.speakers : undefined
  const selectedEvent = useMemo(() => sourceEvents.find(event => event.id === eventId), [sourceEvents, eventId])
  const [selectedDay, setSelectedDay] = useState(() => selectedEvent?.startTime.slice(0, 10) || conventionDays[0].date)
  const events = useMemo(() => getEventsForDay(selectedDay), [getEventsForDay, selectedDay])
  const activeDay = conventionDays.find(d => d.date === selectedDay)

  useEffect(() => {
    if (selectedEvent) {
      setSelectedDay(selectedEvent.startTime.slice(0, 10))
    }
  }, [selectedEvent])

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h1 className="page-title">
          <Calendar className="page-title-icon" size={32} />
          Master Schedule
        </h1>
        <p className="page-subtitle">{appConfig.themeName} — {appConfig.appTitle}</p>
      </div>

      <div className="schedule-day-tabs" role="tablist" aria-label="Convention days">
        {conventionDays.map(day => (
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
                <button
                  type="button"
                  className="event-card-open"
                  onClick={() => navigate(`/schedule/${event.id}`)}
                  aria-label={`Open details for ${event.name}`}
                >
                  <EventCardContent event={event} speakers={speakers} />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {selectedEvent && <EventDetail event={selectedEvent} speakers={speakers} onClose={() => navigate('/schedule')} />}
    </div>
  )
}

const EventCardContent = ({ event, speakers }) => {
  const eventSpeakers = getEventSpeakerTags(event, speakers)

  return (
    <>
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
          {eventSpeakers.map(speaker => (
            <span key={speaker.id} className="event-meta-item speaker-tag"><User size={13} aria-hidden="true" /> Speaker: {speaker.name}</span>
          ))}
        </div>
      </div>
    </>
  )
}

const EventDetail = ({ event, speakers, onClose }) => {
  const eventSpeakers = getEventSpeakerTags(event, speakers)

  return (
    <div className="event-detail-overlay" role="dialog" aria-modal="true" aria-labelledby="event-detail-title" onClick={onClose}>
      <article className="event-detail-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="event-detail-close" onClick={onClose} aria-label="Close event details">
          <X size={22} />
        </button>

        <p className="area-kicker">{formatDay(event.startTime)}</p>
        <h2 id="event-detail-title">{event.name}</h2>
        <p className="event-detail-time">{formatTime(event.startTime)} – {formatTime(event.endTime)}</p>
        <p className="event-detail-description">{event.description}</p>

        <div className="event-detail-grid">
          {event.room && <span><MapPin size={16} aria-hidden="true" /> {event.room}</span>}
          {event.dressCode && <span><Shirt size={16} aria-hidden="true" /> {event.dressCode}</span>}
          {event.presenter && <span><User size={16} aria-hidden="true" /> {event.presenter}</span>}
        </div>

        {eventSpeakers.length > 0 && (
          <section className="event-detail-speakers" aria-label="Tagged speakers">
            <h3>Speaker Tags</h3>
            <div className="speaker-tag-list">
              {eventSpeakers.map(speaker => (
                <Link key={speaker.id} className="speaker-detail-tag" to="/speakers">
                  {speaker.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {event.notes && <p className="event-detail-note">{event.notes}</p>}
      </article>
    </div>
  )
}

export default Schedule
