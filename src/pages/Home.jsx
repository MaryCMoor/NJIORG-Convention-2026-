import { Link } from 'react-router-dom'
import {
  Calendar,
  Megaphone,
  Utensils,
  Award,
  Shield,
  Mic,
  ChevronRight,
  Compass,
  Images,
  Landmark,
  Info,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import './Home.css'

const baseTiles = [
  {
    title: 'Master Schedule',
    subtitle: 'Times, rooms, dress code',
    to: '/schedule',
    icon: Calendar,
    tone: 'red',
  },
  {
    title: 'Get to Know NJ Rainbow',
    subtitle: 'History, values, chapters',
    to: '/nj-rainbow',
    icon: Landmark,
    tone: 'gold',
  },
  {
    title: 'Speaker List',
    subtitle: 'Guests, officers, presenters',
    to: '/speakers',
    icon: Mic,
    tone: 'purple',
  },
  {
    title: 'Photo Gallery',
    subtitle: 'Convention memories',
    to: '/gallery',
    icon: Images,
    tone: 'blue',
  },
  { title: 'Announcements', subtitle: 'Important updates', to: '/announcements', icon: Megaphone, tone: 'red' },
  { title: 'Maps', subtitle: 'Rooms and directions', to: '/maps', icon: Compass, tone: 'green' },
  { title: 'Meals', subtitle: 'Menus and meal times', to: '/meals', icon: Utensils, tone: 'red' },
  { title: 'Awards', subtitle: 'Recognition and honors', to: '/awards', icon: Award, tone: 'purple' },
  { title: 'Event Info', subtitle: 'Venue, contacts, links', to: '/event-info', icon: Info, tone: 'gold' },
]

const roleTiles = {
  attendee: baseTiles,
  grand_officer: baseTiles,
  advisor: baseTiles,
  administrator: [
    ...baseTiles,
    { title: 'Admin Portal', subtitle: 'Manage the convention', to: '/admin/IORG-2026-ADMIN', icon: Shield, tone: 'red' },
  ],
}

const Home = () => {
  const { selectedRole, clearRole, appConfig } = useApp()
  const tiles = roleTiles[selectedRole] || roleTiles.attendee

  return (
    <div className="mobile-home-page icon-only-home">
      <header className="home-welcome" aria-labelledby="home-title">
        <div>
          <span className="home-kicker">{appConfig.appTitle}</span>
          <h1 id="home-title">Welcome to Convention</h1>
          <p>Tap a button below to quickly find what you need.</p>
        </div>
        <button type="button" className="home-role-reset" onClick={clearRole}>Change Role</button>
      </header>
      <div className="app-tile-grid" aria-label="Convention areas">
        {tiles.map(tile => (
          <AppTile key={`${tile.title}-${tile.to}`} tile={tile} />
        ))}
      </div>
    </div>
  )
}

const AppTile = ({ tile }) => {
  const Icon = tile.icon

  return (
    <Link className={`app-tile tone-${tile.tone}`} to={tile.to} aria-label={`Open ${tile.title}`}>
      <span className="tile-icon">
        <Icon size={30} />
      </span>
      <span className="tile-title">{tile.title}</span>
      <span className="tile-subtitle">{tile.subtitle}</span>
      <ChevronRight className="tile-arrow" size={18} aria-hidden="true" />
    </Link>
  )
}

export default Home
