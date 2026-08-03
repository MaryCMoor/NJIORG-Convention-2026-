import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Images, Landmark, UserRound, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './AppArea.css'

const extractDriveFileId = (url) => {
  const text = String(url || '')
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
    /\/thumbnail\?id=([a-zA-Z0-9_-]+)/,
  ]
  const match = patterns.map(pattern => text.match(pattern)).find(Boolean)
  return match?.[1] || ''
}

const isDirectVideoUrl = (url) => /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)

const getYouTubeEmbedUrl = (url) => {
  const text = String(url || '')
  const match = text.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : ''
}

const normalizeMediaUrl = (rawUrl, index) => {
  const url = String(rawUrl || '').trim()
  const driveFileId = extractDriveFileId(url)
  const youtubeEmbedUrl = getYouTubeEmbedUrl(url)
  const isVideo = isDirectVideoUrl(url) || Boolean(youtubeEmbedUrl)

  if (driveFileId) {
    return {
      id: `${index}-${driveFileId}`,
      url,
      displayUrl: `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1600`,
      type: 'image',
    }
  }

  if (youtubeEmbedUrl) {
    return {
      id: `${index}-${url}`,
      url,
      displayUrl: youtubeEmbedUrl,
      type: 'embed',
    }
  }

  return {
    id: `${index}-${url}`,
    url,
    displayUrl: url,
    type: isVideo ? 'video' : 'image',
  }
}

const parseGalleryMediaUrls = (value) => String(value || '')
  .split(/[\n,]+/)
  .map(url => url.trim())
  .filter(Boolean)
  .map(normalizeMediaUrl)

const NJAssemblies = () => {
  const { sheetData } = useApp()
  const assemblies = sheetData.assemblies || []
  const [galleryAssembly, setGalleryAssembly] = useState(null)
  const [galleryItems, setGalleryItems] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(null)

  const hasMultipleItems = galleryItems.length > 1
  const visibleItems = useMemo(() => {
    if (galleryItems.length <= 3) return galleryItems
    return [0, 1, 2].map(offset => galleryItems[(activeIndex + offset) % galleryItems.length])
  }, [activeIndex, galleryItems])

  useEffect(() => {
    if (!galleryAssembly || galleryItems.length <= 3) return undefined
    const timer = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % galleryItems.length)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [galleryAssembly, galleryItems.length])

  const openGallery = (assembly) => {
    // Combine manual URLs and Drive folder images
    const manualItems = parseGalleryMediaUrls(assembly.galleryMediaUrls || assembly.galleryImageUrls)
    const driveItems = (assembly.driveImages || []).map((img, idx) => ({
      id: `drive-${img.name}-${idx}`,
      url: img.url,
      displayUrl: img.thumbnail,
      type: 'image',
    }))
    const allItems = [...manualItems, ...driveItems]
    setGalleryAssembly(assembly)
    setGalleryItems(allItems)
    setActiveIndex(0)
  }

  const closeGallery = () => {
    setGalleryAssembly(null)
    setGalleryItems([])
    setActiveIndex(0)
    setTouchStartX(null)
  }

  const showPrevious = () => {
    setActiveIndex(index => (index - 1 + galleryItems.length) % galleryItems.length)
  }

  const showNext = () => {
    setActiveIndex(index => (index + 1) % galleryItems.length)
  }

  const handleTouchEnd = (event) => {
    if (touchStartX === null || galleryItems.length < 2) return
    const deltaX = event.changedTouches[0].clientX - touchStartX
    setTouchStartX(null)

    if (Math.abs(deltaX) < 40) return
    if (deltaX > 0) showPrevious()
    else showNext()
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
            const manualItems = parseGalleryMediaUrls(assembly.galleryMediaUrls || assembly.galleryImageUrls)
            const driveItemsCount = (assembly.driveImages || []).length
            const hasMedia = manualItems.length > 0 || driveItemsCount > 0

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
                  {hasMedia && (
                    <button type="button" className="assembly-gallery-link" onClick={() => openGallery(assembly)}>
                      <Images size={16} /> View photo/video gallery {driveItemsCount > 0 && <span className="drive-badge">({driveItemsCount} from Drive)</span>}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}

      {galleryAssembly && (
        <div className="event-detail-overlay assembly-slider-overlay" role="dialog" aria-modal="true" aria-labelledby="assembly-gallery-title">
          <article className="assembly-slider-modal">
            <button type="button" className="assembly-slider-close" onClick={closeGallery} aria-label="Close gallery">
              <X size={24} />
            </button>

            <div className="assembly-slider-header">
              <p className="area-kicker">Assembly Gallery</p>
              <h2 id="assembly-gallery-title">{galleryAssembly.assemblyName || galleryAssembly.name}</h2>
              {galleryItems.length > 0 && <span>Showing {visibleItems.length} of {galleryItems.length}</span>}
            </div>

            {galleryItems.length === 0 ? (
              <div className="assembly-gallery-state">
                <p>No photo or video URLs have been added for this assembly yet.</p>
              </div>
            ) : (
              <div
                className="assembly-slider-stage"
                onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
                onTouchEnd={handleTouchEnd}
              >
                {hasMultipleItems && (
                  <button type="button" className="assembly-slider-nav previous" onClick={showPrevious} aria-label="Previous image">
                    <ChevronLeft size={28} />
                  </button>
                )}

                <div className="assembly-slider-media three-up-gallery">
                  {visibleItems.map((item, index) => (
                    <div key={item.id} className={`assembly-slide-card ${index === 1 ? 'center' : ''}`}>
                      {item.type === 'video' ? (
                        <video src={item.displayUrl} controls playsInline muted={index !== 1} />
                      ) : item.type === 'embed' ? (
                        <iframe src={item.displayUrl} title="Assembly gallery video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                      ) : (
                        <img src={item.displayUrl} alt="Assembly gallery" />
                      )}
                    </div>
                  ))}
                </div>

                {hasMultipleItems && (
                  <button type="button" className="assembly-slider-nav next" onClick={showNext} aria-label="Next image">
                    <ChevronRight size={28} />
                  </button>
                )}
              </div>
            )}
          </article>
        </div>
      )}
    </div>
  )
}

export default NJAssemblies
