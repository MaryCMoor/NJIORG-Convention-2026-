import { useEffect, useMemo, useState, useRef } from 'react'
import { ExternalLink, Hash, Heart, MessageCircle, UserRound } from 'lucide-react'
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
  const { sheetData, appConfig } = useApp()
  const allPosts = (sheetData.socialPosts || [])
    .filter(post => String(post.status || 'active').toLowerCase() !== 'inactive')
    .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0))

  const POSTS_PER_VIEW = 9 // 3x3 grid
  const [startIndex, setStartIndex] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [animating, setAnimating] = useState(false)
  const animatingRef = useRef(false)

  // Get visible posts (9 for 3x3 grid)
  const visiblePosts = useMemo(() => {
    if (allPosts.length <= POSTS_PER_VIEW) return allPosts
    return Array.from({ length: POSTS_PER_VIEW }, (_, offset) => allPosts[(startIndex + offset) % allPosts.length])
  }, [allPosts, startIndex])

  // Waterfall up animation every 3 seconds
  useEffect(() => {
    if (allPosts.length <= POSTS_PER_VIEW) return undefined
    
    const timer = window.setInterval(() => {
      if (animatingRef.current) return
      animatingRef.current = true
      setAnimating(true)
      
      // After animation completes, update index
      setTimeout(() => {
        setStartIndex(index => (index + 3) % allPosts.length)
        setCycle(value => value + 1)
        setAnimating(false)
        animatingRef.current = false
      }, 600) // Match CSS animation duration
    }, 3000)
    
    return () => window.clearInterval(timer)
  }, [allPosts.length])

  return (
    <div className="app-area-page social-wall-page">
      <section className="app-area-hero compact-hero">
        <span className="area-icon"><Hash size={34} /></span>
        <p className="area-kicker">{appConfig.hashtag || 'Social Wall'}</p>
        <h1>Social Wall</h1>
        <p>Convention posts, photos, likes, comments, and links in one place.</p>
      </section>

      {allPosts.length === 0 ? (
        <section className="area-info-card">
          <h2><Hash size={22} /> Social Posts</h2>
          <p>No social posts have been added yet. Add posts via Admin → Social Posts or configure API fetching.</p>
        </section>
      ) : (
        <section className="social-wall-frame" aria-label="Social media posts">
          <div 
            className={`social-waterfall-grid ${animating ? 'waterfall-animating' : ''}`}
            key={cycle}
            role="list"
            aria-label="Social media posts"
          >
            {visiblePosts.map((post, index) => (
              <a
                key={`${post.postId || post.id || post.postUrl}-${index}-${cycle}`}
                className="social-post-card"
                href={post.postUrl || '#'}
                target={post.postUrl ? '_blank' : undefined}
                rel={post.postUrl ? 'noreferrer' : undefined}
                aria-label={post.postUrl ? `Open social media post by ${post.author || post.handle || 'poster'}` : 'Social media post'}
                role="listitem"
              >
                <div className="social-post-topline">
                  <span className="social-platform">{post.platform || 'Social'}</span>
                  <span className="social-post-time">{formatPostedAt(post.postedAt || post.date)}</span>
                </div>

                <div className="social-author-row">
                  <span className="social-author-icon"><UserRound size={18} /></span>
                  <div>
                    <strong>{post.author || post.handle || 'Unknown poster'}</strong>
                    {post.handle && <span>{post.handle}</span>}
                  </div>
                </div>

                {post.caption && <p className="social-caption">{post.caption}</p>}

                {(post.mediaUrl || post.videoUrl) && (
                  <div className="social-media-preview">
                    {isVideoUrl(post.videoUrl || post.mediaUrl) ? (
                      <video src={post.videoUrl || post.mediaUrl} controls playsInline />
                    ) : (
                      <img src={post.mediaUrl || post.videoUrl} alt="Social media post" loading="lazy" />
                    )}
                  </div>
                )}

                {post.hashtag && <span className="social-hashtag">{post.hashtag}</span>}

                <div className="social-post-footer">
                  <span><Heart size={16} /> {normalizeCount(post.likes)} likes</span>
                  <span><MessageCircle size={16} /> {normalizeCount(post.comments)} comments</span>
                  {post.postUrl && <span className="open-post"><ExternalLink size={16} /> Open post</span>}
                </div>
              </a>
            ))}
          </div>
          
          {/* New posts entering from bottom during animation */}
          {animating && allPosts.length > POSTS_PER_VIEW && (
            <div className="social-waterfall-entering" aria-hidden="true">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={`entering-${i}-${cycle}`} className="social-post-card entering">
                  <div className="social-post-placeholder">
                    <div className="placeholder-line"></div>
                    <div className="placeholder-line short"></div>
                    <div className="placeholder-line"></div>
                    <div className="placeholder-image"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default SocialWall
