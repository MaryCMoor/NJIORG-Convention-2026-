import { Link } from 'react-router-dom'
import {
  Calendar,
  Camera,
  Megaphone,
  MapPin,
  Users,
  Utensils,
  Home as HomeIcon,
  BookOpen,
  Award,
  FileText,
  ClipboardList,
  BarChart3,
  Shield,
  Heart,
  Sparkles,
  ChevronRight,
  UserRound,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import './Home.css'

const commonTiles = [
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
    icon: Heart,
    tone: 'gold',
  },
  {
    title: 'Speaker List',
    subtitle: 'Guests, officers, presenters',
    to: '/speakers',
    icon: UserRound,
    tone: 'purple',
  },
  {
    title: 'Photo Gallery',
    subtitle: 'Convention memories',
    to: '/gallery',
    icon: Camera,
    tone: 'blue',
  },
]

const roleTiles = {
  attendee: [
    ...commonTiles,
    { title: 'My Convention', subtitle: 'Favorites and check-in', to: '/my-convention', icon: Sparkles, tone: 'gold' },
    { title: 'Maps', subtitle: 'Rooms and directions', to: '/maps', icon: MapPin, tone: 'green' },
    { title: 'Meals', subtitle: 'Menus and meal times', to: '/meals', icon: Utensils, tone: 'red' },
    { title: 'Awards', subtitle: 'Recognition and honors', to: '/awards', icon: Award, tone: 'purple' },
  ],
  grand_officer: [
    ...commonTiles,
    { title: 'Committees', subtitle: 'Teams and assignments', to: '/committees', icon: Users, tone: 'red' },
    { title: 'Program Book', subtitle: 'Ceremonies and details', to: '/program-book', icon: BookOpen, tone: 'gold' },
    { title: 'Announcements', subtitle: 'Officer updates', to: '/announcements', icon: Megaphone, tone: 'blue' },
    { title: 'Documents', subtitle: 'Forms and resources', to: '/documents', icon: FileText, tone: 'purple' },
  ],
  advisor: [
    ...commonTiles,
    { title: 'Housing', subtitle: 'Room assignments', to: '/housing', icon: HomeIcon, tone: 'blue' },
    { title: 'Meals', subtitle: 'Dietary and seating', to: '/meals', icon: Utensils, tone: 'gold' },
    { title: 'Announcements', subtitle: 'Important updates', to: '/announcements', icon: Megaphone, tone: 'red' },
    { title: 'Directory', subtitle: 'Assemblies and contacts', to: '/directory', icon: Users, tone: 'purple' },
  ],
  administrator: [
    ...commonTiles,
    { title: 'Admin Portal', subtitle: 'Manage the convention', to: '/admin/IORG-2026-ADMIN', icon: Shield, tone: 'red' },
    { title: 'Reports', subtitle: 'Analytics and exports', to: '/reports', icon: BarChart3, tone: 'blue' },
    { title: 'Registration', subtitle: 'Attendee check-in', to: '/registration', icon: ClipboardList, tone: 'gold' },
    { title: 'Documents', subtitle: 'Files and forms', to: '/documents', icon: FileText, tone: 'purple' },
  ],
}

const Home = () => {
  const { selectedRole, clearRole } = useApp()
  const tiles = roleTiles[selectedRole] || roleTiles.attendee

  return (
    <div className="mobile-home-page icon-only-home">
      <header className="home-welcome" aria-labelledby="home-title">
        <div>
          <span className="home-kicker">2026 Rainbow Grand Assembly Convention</span>
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
