import { useState } from 'react'
import { Link, Send, CheckCircle } from 'lucide-react'
import { submitSocialPostToGoogleSheet } from '../utils/appsScriptApi'
import './AppArea.css'

const SubmitSocialPost = () => {
  const [formData, setFormData] = useState({
    author: '',
    handle: '',
    platform: 'Instagram',
    postUrl: '',
    caption: '',
    hashtag: '',
  })
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.postUrl.trim()) {
      setStatus('error')
      setMessage('Please provide a link to the social media post.')
      return
    }

    setStatus('saving')
    setMessage('Submitting for approval...')
    try {
      await submitSocialPostToGoogleSheet({
        ...formData,
        status: 'pending',
        postedAt: new Date().toISOString(),
      })
      setStatus('success')
      setMessage('Thank you! Your post has been submitted for admin approval.')
      setFormData({ author: '', handle: '', platform: 'Instagram', postUrl: '', caption: '', hashtag: '' })
    } catch (error) {
      console.error(error)
      setStatus('error')
      setMessage(error.message || 'Submission failed. Please try again later.')
    }
  }

  return (
    <div className="app-area-page submit-social-page">
      <section className="app-area-hero compact-hero">
        <span className="area-icon"><Send size={34} /></span>
        <p className="area-kicker">Social Wall Submissions</p>
        <h1>Submit a Social Post</h1>
        <p>Share your convention moments from social media. An admin will approve before it appears on the Social Wall.</p>
      </section>

      <section className="area-info-card submission-card">
        <h2><Send size={22} /> Submit a post</h2>
        <form className="submission-form" onSubmit={handleSubmit}>
          <label>
            Your name *
            <input
              type="text"
              value={formData.author}
              onChange={event => setFormData(prev => ({ ...prev, author: event.target.value }))}
              placeholder="Required"
              required
            />
          </label>
          <label>
            Social handle (e.g., @username)
            <input
              type="text"
              value={formData.handle}
              onChange={event => setFormData(prev => ({ ...prev, handle: event.target.value }))}
              placeholder="Optional"
            />
          </label>
          <label>
            Platform *
            <select
              value={formData.platform}
              onChange={event => setFormData(prev => ({ ...prev, platform: event.target.value }))}
              required
            >
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="Facebook">Facebook</option>
              <option value="Twitter/X">Twitter/X</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>
            Post URL *
            <input
              type="url"
              value={formData.postUrl}
              onChange={event => setFormData(prev => ({ ...prev, postUrl: event.target.value }))}
              placeholder="https://instagram.com/p/... or https://tiktok.com/@.../video/..."
              required
            />
          </label>
          <label>
            Caption / description
            <textarea
              value={formData.caption}
              onChange={event => setFormData(prev => ({ ...prev, caption: event.target.value }))}
              rows={4}
              placeholder="What's happening in this post?"
            />
          </label>
          <label>
            Hashtag (e.g., #RainbowConvention2026)
            <input
              type="text"
              value={formData.hashtag}
              onChange={event => setFormData(prev => ({ ...prev, hashtag: event.target.value }))}
              placeholder="Optional"
            />
          </label>
          <label className="submission-consent">
            <input type="checkbox" required />
            I understand this will be reviewed by an admin before appearing on the public Social Wall.
          </label>
          {message && <p className={`submission-message ${status}`}>{status === 'success' && <CheckCircle size={18} />} {message}</p>}
          <button className="role-gate-submit" type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </form>
      </section>

      <section className="area-info-card">
        <h2>How it works</h2>
        <ul>
          <li>Paste a link to your public social media post (Instagram, TikTok, Facebook, Twitter/X, etc.)</li>
          <li>Add your name, handle, and any caption or hashtag</li>
          <li>Admin reviews and approves — then it appears on the Social Wall for everyone to see</li>
          <li>Your original post link is preserved so viewers can engage on the platform</li>
        </ul>
      </section>

      <Link to="/social-wall" className="back-link">
        <Send size={18} /> View Social Wall
      </Link>
    </div>
  )
}

export default SubmitSocialPost