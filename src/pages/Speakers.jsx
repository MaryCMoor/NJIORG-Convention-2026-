import { useState } from 'react'
import { Award, Crown, Mic, Sparkles, Star, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getSpeakerEvents } from '../data/speakerSchedule'
import { useApp } from '../context/AppContext'
import './AppArea.css'

const speakerIcons = {
  crown: Crown,
  star: Star,
  award: Award,
  sparkles: Sparkles,
}

const formatScheduleTag = (event) => {
  const date = new Date(event.startTime)
  const day = date.toLocaleDateString('en-US', { weekday: 'short' })
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} ${time} · ${event.name}`
}

const SpeakerAvatar = ({ speaker, size = 54 }) => {
  const Icon = speakerIcons[speaker.icon] || Mic

  if (speaker.photo) {
    return (
      <span className="speaker-avatar has-photo" style={{ width: `${size}px`, height: `${size}px`, flexBasis: `${size}px` }}>
        <img src={speaker.photo} alt={speaker.name ? `${speaker.name}` : 'Speaker'} />
      </span>
    )
  }

  return (
    <span className="speaker-avatar" style={{ width: `${size}px`, height: `${size}px`, flexBasis: `${size}px` }}>
      <Icon size={Math.max(24, Math.round(size * 0.48))} />
    </span>
  )
}

const Speakers = () => {
  const { sheetData } = useApp()
  const speakers = sheetData.speakers
  const events = sheetData.events
  const [selectedSpeaker, setSelectedSpeaker] = useState(null)

  const selectedSpeakerEvents = selectedSpeaker ? getSpeakerEvents(events, selectedSpeaker) : []

  return (
    <div className="app-area-page">
      <section className="app-area-hero">
        <span className="area-icon"><Mic size={34} /></span>
        <p className="area-kicker">Meet the voices of convention</p>
        <h1>Speaker List</h1>
        <p>Grand Officers, special guests, and presenters for the 2026 Rainbow Grand Assembly Convention.</p>
      </section>

      <section className="speaker-app-list" aria-label="Convention speakers">
        {speakers.map(speaker => {
          const scheduleTags = getSpeakerEvents(events, speaker)

          return (
            <article className="speaker-app-card" key={speaker.id}>
              <SpeakerAvatar speaker={speaker} />
              <div className="speaker-card-content">
                <button type="button" className="speaker-name-button" onClick={() => setSelectedSpeaker(speaker)}>
                  {speaker.name}
                </button>
                <p className="speaker-role">{speaker.title}</p>
                {speaker.detail && <p>{speaker.detail}</p>}

                {scheduleTags.length > 0 && (
                  <div className="speaker-schedule-tags" aria-label={`Schedule tags for ${speaker.name}`}>
                    {scheduleTags.map(event => (
                      <Link key={event.id} className="speaker-schedule-tag" to={`/schedule/${event.id}`}>
                        {formatScheduleTag(event)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </section>

      {selectedSpeaker && (
        <div className="event-detail-overlay" role="dialog" aria-modal="true" aria-labelledby="speaker-detail-title" onClick={() => setSelectedSpeaker(null)}>
          <article className="event-detail-card speaker-detail-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="event-detail-close" onClick={() => setSelectedSpeaker(null)} aria-label="Close speaker details">
              <X size={22} />
            </button>
            <div className="speaker-detail-header">
              <SpeakerAvatar speaker={selectedSpeaker} size={96} />
              <div>
                <p className="area-kicker">Speaker</p>
                <h2 id="speaker-detail-title">{selectedSpeaker.name}</h2>
                {selectedSpeaker.title && <p className="speaker-role">{selectedSpeaker.title}</p>}
              </div>
            </div>

            {selectedSpeaker.bio && <p className="speaker-detail-bio">{selectedSpeaker.bio}</p>}

            <section className="event-detail-speakers" aria-label={`Events for ${selectedSpeaker.name}`}>
              <h3>Speaking Events</h3>
              {selectedSpeakerEvents.length > 0 ? (
                <div className="speaker-tag-list speaker-detail-events">
                  {selectedSpeakerEvents.map(event => (
                    <Link key={event.id} className="speaker-detail-tag" to={`/schedule/${event.id}`} onClick={() => setSelectedSpeaker(null)}>
                      {formatScheduleTag(event)}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="speaker-detail-empty">No speaking events are linked yet.</p>
              )}
            </section>
          </article>
        </div>
      )}
    </div>
  )
}

export default Speakers
