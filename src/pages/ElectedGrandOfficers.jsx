import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Users, Crown, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAdmin } from '../context/AdminContext'
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
  const { sheetData, appConfig } = useApp()
  const { config: adminConfig } = useAdmin()
  const navigate = useNavigate()
  
  // Check if the page should be visible
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check visibility from admin config
    const checkVisibility = () => {
      // First check if admin config has the visibility flag
      if (adminConfig && typeof adminConfig.showElectedGrandOfficers === 'boolean') {
        setIsVisible(adminConfig.showElectedGrandOfficers)
      }
      // Fallback to appConfig if available
      else if (appConfig && typeof appConfig.showElectedGrandOfficers === 'boolean') {
        setIsVisible(appConfig.showElectedGrandOfficers)
      } else {
        setIsVisible(false)
      }
      setIsLoading(false)
    }
    checkVisibility()
  }, [adminConfig, appConfig])

  // Filter only Elected Grand Officers from members
  const electedOfficers = sheetData.members?.filter(member => 
    member.category === 'Elected Grand Officers'
  ) || []

  // If not visible and not admin, redirect to home
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

  if (!isVisible) {
    // If admin, show preview message
    const { selectedRole, adminUnlocked } = useApp()
    if (selectedRole === 'administrator' && adminUnlocked) {
      return (
        <div className="app-area-page elected-grand-officers-page">
          <section className="app-area-hero compact-hero">
            <span className="area-icon"><Crown size={34} /></span>
            <p className="area-kicker">2026-2027</p>
            <h1>Elected Grand Officers</h1>
            <p>This page is currently <strong>hidden</strong> from the public.</p>
            <p>Use the <strong>Preview</strong> button in Admin Settings to view this page, or enable <strong>Show Elected Grand Officers</strong> to make it public.</p>
            <div className="preview-notice">
              <Eye size={24} />
              <span>Admin Preview Mode - Public cannot see this page</span>
            </div>
          </section>
          
          {/* Still show the content for admin preview */}
          <ElectedOfficersGrid officers={electedOfficers} isPreview={true} />
        </div>
      )
    }
    // Redirect non-admin users
    navigate('/')
    return null
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
          <p>No Elected Grand Officers have been added yet. Admins can add them in the <strong>Meet NJ Rainbow</strong> admin section with category "Elected Grand Officers".</p>
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