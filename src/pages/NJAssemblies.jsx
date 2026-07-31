import { useState } from 'react'
import { Images, Landmark, UserRound, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './AppArea.css'

const parseGalleryImageUrls = (value) => String(value || '')
  .split(/[\n,]+/)
  .map(url => url.trim())
  .filter(Boolean)
  .map((url, index) => ({
    id: `${index}-${url}`,
    name: `Photo ${index + 1}`,
    imageUrl: url,
  }))

const NJAssemblies = () => {
  const { sheetData } = useApp()
  const assemblies = sheetData.assemblies || []
  const [galleryAssembly, setGalleryAssembly] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null)

  const openGallery = (assembly) => {
    const images = parseGalleryImageUrls(assembly.galleryImageUrls)
    setGalleryAssembly(assembly)
    setGalleryImages(images)
    setSelectedGalleryImage(images[0] || null)
  }

  const closeGallery = () => {
    setGalleryAssembly(null)
    setGalleryImages([])
    setSelectedGalleryImage(null)
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
          {assemblies.map(assembly => {
            const hasImageUrls = parseGalleryImageUrls(assembly.galleryImageUrls).length > 0
            const hasFolderLink = Boolean(assembly.galleryFolderUrl)

            return (
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
                  {(hasImageUrls || hasFolderLink) && (
                    <button type="button" className="assembly-gallery-link" onClick={() => openGallery(assembly)}>
                      <Images size={16} /> View photo gallery
                    </button>
                  )}
                </div>
              </article>
            )
          })}
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

            {galleryImages.length === 0 ? (
              <div className="assembly-gallery-state">
                <p>No image URLs have been added for this assembly yet.</p>
                {galleryAssembly.galleryFolderUrl && (
                  <a href={galleryAssembly.galleryFolderUrl} target="_blank" rel="noreferrer">Open Google Drive folder</a>
                )}
              </div>
            ) : (
              <>
                {selectedGalleryImage && (
                  <figure className="assembly-gallery-featured">
                    <img src={selectedGalleryImage.imageUrl} alt={selectedGalleryImage.name || 'Selected assembly gallery photo'} />
                    {selectedGalleryImage.name && <figcaption>{selectedGalleryImage.name}</figcaption>}
                  </figure>
                )}
                <div className="assembly-gallery-grid">
                  {galleryImages.map(image => (
                    <button
                      key={image.id}
                      type="button"
                      className={`assembly-gallery-photo ${selectedGalleryImage?.id === image.id ? 'active' : ''}`}
                      onClick={() => setSelectedGalleryImage(image)}
                    >
                      <img src={image.imageUrl} alt={image.name || 'Assembly gallery photo'} loading="lazy" />
                      {image.name && <span>{image.name}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </article>
        </div>
      )}
    </div>
  )
}

export default NJAssemblies
