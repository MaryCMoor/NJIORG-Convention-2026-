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

const roleLabels = {
  attendee: 'Rainbow Girl',
  grand_officer: 'Grand Officer',
  demolay: 'DeMolay',
  mason: 'Mason',
  eastern_star: 'Eastern Star',
  out_of_state: 'Out of State',
  advisor: 'Advisor',
  mother_advisor: 'Mother Advisor',
  adult_grand_executive_committee: 'Adult Grand Executive Committee',
  grand_majority_committee: 'Grand Majority Committee',
  parent_guardian: 'Parent/ Guardian',
  pledge: 'Pledge',
  other: 'Other',
  administrator: 'Administrator',
}

const splitRequiredRoles = (requiredRole) => String(requiredRole || '')
  .split(',')
  .map(role => role.trim())
  .filter(Boolean)

const isRequiredForSelectedRole = (event, selectedRole) => {
  const selectedRoleLabel = roleLabels[selectedRole] || selectedRole
  const requiredRoles = splitRequiredRoles(event.requiredRole)

  if (!requiredRoles.length || !selectedRoleLabel) return false
  return requiredRoles.includes('All Roles') || requiredRoles.includes(selectedRoleLabel)
}

const getEventKey = (event) => event?.eventId || event?.id

const Schedule = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { getEventsForDay, sheetData, appConfig, selectedRole } = useApp()
  const conventionDays = useMemo(() => buildConventionDays(appConfig.startDate, appConfig.numberOfDays), [appConfig.startDate, appConfig.numberOfDays])
  const sourceEvents = useMemo(() => sheetData.events, [sheetData.events])
  const speakers = sheetData.speakers.length ? sheetData.speakers : undefined
  const selectedEvent = useMemo(() => sourceEvents.find(event => event.id === eventId), [sourceEvents, eventId])
  const [selectedDay, setSelectedDay] = useState(() => selectedEvent?.startTime.slice(0, 10) || conventionDays[0].date)
  const events = useMemo(() => getEventsForDay(selectedDay), [getEventsForDay, selectedDay])
  const activeDay = conventionDays.find(d => d.date === selectedDay)

  const eventsById = useMemo(() => {
    const map = new Map()
    events.forEach(event => {
      map.set(event.id, event)
      if (event.eventId) map.set(event.eventId, event)
    })
    return map
  }, [events])

  const childEventsByParent = useMemo(() => {
    const map = new Map()
    events.forEach(event => {
      if (!event.parentEventId) return
      const children = map.get(event.parentEventId) || []
      children.push(event)
      map.set(event.parentEventId, children)
    })
    return map
  }, [events])

  const topLevelEvents = useMemo(() => {
    return events.filter(event => !event.parentEventId || !eventsById.has(event.parentEventId))
  }, [events, eventsById])

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
            {topLevelEvents.map(event => {
              const requiredForUser = isRequiredForSelectedRole(event, selectedRole)
              const childEvents = childEventsByParent.get(getEventKey(event)) || []

              return (
                <li key={event.id} className="event-group">
                  <div className={`event-card ${requiredForUser ? 'required-event-card' : ''}`}>
                    <button
                      type="button"
                      className="event-card-open"
                      onClick={() => navigate(`/schedule/${event.id}`)}
                      aria-label={`Open details for ${event.name}`}
                    >
                      <EventCardContent event={event} speakers={speakers} selectedRole={selectedRole} />
                    </button>
                  </div>

                  {childEvents.length > 0 && (
                    <ol className="sub-event-list" aria-label={`Sub-events for ${event.name}`}>
                      {childEvents.map(childEvent => {
                        const childRequiredForUser = isRequiredForSelectedRole(childEvent, selectedRole)
                        return (
                          <li key={childEvent.id} className={`event-card sub-event-card ${childRequiredForUser ? 'required-event-card' : ''}`}>
                            <button
                              type="button"
                              className="event-card-open"
                              onClick={() => navigate(`/schedule/${childEvent.id}`)}
                              aria-label={`Open details for ${childEvent.name}`}
                            >
                              <EventCardContent event={childEvent} speakers={speakers} selectedRole={selectedRole} isSubEvent />
                            </button>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {selectedEvent && <EventDetail event={selectedEvent} speakers={speakers} selectedRole={selectedRole} onClose={() => navigate('/schedule')} />}
    </div>
  )
}

const EventCardContent = ({ event, speakers, selectedRole, isSubEvent = false }) => {
  const eventSpeakers = getEventSpeakerTags(event, speakers)
  const requiredForUser = isRequiredForSelectedRole(event, selectedRole)
  const hasOwnTime = Boolean(event.time)

  return (
    <>
      <div className="event-time">
        <Clock size={14} aria-hidden="true" />
        {isSubEvent && !hasOwnTime ? (
          <span>Sub-event</span>
        ) : (
          <>
            <span>{formatTime(event.startTime)}</span>
            <span className="event-time-end">– {formatTime(event.endTime)}</span>
          </>
        )}
      </div>
      <div className="event-body">
        {isSubEvent && <span className="sub-event-label">Part of larger event</span>}
        <h3 className="event-name">{event.name}</h3>
        {requiredForUser && <span className="required-user-badge">Required for you</span>}
        <p className="event-description">{event.description}</p>
        <EventRequirements event={event} />
        <div className="event-meta">
          {event.room && (
            <span className="event-meta-item"><MapPin size={13} aria-hidden="true" /> {event.room}</span>
          )}
          {event.dressCode && (
            <span className="event-meta-item"><Shirt size={13} aria-hidden="true" /> {event.dressCode}</span>
          )}
          {event.mensDressCode && (
            <span className="event-meta-item"><Shirt size={13} aria-hidden="true" /> Men: {event.mensDressCode}</span>
          )}
          {event.requiredRole && (
            <span className={`event-meta-item ${requiredForUser ? 'required-for-user' : ''}`}><User size={13} aria-hidden="true" /> Required: {event.requiredRole}</span>
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

const EventRequirements = ({ event }) => {
  const hasRequirements = event.requiredRole || event.dressCode || event.mensDressCode
  if (!hasRequirements) return null

  return (
    <div className="event-requirements" aria-label="Event requirements">
      {event.requiredRole && <span><strong>Required:</strong> {event.requiredRole}</span>}
      {event.dressCode && <span><strong>Dress code:</strong> {event.dressCode}</span>}
      {event.mensDressCode && <span><strong>Men:</strong> {event.mensDressCode}</span>}
    </div>
  )
}

const EventDetail = ({ event, speakers, selectedRole, onClose }) => {
  const eventSpeakers = getEventSpeakerTags(event, speakers)
  const requiredForUser = isRequiredForSelectedRole(event, selectedRole)
  const hasOwnTime = Boolean(event.time)

  return (
    <div className="event-detail-overlay" role="dialog" aria-modal="true" aria-labelledby="event-detail-title" onClick={onClose}>
      <article className="event-detail-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="event-detail-close" onClick={onClose} aria-label="Close event details">
          <X size={22} />
        </button>

        <p className="area-kicker">{formatDay(event.startTime)}</p>
        <h2 id="event-detail-title">{event.name}</h2>
        {event.parentEventId && <span className="sub-event-label detail">Sub-event</span>}
        {requiredForUser && <span className="required-user-badge detail">Required for you</span>}
        <p className="event-detail-time">
          {event.parentEventId && !hasOwnTime ? 'Part of parent event time' : `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`}
        </p>
        <p className="event-detail-description">{event.description}</p>

        <div className="event-detail-grid">
          {event.room && <span><MapPin size={16} aria-hidden="true" /> {event.room}</span>}
          {event.dressCode && <span><Shirt size={16} aria-hidden="true" /> {event.dressCode}</span>}
          {event.mensDressCode && <span><Shirt size={16} aria-hidden="true" /> Men: {event.mensDressCode}</span>}
          {event.requiredRole && <span className={requiredForUser ? 'required-for-user' : ''}><User size={16} aria-hidden="true" /> Required: {event.requiredRole}</span>}
          {event.presenter && <span><User size={16} aria-hidden="true" /> {event.presenter}</span>}
        </div>

        {eventSpeakers.length > 0 && (
          <section className="event-detail-speakers" aria-label="Tagged speakers">
            <h3>Speakers</h3>
            <div className="event-speaker-list">
              {eventSpeakers.map(speaker => (
                <Link key={speaker.id} className="event-speaker-card" to="/speakers">
                  {speaker.photo ? (
                    <span className="event-speaker-photo"><img src={speaker.photo} alt={speaker.name} /></span>
                  ) : (
                    <span className="event-speaker-photo fallback"><User size={18} aria-hidden="true" /></span>
                  )}
                  <span>
                    <strong>{speaker.name}</strong>
                    {speaker.title && <small>{speaker.title}</small>}
                  </span>
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
