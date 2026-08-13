import { Link } from 'react-router-dom'
import {
  Calendar,
  Megaphone,
  Shield,
  Mic,
  ChevronRight,
  Images,
  Landmark,
  Info,
  Hash,
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
    title: 'NJ Assemblies',
    subtitle: 'Assemblies, advisors, themes, photos',
    to: '/assemblies',
    icon: Landmark,
    tone: 'blue',
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
  {
    title: 'Social Wall',
    subtitle: 'Posts, hashtags, likes',
    to: '/social-wall',
    icon: Hash,
    tone: 'purple',
  },
  {
    title: 'Announcements',
    subtitle: 'Important updates',
    to: '/announcements',
    icon: Megaphone,
    tone: 'red',
  },
  {
    title: 'Event Info',
    subtitle: 'Venue, contacts, links',
    to: '/event-info',
    icon: Info,
    tone: 'gold',
  },
]

/*
 * These role IDs match the roles used by RoleGate.jsx.
 *
 * Keep these values in sync with the login role options.
 */
const roleTiles = {
  rainbow_girls: baseTiles,

  grand_officers: baseTiles,

  adult_grand_executive_committee: baseTiles,

  grand_staff: baseTiles,

  majority_executive_committee: baseTiles,

  mother_advisors_adult_advisors: baseTiles,

  pledge_mothers: baseTiles,

  pledge_girls: baseTiles,

  eastern_star: baseTiles,

  masons: baseTiles,

  demolay: baseTiles,

  other_masonic_organizations: baseTiles,

  out_of_state_guests: baseTiles,

  administrator: [
    ...baseTiles,
    {
      title: 'Admin Portal',
      subtitle: 'Manage the convention',
      to: '/admin/IORG-2026-ADMIN',
      icon: Shield,
      tone: 'red',
    },
  ],
}

/*
 * Determines whether an announcement should currently
 * count toward the notification bubble.
 *
 * An announcement is active when:
 * - Its status is "active"
 * - It has no displayUntil date, OR
 * - Its displayUntil date has not passed
 */
const isActiveAnnouncement = (announcement) => {
  if ((announcement.status || 'active') !== 'active') {
    return false
  }

  if (!announcement.displayUntil) {
    return true
  }

  const end = new Date(announcement.displayUntil)

  return (
    !Number.isNaN(end.getTime()) &&
    end >= new Date()
  )
}

const Home = () => {
  const {
    selectedRole,
    clearRole,
    appConfig,
    sheetData,
  } = useApp()

  /*
   * Use the selected role to determine which tiles
   * should appear.
   *
   * If an unexpected/old role is encountered,
   * fall back to the standard home tiles.
   */
  const tiles =
    roleTiles[selectedRole] || baseTiles

  /*
   * Count only announcements that are currently active.
   *
   * This uses the Notifications data already loaded
   * into AppContext from the Google Sheet.
   */
  const activeAnnouncementCount = (
    sheetData?.notifications || []
  ).filter(isActiveAnnouncement).length

  return (
    <div className="mobile-home-page icon-only-home">

      <header
        className="home-welcome"
        aria-labelledby="home-title"
      >
        <div>

          <span className="home-kicker">
            {appConfig.appTitle}
          </span>

          <h1 id="home-title">
            Welcome to Convention
          </h1>

          <p>
            Tap a button below to quickly find what you need.
          </p>

        </div>

        <button
          type="button"
          className="home-role-reset"
          onClick={clearRole}
        >
          Change Role
        </button>

      </header>

      <div
        className="app-tile-grid"
        aria-label="Convention areas"
      >

        {tiles.map(tile => (

          <AppTile
            key={`${tile.title}-${tile.to}`}
            tile={tile}
            announcementCount={
              tile.to === '/announcements'
                ? activeAnnouncementCount
                : 0
            }
          />

        ))}

      </div>

    </div>
  )
}

const AppTile = ({
  tile,
  announcementCount = 0,
}) => {

  const Icon = tile.icon

  /*
   * Only show the bubble on the Announcements tile
   * AND only when there is at least one active announcement.
   */
  const hasAnnouncementCount =
    tile.to === '/announcements' &&
    announcementCount > 0

  return (

    <Link
      className={`app-tile tone-${tile.tone}`}
      to={tile.to}
      aria-label={
        tile.to === '/announcements' &&
        announcementCount > 0
          ? `Open ${tile.title}. ${announcementCount} active announcement${
              announcementCount === 1 ? '' : 's'
            }.`
          : `Open ${tile.title}`
      }
    >

      <span className="tile-icon">

        <Icon size={30} />

        {hasAnnouncementCount && (

          <span
            className="announcement-count-badge"
            aria-hidden="true"
          >
            {announcementCount > 99
              ? '99+'
              : announcementCount}
          </span>

        )}

      </span>

      <span className="tile-title">
        {tile.title}
      </span>

      <span className="tile-subtitle">
        {tile.subtitle}
      </span>

      <ChevronRight
        className="tile-arrow"
        size={18}
        aria-hidden="true"
      />

    </Link>

  )
}

export default Home
