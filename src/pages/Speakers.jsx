import { Award, Crown, Mic, Sparkles, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { conventionSpeakers, getSpeakerScheduleTags } from '../data/speakerSchedule'
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

const Speakers = () => {
  const { state } = useApp()

  return (
    <div className="app-area-page">
      <section className="app-area-hero">
        <span className="area-icon"><Mic size={34} /></span>
        <p className="area-kicker">Meet the voices of convention</p>
        <h1>Speaker List</h1>
        <p>Grand Officers, special guests, and presenters for the 2026 Rainbow Grand Assembly Convention.</p>
      </section>

      <section className="speaker-app-list" aria-label="Convention speakers">
        {conventionSpeakers.map(speaker => {
          const Icon = speakerIcons[speaker.icon] || Mic
          const scheduleTags = getSpeakerScheduleTags(state.events, speaker.id)

          return (
            <article className="speaker-app-card" key={speaker.id}>
              <span className="speaker-avatar"><Icon size={26} /></span>
              <div className="speaker-card-content">
                <h2>{speaker.name}</h2>
                <p className="speaker-role">{speaker.title}</p>
                <p>{speaker.detail}</p>

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
    </div>
  )
}

export default Speakers
