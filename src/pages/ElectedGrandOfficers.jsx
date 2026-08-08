import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Users, Crown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { loadElectedOfficersFromGoogleSheet } from '../utils/appsScriptApi'
import './AppArea.css'

const getDirectImageUrl = (url) => {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('drive.google.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean)
      const fileIndex = parts.indexOf('d')
      const id = fileIndex >= 0 ? parts[fileIndex + 1] : parsed.searchParams.get('id')
      return id ? `https://lh3.googleusercontent.com/d/${id}` : url
    }
    return url
  } catch {
    return url
  }
}

const ElectedGrandOfficers = () => {
  const { appConfig } = useApp()
  const navigate = useNavigate()
  
  const [isLoading, setIsLoading] = useState(true)
  const [electedOfficers, setElectedOfficers] = useState([])

  // Load elected officers from dedicated sheet
  useEffect(() => {
    const loadOfficers = async () => {
      try {
        const officers = await loadElectedOfficersFromGoogleSheet();
        setElectedOfficers(officers);
      } catch (error) {
        console.error('Failed to load elected officers:', error);
        setElectedOfficers([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadOfficers();
  }, [])

  // If loading show loading state
  if (isLoading) {
    return (
      <div className="app-area-page elected-grand-officers-page">
        <section className="app-area-hero compact-hero">
          <span className="area-icon"><Crown size={34} /></span>
          <p className="area-kicker">2026-2027</p>
          <h1>Elected Grand Officers</h1>
          <p>Loading...</p>
        </section>
      </div>
    )
  }

  return (
    <div className="app-area-page elected-grand-officers-page">
      <section className="app-area-hero compact-hero">
        <span className="area-icon"><Crown size={34} /></span>
        <p className="area-kicker">2026-2027</p>
        <h1>Elected Grand Officers</h1>
        <p>Meet the newly elected Grand Officers who will lead NJ Rainbow for the 2026-2027 term.</p>
      </section>

      <ElectedOfficersGrid officers={electedOfficers} isPreview={false} />
    </div>
  )
}

const ElectedOfficersGrid = ({ officers, isPreview }) => {
  if (!officers || officers.length === 0) {
    return (
      <section className="people-directory" aria-labelledby="people-directory-title">
        <div className="people-directory-header">
          <h2 id="people-directory-title"><Users size={22} /> Elected Grand Officers</h2>
          <p>No Elected Grand Officers have been added yet. Admins can add them in the <strong>Elected Grand Officers</strong> admin section.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="people-directory" aria-labelledby="people-directory-title">
      <div className="people-directory-header">
        <h2 id="people-directory-title"><Users size={22} /> Elected Grand Officers</h2>
        <p>{officers.length} officer{officers.length !== 1 ? 's' : ''} elected for the 2026-2027 term</p>
      </div>

      <div className="people-grid elected-officers-grid">
        {officers.map((officer, index) => (
          <ElectedOfficerCard key={officer.id} officer={officer} index={index} isPreview={isPreview} />
        ))}
      </div>
    </section>
  )
}

const ElectedOfficerCard = ({ officer, index, isPreview }) => (
  <article className="person-card elected-officer-card" style={{ animationDelay: `${index * 100}ms` }}>
    <div className="person-photo elected-photo" aria-hidden="true">
      {officer.photo ? (
        <img src={getDirectImageUrl(officer.photo)} alt="" loading="lazy" />
      ) : (
        <>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginBottom: '8px'}}>
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
    <div className="person-card-copy elected-copy">
      <h3>{officer.name}</h3>
      <p className="officer-position">{officer.station || officer.position || 'Grand Officer'}</p>
      {officer.assembly && <p className="officer-assembly">{officer.assembly}</p>}
    </div>
  </article>
)

export default ElectedGrandOfficers