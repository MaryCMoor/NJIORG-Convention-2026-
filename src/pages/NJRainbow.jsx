import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, UserRound, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './AppArea.css'

const tabOrder = ['Grand Officers', 'Mother Advisors', 'Adult Grand Executive Committee', 'Majority Committee']

const buildPeopleTabs = (members) => {
  return tabOrder.map(label => {
    const people = members
      .filter(member => member.category === label)
      .map(member => ({
        ...member,
        group: label,
      }))

    return {
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      label,
      description: getTabDescription(label),
      people,
    }
  }).filter(tab => tab.people.length > 0)
}

const getTabDescription = (label) => {
  const descriptions = {
    'Grand Officers': 'Meet the Grand Officers leading the 2026 Rainbow Grand Assembly Convention.',
    'Mother Advisors': 'Adult leaders and advisors supporting assemblies and helping guide the convention experience.',
    'Adult Grand Executive Committee': 'The adult executive team helping oversee planning, tradition, safety, and convention operations.',
    'Majority Committee': 'Majority members staying connected, supporting current members, and celebrating lifelong Rainbow sisterhood.',
  }
  return descriptions[label] || 'Meet the Rainbow leaders supporting convention.'
}

const NJRainbow = () => {
  const { personId } = useParams()
  const { sheetData } = useApp()
  const peopleTabs = buildPeopleTabs(sheetData.members)
  const allPeople = peopleTabs.flatMap(tab => tab.people.map(person => ({ ...person, group: person.group || tab.label })))

  if (personId) {
    const person = allPeople.find(item => item.id === personId)
    return <PersonBio person={person} />
  }

  return (
    <div className="app-area-page nj-rainbow-page">
      <section className="app-area-hero compact-hero">
        <span className="area-icon"><Heart size={34} /></span>
        <p className="area-kicker">Get to Know</p>
        <h1>NJ Rainbow</h1>
        <p>Tap a person to learn more about their role, story, and convention leadership.</p>
      </section>

      <PeopleTabs peopleTabs={peopleTabs} />

    </div>
  )
}

const PeopleTabs = ({ peopleTabs }) => {
  const safeTabs = peopleTabs
  const defaultTab = safeTabs[0]?.id || 'grand-officers'
  const [activeTab, setActiveTab] = useState(defaultTab)
  const tab = safeTabs.find(item => item.id === activeTab) || safeTabs[0]

  if (!safeTabs.length) {
    return (
      <section className="people-directory" aria-labelledby="people-directory-title">
        <div className="people-directory-header">
          <h2 id="people-directory-title"><Users size={22} /> Leadership Directory</h2>
          <p>No members are listed in the Google Sheet yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="people-directory" aria-labelledby="people-directory-title">
      <div className="people-directory-header">
        <h2 id="people-directory-title"><Users size={22} /> Leadership Directory</h2>
        <p>{tab.description}</p>
      </div>

      <div className="people-tabs" role="tablist" aria-label="NJ Rainbow leadership groups">
        {safeTabs.map(item => (
          <button
            key={item.id}
            id={`${item.id}-tab`}
            type="button"
            role="tab"
            aria-selected={activeTab === item.id}
            aria-controls={`${item.id}-panel`}
            className={`people-tab ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        id={`${tab.id}-panel`}
        className="people-grid"
        role="tabpanel"
        aria-labelledby={`${tab.id}-tab`}
      >
        {tab.people.map(person => (
          <PersonCard key={person.id} person={person} />
        ))}
      </div>
    </section>
  )
}

const PersonCard = ({ person }) => (
  <Link className="person-card" to={`/nj-rainbow/${person.id}`} aria-label={`Read bio for ${person.position}`}>
    <div className="person-photo" aria-hidden="true">
      {person.photo ? (
        <img src={person.photo} alt="" loading="lazy" />
      ) : (
        <>
          <UserRound size={42} />
          <span>Photo</span>
        </>
      )}
    </div>
    <div className="person-card-copy">
      <h3>{person.name}</h3>
      <p>{person.position}</p>
    </div>
  </Link>
)

const PersonBio = ({ person }) => {
  if (!person) {
    return (
      <div className="app-area-page nj-rainbow-page">
        <section className="area-info-card person-bio-card">
          <h1>Person not found</h1>
          <Link className="back-link" to="/nj-rainbow"><ArrowLeft size={18} /> Back to NJ Rainbow</Link>
        </section>
      </div>
    )
  }

  const embedVideoUrl = getEmbeddableVideoUrl(person.videoUrl)

  return (
    <div className="app-area-page nj-rainbow-page">
      <Link className="back-link" to="/nj-rainbow"><ArrowLeft size={18} /> Back to NJ Rainbow</Link>

      <article className="person-bio-card">
        <div className="person-bio-photo">
          {person.photo ? (
            <img src={person.photo} alt={person.name} />
          ) : (
            <>
              <UserRound size={68} />
              <span>Photo</span>
            </>
          )}
        </div>

        <div className="person-bio-content">
          <p className="area-kicker">{person.group}</p>
          <h1>{person.name}</h1>
          <p className="person-bio-position">{person.position}</p>
          {person.bio && <p>{person.bio}</p>}
          {person.assembly && <p className="person-bio-assembly">Assembly: {person.assembly}</p>}
          {person.videoUrl && (
            <section className="person-video-card" aria-label={`Video for ${person.name}`}>
              <h2>Video</h2>
              {embedVideoUrl ? (
                <div className="person-video-frame">
                  <iframe
                    src={embedVideoUrl}
                    title={`${person.name} video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a className="person-video-link" href={person.videoUrl} target="_blank" rel="noreferrer">Open video</a>
              )}
            </section>
          )}
        </div>
      </article>
    </div>
  )
}

const getEmbeddableVideoUrl = (url) => {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id ? `https://player.vimeo.com/video/${id}` : ''
    }
    if (parsed.hostname.includes('drive.google.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean)
      const fileIndex = parts.indexOf('d')
      const id = fileIndex >= 0 ? parts[fileIndex + 1] : ''
      return id ? `https://drive.google.com/file/d/${id}/preview` : ''
    }
    return ''
  } catch {
    return ''
  }
}

export default NJRainbow
