import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Images, Camera, Heart, Star, Download, Share2, 
  Filter, Search, ChevronLeft, ChevronRight, X,
  Loader, Grid, MapPin, Calendar, MessageCircle
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import '../components/ui/UIComponents.css'
import './Gallery.css'

const repoGalleryFiles = import.meta.glob('../assets/gallery/**/*.{jpg,jpeg,png,webp,gif,JPG,JPEG,PNG,WEBP,GIF,mp4,webm,ogg,mov,MP4,WEBM,OGG,MOV}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const titleFromPath = (path) => {
  const fileName = path.split('/').pop() || 'Gallery item'
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

const isVideoPath = (path) => /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(String(path || ''))

const extractDriveFileId = (url) => {
  const text = String(url || '')
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
    /\/thumbnail\?id=([a-zA-Z0-9_-]+)/,
    /\/uc\?export=view&id=([a-zA-Z0-9_-]+)/,
  ]
  const match = patterns.map(pattern => text.match(pattern)).find(Boolean)
  return match?.[1] || ''
}

const getDriveThumbnailUrl = (url, size = 'w1600') => {
  const id = extractDriveFileId(url)
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=${size}` : url
}

const repoGalleryItems = Object.entries(repoGalleryFiles).map(([path, url], index) => {
  const mediaType = isVideoPath(path) ? 'video' : 'image'
  return {
    id: `repo-gallery-${index + 1}`,
    url,
    imageUrl: mediaType === 'image' ? url : '',
    videoUrl: mediaType === 'video' ? url : '',
    mediaType,
    title: titleFromPath(path),
    description: '',
    caption: '',
    category: 'Convention',
    day: '',
    photographer: 'Convention Team',
    tags: [],
    thumbnail: mediaType === 'image' ? url : '',
    featured: false,
    likes: 0,
    comments: 0,
    liked: false,
    uploadedBy: 'GitHub gallery folder',
    uploadDate: '',
    source: 'github-folder',
  }
})

const Gallery = () => {
  const { sheetData, appConfig, currentUser, refreshSheetData } = useApp()
  
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDay, setFilterDay] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [rotationIndex, setRotationIndex] = useState(0)
  const [slideTransition, setSlideTransition] = useState(true)
  const [showFullGallery, setShowFullGallery] = useState(false)

  const approvedSubmissions = useMemo(() => (sheetData.gallerySubmissions || [])
    .filter(item => String(item.status || '').toLowerCase() === 'approved')
    .map((item, index) => {
      const mediaUrl = item.mediaUrl || item.videoUrl || item.imageUrl || ''
      const mediaType = item.mediaType || (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(mediaUrl) ? 'video' : 'image')
      return {
        id: `approved-submission-${item.submissionId || item.id || index}`,
        url: mediaUrl,
        imageUrl: mediaType === 'image' ? mediaUrl : '',
        videoUrl: mediaType === 'video' ? mediaUrl : '',
        mediaType,
        title: item.caption || 'Submitted memory',
        description: item.caption || '',
        caption: item.caption || '',
        category: 'Submissions',
        day: '',
        photographer: item.uploaderName || 'Convention Guest',
        tags: [],
        thumbnail: item.thumbnailUrl || (mediaType === 'image' ? mediaUrl : ''),
        featured: false,
        likes: 0,
        comments: 0,
        liked: false,
        uploadedBy: item.uploaderName || 'Convention Guest',
        uploadDate: item.submittedAt || '',
        source: 'approved-submission',
      }
    })
    .filter(item => item.url), [sheetData.gallerySubmissions])

  const photos = useMemo(() => [...sheetData.gallery, ...approvedSubmissions, ...repoGalleryItems], [sheetData.gallery, approvedSubmissions])
  const categories = [...new Set(photos.map(p => p.category))].sort()
  const days = [...new Set(photos.map(p => p.day))].sort()

  const isVideoMedia = (photo) => photo.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(String(photo.videoUrl || photo.url || ''))
  const mediaSrc = (photo) => photo.videoUrl || photo.url
  const imageSrc = (photo) => getDriveThumbnailUrl(photo.thumbnail || photo.imageUrl || photo.url)

  const filteredPhotos = useMemo(() => {
    let result = photos
    
    if (filterCategory !== 'all') {
      result = result.filter(p => p.category === filterCategory)
    }
    
    if (filterDay !== 'all') {
      result = result.filter(p => p.day === filterDay)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query)) ||
        p.photographer.toLowerCase().includes(query)
      )
    }
    
    return result.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [photos, filterCategory, filterDay, searchQuery])

  useEffect(() => {
    if (filteredPhotos.length <= 3) return undefined
    const timer = window.setInterval(() => {
      setRotationIndex(index => {
        const nextIndex = index + 1
        if (nextIndex === filteredPhotos.length) refreshSheetData?.()
        return nextIndex
      })
    }, 3000)
    return () => window.clearInterval(timer)
  }, [filteredPhotos.length, refreshSheetData])

  const spotlightPhotos = useMemo(() => (
    filteredPhotos.length <= 3 ? filteredPhotos : [...filteredPhotos, ...filteredPhotos.slice(0, 3)]
  ), [filteredPhotos])

  const handleSpotlightTransitionEnd = () => {
    if (filteredPhotos.length <= 3 || rotationIndex < filteredPhotos.length) return
    setSlideTransition(false)
    setRotationIndex(0)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSlideTransition(true))
    })
  }

  const handlePhotoClick = (photo, index) => {
    setSelectedPhoto(photo)
    setLightboxIndex(filteredPhotos.findIndex(p => p.id === photo.id))
  }

  const handleLightboxClose = () => {
    setSelectedPhoto(null)
  }

  const handleLightboxPrev = () => {
    setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length)
  }

  const handleLightboxNext = () => {
    setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length)
  }

  const toggleLike = (photo) => {
    if (!currentUser) return
    // In a real app, this would update the backend
    const newLikes = photo.likes + (photo.liked ? -1 : 1)
    photo.likes = newLikes
    photo.liked = !photo.liked
  }

  if (selectedPhoto) {
    return (
      <Lightbox
        photo={selectedPhoto}
        photos={filteredPhotos}
        index={lightboxIndex}
        onClose={handleLightboxClose}
        onPrev={handleLightboxPrev}
        onNext={handleLightboxNext}
        onLike={toggleLike}
        currentUser={currentUser}
      />
    )
  }

  return (
    <div className="gallery-page">
      <div className="page-header gallery-screen-header">
        <h1 className="page-title">
          <Images className="page-title-icon" size={32} />
          Photo Gallery
        </h1>
        <p className="page-subtitle">Photos from {appConfig.appTitle}</p>
      </div>

      {filteredPhotos.length > 0 && (
        <section className="gallery-spotlight event-screen-gallery" aria-label="Featured rotating photos and videos">
          <div className="gallery-spotlight-header">
            <div>
              <p className="area-kicker">Live Gallery</p>
              <h2>Convention Memories</h2>
              <p className="gallery-screen-note">Photos and videos rotate automatically throughout the event.</p>
            </div>
            <button type="button" className="gallery-view-all-btn" onClick={() => setShowFullGallery(value => !value)}>
              {showFullGallery ? 'Hide Full Gallery' : 'View Full Gallery'}
            </button>
            <Link className="gallery-submit-btn" to="/submit-photos">Submit Photos</Link>
          </div>

          <div className="gallery-spotlight-viewport">
            <div
              className={`gallery-spotlight-track ${slideTransition ? '' : 'no-transition'}`}
              style={{ transform: `translateX(-${rotationIndex * (100 / 3)}%)` }}
              onTransitionEnd={handleSpotlightTransitionEnd}
            >
              {spotlightPhotos.map((photo, index) => (
                <button
                  key={`${photo.id}-${index}`}
                  type="button"
                  className="gallery-spotlight-card"
                  onClick={() => handlePhotoClick(photo, index)}
                  aria-label={`Open ${photo.title || 'gallery photo'}`}
                >
                  {isVideoMedia(photo) ? (
                    <video src={mediaSrc(photo)} muted playsInline autoPlay loop preload="metadata" />
                  ) : (
                    <img src={imageSrc(photo)} alt={photo.title || 'Convention photo'} loading="eager" />
                  )}
                  <span className="gallery-spotlight-title">{photo.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {showFullGallery && <>
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Category</label>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="filter-select">
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Day</label>
          <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="filter-select">
            <option value="all">All Days</option>
            {days.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
        </div>
        <div className="filter-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search photos, tags, photographers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="view-toggle">
          <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid View">
            <Grid size={20} />
          </button>
          <button className={`view-btn ${viewMode === 'masonry' ? 'active' : ''}`} onClick={() => setViewMode('masonry')} title="Masonry View">
            <div className="masonry-icon" />
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="gallery-container">
        {viewMode === 'grid' ? (
          <div className="gallery-grid simple-gallery-grid">
            {filteredPhotos.map((photo, index) => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                index={index}
                onClick={handlePhotoClick}
                currentUser={currentUser}
                onLike={toggleLike}
              />
            ))}
          </div>
        ) : (
          <div className="gallery-masonry">
            {filteredPhotos.map((photo, index) => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                index={index}
                onClick={handlePhotoClick}
                currentUser={currentUser}
                onLike={toggleLike}
                masonry={true}
              />
            ))}
          </div>
        )}
        
        {filteredPhotos.length === 0 && (
          <div className="empty-state">
            <Images size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">No Photos Found</h3>
            <p className="empty-state-message">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
      </>}

      {/* Photo of the Day */}
      {photos.find(p => p.featured) && (
        <PhotoOfTheDay photo={photos.find(p => p.featured)} />
      )}
    </div>
  )
}

const isVideoPhoto = (photo) => photo.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(String(photo.videoUrl || photo.url || ''))
const getGalleryMediaSrc = (photo) => photo.videoUrl || photo.url
const getGalleryImageSrc = (photo) => photo.thumbnail || photo.imageUrl || photo.url

const PhotoCard = ({ photo, index, onClick, currentUser, onLike, masonry = false }) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <article className={`photo-card ${masonry ? 'masonry' : ''} ${photo.featured ? 'featured' : ''} ${!loaded ? 'loading' : ''} ${error ? 'error' : ''}`} style={{ animationDelay: `${(index % 10) * 50}ms` }}>
      <div className="photo-image-wrapper" onClick={() => onClick(photo, index)}>
        {error ? (
          <div className="photo-placeholder">
            <Images size={32} />
            <span>Failed to load</span>
          </div>
        ) : (
          isVideoPhoto(photo) ? (
            <video
              src={getGalleryMediaSrc(photo)}
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setLoaded(true)}
              onError={() => { setError(true); setLoaded(true); }}
              className={loaded ? 'loaded' : ''}
            />
          ) : (
            <img
              src={getGalleryImageSrc(photo)}
              alt={photo.title}
              onLoad={() => setLoaded(true)}
              onError={() => { setError(true); setLoaded(true); }}
              loading="lazy"
              className={loaded ? 'loaded' : ''}
            />
          )
        )}
        {isVideoPhoto(photo) && <span className="media-type-badge">Video</span>}
        {photo.featured && <span className="featured-badge">★ Featured</span>}
        {!loaded && !error && <div className="photo-skeleton" />}
      </div>
      
      <div className="photo-info">
        <div className="photo-header">
          <h3>{photo.title}</h3>
          {photo.day && <span className="photo-day">{photo.day}</span>}
        </div>
        <p className="photo-description">{photo.description}</p>
        <div className="photo-meta">
          <span className="photo-category">{photo.category}</span>
          <span className="photo-photographer">📷 {photo.photographer}</span>
        </div>
        <div className="photo-tags">
          {photo.tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="photo-tag">#{tag}</span>
          ))}
          {photo.tags.length > 4 && <span className="photo-tag more">+{photo.tags.length - 4}</span>}
        </div>
        <div className="photo-actions">
          <button 
            className={`action-btn ${photo.liked ? 'liked' : ''}`}
            onClick={e => { e.stopPropagation(); onLike(photo); }}
            title={photo.liked ? 'Unlike' : 'Like'}
          >
            <Heart size={16} className={photo.liked ? 'filled' : ''} />
            <span>{photo.likes}</span>
          </button>
          <button className="action-btn" onClick={e => { e.stopPropagation(); }} title="Share">
            <Share2 size={16} />
          </button>
          <button className="action-btn" onClick={e => { e.stopPropagation(); }} title="Download">
            <Download size={16} />
          </button>
          <button className="action-btn" onClick={e => { e.stopPropagation(); }} title="Comment">
            <MessageCircle size={16} />
            <span>{photo.comments}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

const Lightbox = ({ photo, photos, index, onClose, onPrev, onNext, onLike, currentUser }) => {
  const [loaded, setLoaded] = useState(false)

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') onPrev()
    if (e.key === 'ArrowRight') onNext()
  }

  useState(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <X size={28} />
      </button>
      
      <button className="lightbox-nav prev" onClick={e => { e.stopPropagation(); onPrev(); }} aria-label="Previous">
        <ChevronLeft size={32} />
      </button>
      
      <button className="lightbox-nav next" onClick={e => { e.stopPropagation(); onNext(); }} aria-label="Next">
        <ChevronRight size={32} />
      </button>

      <div className="lightbox-content">
        <div className="lightbox-image-wrapper">
          {!loaded && <div className="lightbox-skeleton" />}
          {isVideoPhoto(photo) ? (
            <video
              src={getGalleryMediaSrc(photo)}
              controls
              playsInline
              onLoadedData={() => setLoaded(true)}
              className={loaded ? 'loaded' : ''}
            />
          ) : (
            <img
              src={getGalleryImageSrc(photo)}
              alt={photo.title}
              onLoad={() => setLoaded(true)}
              className={loaded ? 'loaded' : ''}
            />
          )}
        </div>
        
        <div className="lightbox-info">
          <div className="lightbox-header">
            <h2>{photo.title}</h2>
            <div className="lightbox-meta">
              <span>{photo.category}</span>
              <span>{photo.day}</span>
              <span>📷 {photo.photographer}</span>
              <span>{new Date(photo.date).toLocaleDateString()}</span>
            </div>
          </div>
          <p className="lightbox-description">{photo.description}</p>
          <div className="lightbox-tags">
            {photo.tags.map((tag, i) => (
              <span key={i} className="photo-tag">#{tag}</span>
            ))}
          </div>
          <div className="lightbox-actions">
            <button 
              className={`lightbox-action-btn ${photo.liked ? 'liked' : ''}`}
              onClick={e => { e.stopPropagation(); onLike(photo); }}
            >
              <Heart size={20} className={photo.liked ? 'filled' : ''} />
              <span>{photo.likes}</span>
            </button>
            <button className="lightbox-action-btn" onClick={e => e.stopPropagation()}>
              <Share2 size={20} />
              <span>Share</span>
            </button>
            <button className="lightbox-action-btn" onClick={e => e.stopPropagation()}>
              <Download size={20} />
              <span>Download</span>
            </button>
          </div>
          <div className="lightbox-counter">
            {index + 1} of {photos.length}
          </div>
        </div>
      </div>
    </div>
  )
}

const PhotoOfTheDay = ({ photo }) => (
  <div className="photo-of-day">
    <div className="pod-header">
      <span className="pod-badge">✨ Photo of the Day</span>
    </div>
    <div className="pod-content">
      {isVideoPhoto(photo) ? <video src={getGalleryMediaSrc(photo)} controls playsInline /> : <img src={getGalleryImageSrc(photo)} alt={photo.title} />}
      <div className="pod-info">
        <h3>{photo.title}</h3>
        <p>{photo.description}</p>
        <div className="pod-meta">
          <span>📷 {photo.photographer}</span>
          <span>{photo.category}</span>
          <span>{photo.day}</span>
        </div>
      </div>
    </div>
  </div>
)

export default Gallery