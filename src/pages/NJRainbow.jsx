import { Heart, MapPin, Sparkles, Users } from 'lucide-react'
import './AppArea.css'

const NJRainbow = () => {
  const cards = [
    { label: 'Assemblies', value: '12+', detail: 'Across New Jersey' },
    { label: 'Motto', value: 'Faith', detail: 'Hope & Charity' },
    { label: 'Flower', value: 'White Rose', detail: 'A symbol of service' },
    { label: 'Convention', value: '2026', detail: 'Grand Assembly' },
  ]

  return (
    <div className="app-area-page">
      <section className="app-area-hero">
        <span className="area-icon"><Heart size={34} /></span>
        <p className="area-kicker">Get to Know</p>
        <h1>NJ Rainbow</h1>
        <p>
          Learn about the spirit, traditions, and sisterhood of New Jersey Rainbow during the
          2026 Rainbow Grand Assembly Convention.
        </p>
      </section>

      <section className="area-card-grid" aria-label="NJ Rainbow highlights">
        {cards.map(card => (
          <article className="area-stat-card" key={card.label}>
            <strong>{card.value}</strong>
            <span>{card.label}</span>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="area-info-card">
        <h2><Sparkles size={22} /> What Rainbow Means</h2>
        <p>
          Rainbow teaches leadership, service, confidence, and friendship. Grand Assembly brings
          Rainbow Girls, officers, advisors, and supporters together for ceremonies, learning,
          celebration, and memories that last long after convention weekend.
        </p>
      </section>

      <section className="area-list-card">
        <h2><Users size={22} /> Explore at Convention</h2>
        <ul>
          <li>Meet Grand Officers and assemblies from around New Jersey.</li>
          <li>Attend ceremonies, workshops, meals, and themed events.</li>
          <li>Celebrate sisterhood through service, leadership, and fun.</li>
        </ul>
      </section>

      <section className="area-info-card compact">
        <h2><MapPin size={22} /> Need people or chapters?</h2>
        <p>Use the Directory square to browse attendees, officers, chapters, and guests.</p>
      </section>
    </div>
  )
}

export default NJRainbow
