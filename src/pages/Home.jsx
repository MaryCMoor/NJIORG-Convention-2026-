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

const roleCopy = {
  attendee: {
    eyebrow: 'Rainbow Girl View',
    title: 'Your Convention App',
    body: 'Tap a square to open each part of the 2026 Rainbow Grand Assembly Convention.',
  },
  grand_officer: {
    eyebrow: 'Grand Officer View',
    title: 'Officer Convention Hub',
    body: 'Quick access to the schedule, ceremonies, committees, speakers, and updates.',
  },
  advisor: {
    eyebrow: 'Advisor View',
    title: 'Advisor Convention Hub',
    body: 'Open the tools you need for safety, housing, meals, schedules, and communication.',
  },
  administrator: {
    eyebrow: 'Administrator View',
    title: 'Convention Control Center',
    body: 'Manage content, view reports, update convention areas, and support attendees.',
  },
}

const Home = () => {
  const { selectedRole, clearRole } = useApp()
  const tiles = roleTiles[selectedRole] || roleTiles.attendee
  const copy = roleCopy[selectedRole] || roleCopy.attendee

  return (
    <div className="mobile-home-page no-top-banner">
      <section className="app-tile-section" aria-labelledby="areas-title">
        <div className="app-section-heading compact-home-heading">
          <div>
            <p className="section-kicker">{copy.eyebrow}</p>
            <h1 id="areas-title">Convention Areas</h1>
            <p className="home-quick-copy">{copy.body}</p>
          </div>
          <button type="button" className="role-change-pill" onClick={clearRole}>Change Role</button>
        </div>

        <div className="app-tile-grid">
          {tiles.map(tile => (
            <AppTile key={`${tile.title}-${tile.to}`} tile={tile} />
          ))}
        </div>
      </section>
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
