import { CalendarDays, Facebook, Globe, Hash, Instagram, Mail, MapPin, Music2, Palette } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './EventInfo.css'

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const EventInfo = () => {
  const { appConfig } = useApp()
  const venueLines = [
    appConfig.venueName,
    appConfig.venueAddress,
    [appConfig.venueCity, appConfig.venueState, appConfig.venueZip].filter(Boolean).join(' '),
  ].filter(Boolean)
  const contactLines = [appConfig.contactLine1, appConfig.contactLine2].filter(Boolean)
  const socialLinks = [
    { label: 'Website', url: appConfig.websiteUrl, icon: Globe },
    { label: 'Facebook', url: appConfig.facebookUrl, icon: Facebook },
    { label: 'Instagram', url: appConfig.instagramUrl, icon: Instagram },
    { label: 'TikTok', url: appConfig.tiktokUrl, icon: Music2 },
  ].filter(item => item.url)

  return (
    <div className="event-info-page">
      <div className="page-header event-info-header">
        {appConfig.iconUrl ? (
          <img className="event-info-logo" src={appConfig.iconUrl} alt="Convention logo" />
        ) : (
          <span className="event-info-logo placeholder"><Palette size={30} /></span>
        )}
        <div>
          <h1 className="page-title">{appConfig.appTitle}</h1>
          <p className="page-subtitle">{appConfig.themeName}</p>
        </div>
      </div>

      <div className="event-info-grid">
        <section className="event-info-card">
          <span className="info-card-icon"><CalendarDays size={22} /></span>
          <div>
            <h2>Event Dates</h2>
            <p>{formatDate(appConfig.startDate)}{appConfig.endDate ? ` – ${formatDate(appConfig.endDate)}` : ''}</p>
            <span>{appConfig.numberOfDays || 3} day event</span>
          </div>
        </section>

        <section className="event-info-card">
          <span className="info-card-icon"><MapPin size={22} /></span>
          <div>
            <h2>Venue</h2>
            {venueLines.length > 0 ? (
              venueLines.map(line => <p key={line}>{line}</p>)
            ) : (
              <p>Venue details coming soon.</p>
            )}
          </div>
        </section>

        <section className="event-info-card">
          <span className="info-card-icon"><Mail size={22} /></span>
          <div>
            <h2>Contact</h2>
            {contactLines.length > 0 ? (
              contactLines.map(line => <p key={line}>{line}</p>)
            ) : (
              <p>Contact information coming soon.</p>
            )}
          </div>
        </section>

        <section className="event-info-card">
          <span className="info-card-icon"><Globe size={22} /></span>
          <div>
            <h2>Social & Links</h2>
            {socialLinks.length > 0 || appConfig.hashtag ? (
              <div className="event-social-links">
                {socialLinks.map(item => {
                  const Icon = item.icon
                  return (
                    <a key={item.label} href={item.url} target="_blank" rel="noreferrer">
                      <Icon size={16} />
                      {item.label}
                    </a>
                  )
                })}
                {appConfig.hashtag && <span><Hash size={16} />{appConfig.hashtag}</span>}
              </div>
            ) : (
              <p>Social links coming soon.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default EventInfo
