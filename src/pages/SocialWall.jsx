import { useEffect, useMemo, useState } from 'react'
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
  const posts = (sheetData.socialPosts || [])
    .filter(post => String(post.status || 'active').toLowerCase() !== 'inactive')
    .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0))
  const [startIndex, setStartIndex] = useState(0)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (posts.length <= 9) return undefined
    const timer = window.setInterval(() => {
      setStartIndex(index => (index + 3) % posts.length)
      setCycle(value => value + 1)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [posts.length])

  const visiblePosts = useMemo(() => {
    if (posts.length <= 12) return posts
    return Array.from({ length: 12 }, (_, offset) => posts[(startIndex + offset) % posts.length])
  }, [posts, startIndex])

  return (
    <div className="app-area-page social-wall-page">
      <section className="app-area-hero compact-hero">
        <span className="area-icon"><Hash size={34} /></span>
        <p className="area-kicker">{appConfig.hashtag || 'Social Wall'}</p>
        <h1>Social Wall</h1>
        <p>Convention posts, photos, likes, comments, and links in one place.</p>
      </section>

      {posts.length === 0 ? (
        <section className="area-info-card">
          <h2><Hash size={22} /> Social Posts</h2>
          <p>No social posts have been added yet.</p>
        </section>
      ) : (
        <section className="social-wall-frame" aria-label="Social media posts">
          <div className="social-post-list social-waterfall-grid" key={cycle}>
          {visiblePosts.map((post, index) => (
            <a
              key={`${post.postId || post.id || post.postUrl}-${index}`}
              className="social-post-card"
              href={post.postUrl || '#'}
              target={post.postUrl ? '_blank' : undefined}
              rel={post.postUrl ? 'noreferrer' : undefined}
              aria-label={post.postUrl ? `Open social media post by ${post.author || post.handle || 'poster'}` : 'Social media post'}
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
        </section>
      )}
    </div>
  )
}

export default SocialWall
