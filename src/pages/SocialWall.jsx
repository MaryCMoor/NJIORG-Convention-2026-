import { useEffect, useMemo, useState, useRef } from 'react'
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

  // Continuous vertical marquee state
  const [marqueeOffset, setMarqueeOffset] = useState(0)
  const marqueeRef = useRef(null)
  const animationRef = useRef(null)
  const lastRefreshRef = useRef(0)

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

  // Continuous vertical marquee animation
  useEffect(() => {
    if (filteredPosts.length < 4) return undefined

    const ROW_HEIGHT = 280 // Approximate card height + gap in px
    const SPEED_PX_PER_SEC = 40 // Pixels per second
    const GAP = 12 // Gap between cards

    let lastTime = null
    let accumulatedOffset = marqueeOffset

    const animate = (timestamp) => {
      if (lastTime === null) lastTime = timestamp
      const delta = (timestamp - lastTime) / 1000 // seconds
      lastTime = timestamp

      // Move up
      accumulatedOffset += SPEED_PX_PER_SEC * delta

      // Check if we've moved one full card height + gap (time to wrap)
      const cardHeight = ROW_HEIGHT + GAP
      if (accumulatedOffset >= cardHeight) {
        // Seamless wrap: subtract one card height
        accumulatedOffset -= cardHeight
        // Trigger refresh check every full cycle
        if (Date.now() - lastRefreshRef.current > 30000) {
          lastRefreshRef.current = Date.now()
          refreshSheetData?.()
        }
      }

      setMarqueeOffset(accumulatedOffset)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [filteredPosts.length, refreshSheetData, marqueeOffset])

  // Create duplicated list for infinite marquee
  const marqueePosts = useMemo(() => {
    if (filteredPosts.length < 4) return filteredPosts
    // Duplicate the list 3 times for seamless wrapping
    return [...filteredPosts, ...filteredPosts, ...filteredPosts]
  }, [filteredPosts])

  return (
    <div className="social-wall-page">
      {/* Fixed Header/Banner */}
      <header className="social-wall-fixed-header">
        <div className="social-wall-header-content">
          <div className="social-wall-header-left">
            <h1 className="social-wall-title">
              <Hash className="social-wall-title-icon" size={28} />
              Social Wall
            </h1>
            <p className="social-wall-subtitle">Posts from {appConfig.appTitle || 'the convention'}</p>
          </div>
          <Link className="social-wall-submit-btn" to="/submit-social">Submit Your Post</Link>
        </div>
        {/* Fade gradient at bottom of header for cards disappearing under */}
        <div className="social-wall-header-fade" />
      </header>

      {filteredPosts.length === 0 ? (
        <section className="area-info-card" style={{ marginTop: 'var(--space-xl)' }}>
          <h2><Hash size={22} /> Social Wall</h2>
          <p>No social posts have been added yet. Add posts via Admin → Social Posts or submit your own.</p>
          <Link className="social-wall-submit-btn" to="/submit-social">Submit Your Post</Link>
        </section>
      ) : (
        <>
          {/* Live Vertical Marquee Feed */}
          <section className="social-wall-marquee-section" aria-label="Live social media posts">
            <div className="social-wall-marquee-header">
              <div>
                <p className="area-kicker">Live Feed</p>
                <h2>Convention Buzz</h2>
                <p className="social-wall-screen-note">Posts continuously scroll. Click any post to view details.</p>
              </div>
              <button type="button" className="social-wall-view-all-btn" onClick={() => setShowFullWall(v => !v)}>
                {showFullWall ? 'Hide Full Wall' : 'View Full Wall'}
              </button>
              <Link className="social-wall-submit-btn" to="/submit-social">Submit Your Post</Link>
            </div>

            <div className="social-wall-marquee-frame" ref={marqueeRef}>
              <div
                className="social-wall-marquee-track"
                style={{ transform: `translateY(-${marqueeOffset}px)` }}
              >
                {marqueePosts.map((post, index) => (
                  <SocialMarqueeCard
                    key={`${post.postId || post.id}-${index}`}
                    post={post}
                    index={index}
                    onClick={handlePostClick}
                  />
                ))}
              </div>
              {/* Bottom fade mask */}
              <div className="social-wall-marquee-bottom-fade" />
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

// Marquee card - compact, optimized for continuous scrolling
const SocialMarqueeCard = ({ post, index, onClick }) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <button
      type="button"
      className="social-marquee-card"
      onClick={() => onClick(post, index)}
      aria-label={`Open post by ${post.author || 'poster'}`}
    >
      <div className="social-marquee-media">
        {error ? (
          <div className="social-post-placeholder">
            <Hash size={28} />
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
        {!loaded && !error && <div className="social-post-skeleton" />}
      </div>
      <div className="social-marquee-footer">
        <div className="social-marquee-author-row">
          <span className="social-author-icon"><UserRound size={14} /></span>
          <span className="social-marquee-author-name">{post.author || 'Unknown'}</span>
        </div>
        <div className="social-marquee-stats">
          <span className="social-marquee-stat">
            <Heart size={12} /> {normalizeCount(post.likes)}
          </span>
          <span className="social-marquee-stat">
            <MessageCircle size={12} /> {normalizeCount(post.comments)}
          </span>
        </div>
        <span className="social-marquee-platform">{post.platform}</span>
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