import { Award, Crown, Mic, Sparkles, Star } from 'lucide-react'
import './AppArea.css'

const speakers = [
  {
    name: 'Madison Rose Caldwell',
    title: 'Grand Worthy Advisor',
    detail: 'Leadership, service, and the future of Rainbow.',
    icon: Crown,
  },
  {
    name: 'Mrs. Eleanor Whitmore',
    title: 'Supreme Inspector',
    detail: 'Guidance and inspiration for Grand Assembly.',
    icon: Star,
  },
  {
    name: 'Victoria Chen',
    title: 'Grand Worthy Associate Advisor',
    detail: 'Sisterhood, mentorship, and convention memories.',
    icon: Award,
  },
  {
    name: 'Mrs. Patricia Montgomery',
    title: 'Supreme Deputy',
    detail: 'Rainbow values and lifelong leadership.',
    icon: Sparkles,
  },
]

const Speakers = () => {
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
          const Icon = speaker.icon
          return (
            <article className="speaker-app-card" key={speaker.name}>
              <span className="speaker-avatar"><Icon size={26} /></span>
              <div>
                <h2>{speaker.name}</h2>
                <p className="speaker-role">{speaker.title}</p>
                <p>{speaker.detail}</p>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

export default Speakers
