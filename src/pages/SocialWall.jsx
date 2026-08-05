import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Hash, Heart, MessageCircle, UserRound, Send,
  ExternalLink, Filter, Search, ChevronLeft, ChevronRight, X,
  Star, Grid
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import './AppArea.css'

const formatPostedAt = (value) => {
  if (!value) return 'Date not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const normalizeCount = (value) => {
  const number = Number(value)
  if (Number.isNaN(number)) return value || 0
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}k`
  return number
}

const isVideoUrl = (url) => /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(String(url || ''))

const SocialWall = () => {
  const { sheetData, appConfig, currentUser, refreshSheetData } = useApp()

  // Include approved social post submissions
  const approvedSubmissions = useMemo(() => (sheetData.socialPostSubmissions || [])
    .filter(sub => String(sub.status || 'pending').toLowerCase() === 'approved')
    .map((sub, index) => ({
      postId: `approved-submission-${sub.submissionId || sub.id || index}`,
      author: sub.author || 'Anonymous',
      handle: sub.handle || '',
      platform: sub.platform || 'Social',
      postUrl: sub.postUrl || '',
      caption: sub.caption || '',
      hashtag: sub.hashtag || '',
      mediaUrl: sub.mediaUrl || '',
      videoUrl: sub.videoUrl || '',
      likes: sub.likes || 0,
      comments: sub.comments || 0,
      postedAt: sub.submittedAt || sub.postedAt || new Date().toISOString(),
      status: 'active',
      source: 'approved-submission',
    })), [sheetData.socialPostSubmissions])

  const allPosts = useMemo(() => [
    ...(sheetData.socialPosts || []),
    ...approvedSubmissions
  ].filter(post => String(post.status || 'active').toLowerCase() !== 'inactive')
    .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0)), [sheetData.socialPosts, approvedSubmissions])

  const [filterPlatform, setFilterPlatform] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPost, setSelectedPost] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [viewMode, setViewMode] = useState('grid')
  const [showFullWall, setShowFullWall] = useState(false)

  // Spotlight carousel state (matching Gallery)
  const [rotationIndex, setRotationIndex] = useState(0)
  const [slideTransition, setSlideTransition] = useState(true)

  const platforms = [...new Set(allPosts.map(p => p.platform))].sort()

  const isVideoPost = (post) => post.videoUrl || isVideoUrl(post.mediaUrl)
  const mediaSrc = (post) => post.videoUrl || post.mediaUrl

  const filteredPosts = useMemo(() => {
    let result = allPosts

    if (filterPlatform !== 'all') {
      result = result.filter(p => p.platform === filterPlatform)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.author.toLowerCase().includes(query) ||
        p.handle.toLowerCase().includes(query) ||
        p.caption.toLowerCase().includes(query) ||
        p.hashtag.toLowerCase().includes(query) ||
        p.platform.toLowerCase().includes(query)
      )
    }

    return result
  }, [allPosts, filterPlatform, searchQuery])

  // Spotlight carousel: show 3 posts, duplicate entire list for seamless infinite loop
  const spotlightPosts = useMemo(() => {
    if (filteredPosts.length <= 3) return filteredPosts
    // Duplicate the full list 3 times for seamless infinite horizontal scroll
    return [...filteredPosts, ...filteredPosts, ...filteredPosts]
  }, [filteredPosts])

  // Auto-rotate spotlight every 4 seconds (matching Gallery)
  useEffect(() => {
    if (filteredPosts.length <= 3) return undefined
    const timer = window.setInterval(() => {
      setRotationIndex(index => {
        const nextIndex = index + 1
        // When we've scrolled through one full original list length, refresh data
        if (nextIndex === filteredPosts.length) refreshSheetData?.()
        return nextIndex
      })
    }, 4000)
    return () => window.clearInterval(timer)
  }, [filteredPosts.length, refreshSheetData])

  const handleSpotlightTransitionEnd = () => {
    if (filteredPosts.length <= 3 || rotationIndex < filteredPosts.length) return
    setSlideTransition(false)
    setRotationIndex(0)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSlideTransition(true))
    })
  }

  const handlePostClick = (post, index) => {
    setSelectedPost(post)
    setLightboxIndex(filteredPosts.findIndex(p => p.postId === post.postId || p.id === post.id))
  }

  const handleLightboxClose = () => {
    setSelectedPost(null)
  }

  const handleLightboxPrev = () => {
    setLightboxIndex((lightboxIndex - 1 + filteredPosts.length) % filteredPosts.length)
  }

  const handleLightboxNext = () => {
    setLightboxIndex((lightboxIndex + 1) % filteredPosts.length)
  }

  const toggleLike = (post) => {
    if (!currentUser) return
    const newLikes = post.likes + (post.liked ? -1 : 1)
    post.likes = newLikes
    post.liked = !post.liked
  }

  if (selectedPost) {
    return (
      <SocialLightbox
        post={selectedPost}
        posts={filteredPosts}
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
    <div className="social-wall-page">
      <div className="page-header social-wall-screen-header">
        <h1 className="page-title">
          <Hash className="page-title-icon" size={32} />
          Social Wall
        </h1>
        <p className="page-subtitle">Posts from {appConfig.appTitle || 'the convention'}</p>
      </div>

      {filteredPosts.length === 0 ? (
        <section className="area-info-card">
          <h2><Hash size={22} /> Social Wall</h2>
          <p>No social posts have been added yet. Add posts via Admin → Social Posts or submit your own.</p>
          <Link className="social-wall-submit-btn" to="/submit-social">Submit Your Post</Link>
        </section>
      ) : (
        <>
          {/* Spotlight Carousel - 1 row, 3 posts, auto-rotating (matching Gallery) */}
          <section className="social-wall-spotlight event-screen-gallery" aria-label="Featured rotating social posts">
            <div className="social-wall-spotlight-header">
              <div>
                <p className="area-kicker">Live Social Wall</p>
                <h2>Convention Buzz</h2>
                <p className="social-wall-screen-note">Posts rotate automatically. Click to view details.</p>
              </div>
              <button type="button" className="social-wall-view-all-btn" onClick={() => setShowFullWall(v => !v)}>
                {showFullWall ? 'Hide Full Wall' : 'View Full Wall'}
              </button>
              <Link className="social-wall-submit-btn" to="/submit-social">Submit Your Post</Link>
            </div>

            <div className="social-wall-spotlight-viewport">
              <div
                className={`social-wall-spotlight-track ${slideTransition ? '' : 'no-transition'}`}
                style={{ transform: `translateX(-${rotationIndex * (100 / 3)}%)` }}
                onTransitionEnd={handleSpotlightTransitionEnd}
              >
                {spotlightPosts.map((post, index) => (
                  <SocialSpotlightCard
                    key={`${post.postId || post.id}-${index}`}
                    post={post}
                    index={index}
                    onClick={handlePostClick}
                    currentUser={currentUser}
                    onLike={toggleLike}
                  />
                ))}
              </div>
            </div>
          </section>

          {showFullWall && (
            <>
              {/* Filter Bar */}
              <div className="filter-bar">
                <div className="filter-group">
                  <label>Platform</label>
                  <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="filter-select">
                    <option value="all">All Platforms</option>
                    {platforms.map(plat => <option key={plat} value={plat}>{plat}</option>)}
                  </select>
                </div>
                <div className="filter-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search posts, authors, hashtags..."
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

              {/* Full scrollable grid */}
              <section className="social-wall-full-list" aria-label="All social posts">
                <div className="social-wall-container">
                  {viewMode === 'grid' ? (
                    <div className="social-wall-grid simple-social-wall-grid">
                      {filteredPosts.map((post, index) => (
                        <SocialPostCard
                          key={post.postId || post.id}
                          post={post}
                          index={index}
                          onClick={handlePostClick}
                          currentUser={currentUser}
                          onLike={toggleLike}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="social-wall-masonry">
                      {filteredPosts.map((post, index) => (
                        <SocialPostCard
                          key={post.postId || post.id}
                          post={post}
                          index={index}
                          onClick={handlePostClick}
                          currentUser={currentUser}
                          onLike={toggleLike}
                          masonry={true}
                        />
                      ))}
                    </div>
                  )}

                  {filteredPosts.length === 0 && (
                    <div className="empty-state">
                      <Hash size={48} className="empty-state-icon" />
                      <h3 className="empty-state-title">No Posts Found</h3>
                      <p className="empty-state-message">Try adjusting your filters or search terms.</p>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Featured Post of the Day */}
          {allPosts.find(p => p.featured) && (
            <FeaturedPost post={allPosts.find(p => p.featured)} />
          )}
        </>
      )}
    </div>
  )
}

const isVideoPostCheck = (post) => post.videoUrl || /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(String(post.mediaUrl || ''))
const getPostMediaSrc = (post) => post.videoUrl || post.mediaUrl
const getPostImageSrc = (post) => post.mediaUrl

// Spotlight card - uses the SAME detailed format as SocialPostCard (matching Gallery style)
const SocialSpotlightCard = ({ post, index, onClick, currentUser, onLike }) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <button
      type="button"
      className="social-wall-spotlight-card"
      onClick={() => onClick(post, index)}
      aria-label={`Open post by ${post.author || 'poster'}`}
    >
      <div className="social-post-image-wrapper">
        {error ? (
          <div className="social-post-placeholder">
            <Hash size={32} />
            <span>Failed to load</span>
          </div>
        ) : (
          isVideoPostCheck(post) ? (
            <video
              src={getPostMediaSrc(post)}
              muted
              playsInline
              autoPlay
              loop
              preload="metadata"
              onLoadedData={() => setLoaded(true)}
              onError={() => { setError(true); setLoaded(true); }}
              className={loaded ? 'loaded' : ''}
            />
          ) : (
            <img
              src={getPostMediaSrc(post)}
              alt={post.caption || 'Social post'}
              loading="eager"
              onLoad={() => setLoaded(true)}
              onError={() => { setError(true); setLoaded(true); }}
              className={loaded ? 'loaded' : ''}
            />
          )
        )}
        {isVideoPostCheck(post) && <span className="media-type-badge">Video</span>}
        {post.featured && <span className="featured-badge">★ Featured</span>}
        {!loaded && !error && <div className="social-post-skeleton" />}
      </div>

      <div className="social-post-info">
        <div className="social-post-header">
          <div className="social-post-author-row">
            <span className="social-author-icon"><UserRound size={18} /></span>
            <div>
              <strong>{post.author || 'Unknown'}</strong>
              {post.handle && <span>{post.handle}</span>}
            </div>
          </div>
          <span className="social-platform-badge">{post.platform}</span>
        </div>
        {post.caption && <p className="social-post-caption">{post.caption}</p>}
        {post.hashtag && <span className="social-post-hashtag">{post.hashtag}</span>}
        <div className="social-post-meta">
          <span>{formatPostedAt(post.postedAt)}</span>
        </div>
        <div className="social-post-actions">
          <button
            className={`action-btn ${post.liked ? 'liked' : ''}`}
            onClick={e => { e.stopPropagation(); onLike(post); }}
            title={post.liked ? 'Unlike' : 'Like'}
          >
            <Heart size={16} className={post.liked ? 'filled' : ''} />
            <span>{normalizeCount(post.likes)}</span>
          </button>
          <button className="action-btn" onClick={e => { e.stopPropagation(); }} title="Comment">
            <MessageCircle size={16} />
            <span>{normalizeCount(post.comments)}</span>
          </button>
          {post.postUrl && (
            <a href={post.postUrl} target="_blank" rel="noreferrer" className="action-btn" onClick={e => e.stopPropagation()} title="Open original post">
              <ExternalLink size={16} />
            </a>
          )}
          <button className="action-btn" onClick={e => { e.stopPropagation(); }} title="Share">
            <Send size={16} />
          </button>
        </div>
      </div>
    </button>
  )
}

// Full detail card for scrollable list
const SocialPostCard = ({ post, index, onClick, currentUser, onLike, masonry = false }) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <article className={`social-post-card ${masonry ? 'masonry' : ''} ${post.featured ? 'featured' : ''} ${!loaded ? 'loading' : ''} ${error ? 'error' : ''}`} style={{ animationDelay: `${(index % 10) * 50}ms` }}>
      <div className="social-post-image-wrapper" onClick={() => onClick(post, index)}>
        {error ? (
          <div className="social-post-placeholder">
            <Hash size={32} />
            <span>Failed to load</span>
          </div>
        ) : (
          isVideoPostCheck(post) ? (
            <video
              src={getPostMediaSrc(post)}
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setLoaded(true)}
              onError={() => { setError(true); setLoaded(true); }}
              className={loaded ? 'loaded' : ''}
            />
          ) : (
            <img
              src={getPostImageSrc(post)}
              alt={post.caption || 'Social post'}
              onLoad={() => setLoaded(true)}
              onError={() => { setError(true); setLoaded(true); }}
              loading="lazy"
              className={loaded ? 'loaded' : ''}
            />
          )
        )}
        {isVideoPostCheck(post) && <span className="media-type-badge">Video</span>}
        {post.featured && <span className="featured-badge">★ Featured</span>}
        {!loaded && !error && <div className="social-post-skeleton" />}
      </div>

      <div className="social-post-info">
        <div className="social-post-header">
          <div className="social-post-author-row">
            <span className="social-author-icon"><UserRound size={18} /></span>
            <div>
              <strong>{post.author || 'Unknown'}</strong>
              {post.handle && <span>{post.handle}</span>}
            </div>
          </div>
          <span className="social-platform-badge">{post.platform}</span>
        </div>
        {post.caption && <p className="social-post-caption">{post.caption}</p>}
        {post.hashtag && <span className="social-post-hashtag">{post.hashtag}</span>}
        <div className="social-post-meta">
          <span>{formatPostedAt(post.postedAt)}</span>
        </div>
        <div className="social-post-actions">
          <button
            className={`action-btn ${post.liked ? 'liked' : ''}`}
            onClick={e => { e.stopPropagation(); onLike(post); }}
            title={post.liked ? 'Unlike' : 'Like'}
          >
            <Heart size={16} className={post.liked ? 'filled' : ''} />
            <span>{normalizeCount(post.likes)}</span>
          </button>
          <button className="action-btn" onClick={e => { e.stopPropagation(); }} title="Comment">
            <MessageCircle size={16} />
            <span>{normalizeCount(post.comments)}</span>
          </button>
          {post.postUrl && (
            <a href={post.postUrl} target="_blank" rel="noreferrer" className="action-btn" onClick={e => e.stopPropagation()} title="Open original post">
              <ExternalLink size={16} />
            </a>
          )}
          <button className="action-btn" onClick={e => { e.stopPropagation(); }} title="Share">
            <Send size={16} />
          </button>
        </div>
      </div>
    </article>
  )
}

const SocialLightbox = ({ post, posts, index, onClose, onPrev, onNext, onLike, currentUser }) => {
  const [loaded, setLoaded] = useState(false)

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') onPrev()
    if (e.key === 'ArrowRight') onNext()
  }

  useEffect(() => {
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
          {isVideoPostCheck(post) ? (
            <video
              src={getPostMediaSrc(post)}
              controls
              playsInline
              onLoadedData={() => setLoaded(true)}
              className={loaded ? 'loaded' : ''}
            />
          ) : (
            <img
              src={getPostImageSrc(post)}
              alt={post.caption || 'Social post'}
              onLoad={() => setLoaded(true)}
              className={loaded ? 'loaded' : ''}
            />
          )}
        </div>

        <div className="lightbox-info">
          <div className="lightbox-header">
            <div className="lightbox-author-row">
              <span className="social-author-icon"><UserRound size={24} /></span>
              <div>
                <h2>{post.author || 'Unknown'}</h2>
                {post.handle && <span>{post.handle}</span>}
              </div>
            </div>
            <div className="lightbox-meta">
              <span className="social-platform-badge">{post.platform}</span>
              <span>{formatPostedAt(post.postedAt)}</span>
            </div>
          </div>
          {post.caption && <p className="lightbox-caption">{post.caption}</p>}
          {post.hashtag && <div className="lightbox-hashtag">{post.hashtag}</div>}
          {post.postUrl && (
            <a href={post.postUrl} target="_blank" rel="noreferrer" className="lightbox-original-link">
              <ExternalLink size={16} /> View original post
            </a>
          )}
          <div className="lightbox-actions">
            <button
              className={`action-btn ${post.liked ? 'liked' : ''}`}
              onClick={e => { e.stopPropagation(); onLike(post); }}
            >
              <Heart size={18} className={post.liked ? 'filled' : ''} />
              <span>{normalizeCount(post.likes)}</span>
            </button>
            <button className="action-btn" onClick={e => e.stopPropagation()}>
              <MessageCircle size={18} />
              <span>{normalizeCount(post.comments)}</span>
            </button>
            <button className="action-btn" onClick={e => e.stopPropagation()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const FeaturedPost = ({ post }) => (
  <section className="featured-post-section" aria-label="Featured post of the day">
    <div className="featured-post-card">
      <div className="featured-post-badge">
        <Star size={16} /> Post of the Day
      </div>
      <div className="featured-post-content">
        <div className="featured-post-media">
          {isVideoPostCheck(post) ? (
            <video src={getPostMediaSrc(post)} controls playsInline />
          ) : (
            <img src={getPostImageSrc(post)} alt={post.caption || 'Featured post'} loading="eager" />
          )}
        </div>
        <div className="featured-post-info">
          <div className="featured-post-author-row">
            <span className="social-author-icon"><UserRound size={24} /></span>
            <div>
              <h3>{post.author || 'Unknown'}</h3>
              {post.handle && <span>{post.handle}</span>}
            </div>
          </div>
          <span className="social-platform-badge">{post.platform}</span>
          {post.caption && <p className="featured-post-caption">{post.caption}</p>}
          {post.hashtag && <span className="featured-post-hashtag">{post.hashtag}</span>}
          <div className="featured-post-meta">
            <span>{formatPostedAt(post.postedAt)}</span>
          </div>
          {post.postUrl && (
            <a href={post.postUrl} target="_blank" rel="noreferrer" className="featured-post-link">
              <ExternalLink size={16} /> View original post
            </a>
          )}
        </div>
      </div>
    </div>
  </section>
)

export default SocialWall