import { useState, useEffect } from 'react'
import { Users, Crown, Eye } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { loadAppointedOfficersFromGoogleSheet } from '../utils/appsScriptApi'
import './AppArea.css'

const getDirectImageUrl = (url) => {
  if (!url) return ''

  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes('drive.google.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean)
      const fileIndex = parts.indexOf('d')
      const id =
        fileIndex >= 0
          ? parts[fileIndex + 1]
          : parsed.searchParams.get('id')

      return id
        ? `https://lh3.googleusercontent.com/d/${id}`
        : url
    }

    return url
  } catch {
    return url
  }
}

const AppointedGrandOfficers = () => {
  const { appConfig } = useApp()

  const [isLoading, setIsLoading] = useState(true)
  const [appointedOfficers, setAppointedOfficers] = useState([])

  // Load appointed officers from the dedicated Appointed Grand Officers sheet
  useEffect(() => {
    const loadOfficers = async () => {
      try {
        const officers =
          await loadAppointedOfficersFromGoogleSheet()

        setAppointedOfficers(officers)
      } catch (error) {
        console.error(
          'Failed to load appointed grand officers:',
          error
        )

        setAppointedOfficers([])
      } finally {
        setIsLoading(false)
      }
    }

    loadOfficers()
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="app-area-page appointed-grand-officers-page">
        <section className="app-area-hero compact-hero">
          <span className="area-icon">
            <Crown size={34} />
          </span>

          <p className="area-kicker">2026-2027</p>

          <h1>Appointed Grand Officers</h1>

          <p>Loading...</p>
        </section>
      </div>
    )
  }

  return (
    <div className="app-area-page appointed-grand-officers-page">
      <section className="app-area-hero compact-hero">
        <span className="area-icon">
          <Crown size={34} />
        </span>

        <p className="area-kicker">2026-2027</p>

        <h1>Appointed Grand Officers</h1>

        <p>
          Meet the appointed Grand Officers who will serve NJ Rainbow
          for the 2026-2027 term.
        </p>
      </section>

      <AppointedOfficersGrid
        officers={appointedOfficers}
        isPreview={false}
      />
    </div>
  )
}

const AppointedOfficersGrid = ({ officers, isPreview }) => {
  if (!officers || officers.length === 0) {
    return (
      <section
        className="people-directory"
        aria-labelledby="people-directory-title"
      >
        <div className="people-directory-header">
          <h2 id="people-directory-title">
            <Users size={22} /> Appointed Grand Officers
          </h2>

          <p>
            No Appointed Grand Officers have been added yet. Admins
            can add them in the{' '}
            <strong>Appointed Grand Officers</strong> admin section.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      className="people-directory"
      aria-labelledby="people-directory-title"
    >
      <div className="people-directory-header">
        <h2 id="people-directory-title">
          <Users size={22} /> Appointed Grand Officers
        </h2>

        <p>
          {officers.length} officer
          {officers.length !== 1 ? 's' : ''} appointed for the
          2026-2027 term
        </p>
      </div>

      <div className="people-grid appointed-officers-grid">
        {officers.map((officer, index) => (
          <AppointedOfficerCard
            key={officer.id || `${officer.name}-${index}`}
            officer={officer}
            index={index}
            isPreview={isPreview}
          />
        ))}
      </div>
    </section>
  )
}

const AppointedOfficerCard = ({
  officer,
  index,
  isPreview,
}) => (
  <article
    className="person-card appointed-officer-card"
    style={{
      animationDelay: `${index * 100}ms`,
    }}
  >
    <div
      className="person-photo appointed-photo"
      aria-hidden="true"
    >
      {officer.photo ? (
        <img
          src={getDirectImageUrl(officer.photo)}
          alt={officer.name || 'Appointed Grand Officer'}
          loading="lazy"
        />
      ) : (
        <>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ marginBottom: '8px' }}
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>

          <span>Photo</span>
        </>
      )}

      {isPreview && (
        <div className="admin-preview-badge">
          <Eye size={14} />
          <span>Preview</span>
        </div>
      )}
    </div>

    <div className="person-card-copy appointed-copy">
      <h3>{officer.name}</h3>

      <p className="officer-position">
        {officer.station ||
          officer.position ||
          'Grand Officer'}
      </p>

      {officer.assembly && (
        <p className="officer-assembly">
          {officer.assembly}
        </p>
      )}
    </div>
  </article>
)

export default AppointedGrandOfficers
