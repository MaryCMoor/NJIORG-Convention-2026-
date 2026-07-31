import { useState } from 'react'
import { Images, Landmark, Loader2, UserRound, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { loadAssemblyGalleryImages } from '../utils/appsScriptApi'
import './AppArea.css'

const NJAssemblies = () => {
  const { sheetData } = useApp()
  const assemblies = sheetData.assemblies || []
  const [galleryAssembly, setGalleryAssembly] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryStatus, setGalleryStatus] = useState('idle')
  const [galleryError, setGalleryError] = useState('')

  const openGallery = async (assembly) => {
    setGalleryAssembly(assembly)
    setGalleryImages([])
    setGalleryError('')
    setGalleryStatus('loading')

    try {
      const images = await loadAssemblyGalleryImages(assembly.galleryFolderUrl)
      setGalleryImages(images)
      setGalleryStatus('loaded')
    } catch (error) {
      console.error(error)
      setGalleryError(error.message || 'Could not load the gallery images.')
      setGalleryStatus('error')
    }
  }

  const closeGallery = () => {
    setGalleryAssembly(null)
    setGalleryImages([])
    setGalleryError('')
    setGalleryStatus('idle')
  }

  return (
    <div className="app-area-page nj-assemblies-page">
      <section className="app-area-hero compact-hero">
        <span className="area-icon"><Landmark size={34} /></span>
        <p className="area-kicker">New Jersey Rainbow</p>
        <h1>NJ Assemblies</h1>
        <p>Meet the local assemblies, Mother Advisors, term themes, and photo galleries.</p>
      </section>

      {assemblies.length === 0 ? (
        <section className="area-info-card">
          <h2><Landmark size={22} /> Assemblies</h2>
          <p>No assemblies have been added yet.</p>
        </section>
      ) : (
        <section className="assemblies-grid" aria-label="New Jersey Assemblies">
          {assemblies.map(assembly => (
            <article key={assembly.assemblyId || assembly.id || assembly.assemblyName} className="assembly-card">
              <div className="assembly-card-icon"><Landmark size={26} /></div>
              <div className="assembly-card-content">
                <h2>{assembly.assemblyName || assembly.name}</h2>
                {assembly.motherAdvisor && (
                  <p className="assembly-meta"><UserRound size={16} /> Mother Advisor: {assembly.motherAdvisor}</p>
                )}
                {assembly.termTheme && (
                  <p className="assembly-theme">Theme: {assembly.termTheme}</p>
                )}
                {assembly.notes && <p>{assembly.notes}</p>}
                {assembly.galleryFolderUrl && (
                  <button type="button" className="assembly-gallery-link" onClick={() => openGallery(assembly)}>
                    <Images size={16} /> View photo gallery
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {galleryAssembly && (
        <div className="event-detail-overlay" role="dialog" aria-modal="true" aria-labelledby="assembly-gallery-title" onClick={closeGallery}>
          <article className="event-detail-card assembly-gallery-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="event-detail-close" onClick={closeGallery} aria-label="Close gallery">
              <X size={22} />
            </button>
            <p className="area-kicker">Assembly Gallery</p>
            <h2 id="assembly-gallery-title">{galleryAssembly.assemblyName || galleryAssembly.name}</h2>

            {galleryStatus === 'loading' && (
              <div className="assembly-gallery-state">
                <Loader2 size={28} className="spin-icon" />
                <p>Loading photos from Google Drive...</p>
              </div>
            )}

            {galleryStatus === 'error' && (
              <div className="assembly-gallery-state error">
                <p>{galleryError}</p>
                <a href={galleryAssembly.galleryFolderUrl} target="_blank" rel="noreferrer">Open folder in Google Drive</a>
              </div>
            )}

            {galleryStatus === 'loaded' && galleryImages.length === 0 && (
              <div className="assembly-gallery-state">
                <p>No image files were found in this Google Drive folder.</p>
              </div>
            )}

            {galleryImages.length > 0 && (
              <div className="assembly-gallery-grid">
                {galleryImages.map(image => (
                  <a key={image.id} href={image.viewUrl} target="_blank" rel="noreferrer" className="assembly-gallery-photo">
                    <img src={image.thumbnailUrl} alt={image.name || 'Assembly gallery photo'} loading="lazy" />
                    {image.name && <span>{image.name}</span>}
                  </a>
                ))}
              </div>
            )}
          </article>
        </div>
      )}
    </div>
  )
}

export default NJAssemblies
