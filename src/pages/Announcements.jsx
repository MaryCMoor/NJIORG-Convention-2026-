import { useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Info,
  Search,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import '../components/ui/UIComponents.css'
import './Announcements.css'

const isActiveAnnouncement = (announcement) => {
  if ((announcement.status || 'active') !== 'active') return false
  if (!announcement.displayUntil) return true
  const end = new Date(announcement.displayUntil)
  return Number.isNaN(end.getTime()) || end >= new Date()
}

const normalizeAnnouncement = (announcement) => ({
  ...announcement,
  body: announcement.body || announcement.message || '',
  type: (announcement.type || 'info').toLowerCase(),
  createdAt: announcement.timestamp || announcement.date || new Date().toISOString(),
})

const Announcements = () => {
  const { sheetData } = useApp()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const announcements = useMemo(() => (
    sheetData.notifications
      .map(normalizeAnnouncement)
      .filter(isActiveAnnouncement)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  ), [sheetData.notifications])

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase()
    return announcements.filter(announcement => {
      const matchesType = filter === 'all' || announcement.type === filter
      const matchesSearch = !query || [announcement.title, announcement.body, announcement.type]
        .some(value => String(value || '').toLowerCase().includes(query))
      return matchesType && matchesSearch
    })
  }, [announcements, filter, search])

  const typeCounts = useMemo(() => {
    return announcements.reduce((counts, announcement) => {
      counts[announcement.type] = (counts[announcement.type] || 0) + 1
      return counts
    }, {})
  }, [announcements])

  const types = [
    { value: 'all', label: 'All', icon: Bell, count: announcements.length },
    { value: 'general', label: 'General', icon: Info, count: typeCounts.general || 0 },
    { value: 'warning', label: 'Important', icon: AlertTriangle, count: typeCounts.warning || 0 },
    { value: 'info', label: 'Info', icon: Info, count: typeCounts.info || 0 },
    { value: 'emergency', label: 'Emergency', icon: AlertCircle, count: typeCounts.emergency || 0 },
  ]

  const emergencyCount = filteredAnnouncements.filter(announcement => announcement.type === 'emergency').length

  return (
    <div className="announcements-page">
      <div className="page-header">
        <h1 className="page-title">
          <Bell className="page-title-icon" size={32} />
          Announcements
        </h1>
        <p className="page-subtitle">Updates pulled directly from the Google Sheet Notifications tab</p>
      </div>

      <div className="filter-bar">
        <div className="filter-types">
          {types.map(type => {
            const Icon = type.icon
            return (
              <button
                key={type.value}
                className={`filter-type-btn ${filter === type.value ? 'active' : ''}`}
                onClick={() => setFilter(type.value)}
                type="button"
              >
                <Icon size={16} />
                <span>{type.label}</span>
                {type.count > 0 && <span className="filter-count">{type.count}</span>}
              </button>
            )
          })}
        </div>
        <div className="filter-search">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {emergencyCount > 0 && (
        <div className="emergency-banner">
          <AlertCircle size={24} />
          <div className="emergency-content">
            <strong>Emergency Notice Active</strong>
            <p>{emergencyCount} emergency announcement{emergencyCount !== 1 ? 's' : ''} need immediate review.</p>
          </div>
        </div>
      )}

      <div className="announcements-list">
        {filteredAnnouncements.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">No Announcements</h3>
            <p className="empty-state-message">Announcements from the Notifications sheet will appear here.</p>
          </div>
        ) : (
          filteredAnnouncements.map(announcement => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))
        )}
      </div>
    </div>
  )
}

const AnnouncementCard = ({ announcement }) => {
  const [expanded, setExpanded] = useState(false)
  const body = announcement.body || announcement.message || ''
  const showFull = body.length > 200

  const typeIcons = {
    general: <Info size={16} />,
    warning: <AlertTriangle size={16} />,
    info: <Info size={16} />,
    emergency: <AlertCircle size={16} />,
  }

  return (
    <article className={`announcement-card ${announcement.type}`}>
      <div className="announcement-header">
        <div className="announcement-type-badge">
          {typeIcons[announcement.type] || typeIcons.info}
          <span>{announcement.type.replace('_', ' ')}</span>
        </div>
        <div className="announcement-meta">
          <span className="announcement-time">{new Date(announcement.createdAt).toLocaleString()}</span>
          {announcement.displayUntil && <span className="announcement-role">Shows until {new Date(announcement.displayUntil).toLocaleString()}</span>}
        </div>
      </div>

      <h3 className="announcement-title">{announcement.title}</h3>

      <div className="announcement-body">
        {showFull && !expanded ? (
          <>
            <p className="announcement-preview">{body.substring(0, 200)}...</p>
            <button className="read-more-btn" onClick={() => setExpanded(true)} type="button">
              Read more
            </button>
          </>
        ) : (
          <p>{body}</p>
        )}
        {expanded && showFull && (
          <button className="read-less-btn" onClick={() => setExpanded(false)} type="button">
            Show less
          </button>
        )}
      </div>
    </article>
  )
}

export default Announcements
