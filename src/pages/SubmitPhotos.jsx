import { useState } from 'react'
import { Camera, CheckCircle, Upload } from 'lucide-react'
import { submitGalleryMediaToGoogleSheet } from '../utils/appsScriptApi'
import './AppArea.css'

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '')
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const SubmitPhotos = () => {
  const [formData, setFormData] = useState({ uploaderName: '', uploaderEmail: '', caption: '', assembly: '' })
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file) {
      setStatus('error')
      setMessage('Please choose a photo or video to upload.')
      return
    }

    setStatus('saving')
    setMessage('Uploading your submission...')
    try {
      const fileData = await fileToBase64(file)
      await submitGalleryMediaToGoogleSheet({
        ...formData,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileData,
        mediaType: file.type?.startsWith('video/') ? 'video' : 'image',
      })
      setStatus('success')
      setMessage('Thank you! Your photo/video was submitted for approval.')
      setFormData({ uploaderName: '', uploaderEmail: '', caption: '', assembly: '' })
      setFile(null)
      event.currentTarget.reset()
    } catch (error) {
      console.error(error)
      setStatus('error')
      setMessage(error.message || 'Upload failed. Please try again later.')
    }
  }

  return (
    <div className="app-area-page submit-photos-page">
      <section className="app-area-hero compact-hero">
        <span className="area-icon"><Camera size={34} /></span>
        <p className="area-kicker">Photo Submissions</p>
        <h1>Submit Photos</h1>
        <p>Share convention memories. An admin will approve submissions before they appear in the public gallery.</p>
      </section>

      <section className="area-info-card submission-card">
        <h2><Upload size={22} /> Upload a photo or video</h2>
        <form className="submission-form" onSubmit={handleSubmit}>
          <label>
            Your name
            <input type="text" value={formData.uploaderName} onChange={event => setFormData(prev => ({ ...prev, uploaderName: event.target.value }))} placeholder="Optional" />
          </label>
          <label>
            Email
            <input type="email" value={formData.uploaderEmail} onChange={event => setFormData(prev => ({ ...prev, uploaderEmail: event.target.value }))} placeholder="Optional, for follow-up only" />
          </label>
          <label>
            Assembly / group
            <input type="text" value={formData.assembly} onChange={event => setFormData(prev => ({ ...prev, assembly: event.target.value }))} placeholder="Optional" />
          </label>
          <label>
            Caption
            <textarea value={formData.caption} onChange={event => setFormData(prev => ({ ...prev, caption: event.target.value }))} rows={4} placeholder="Tell us about this moment" />
          </label>
          <label>
            Photo or video
            <input type="file" accept="image/*,video/*" onChange={event => setFile(event.target.files?.[0] || null)} required />
          </label>
          <label className="submission-consent">
            <input type="checkbox" required />
            I understand this may be shown in the convention app after admin approval.
          </label>
          {message && <p className={`submission-message ${status}`}>{status === 'success' && <CheckCircle size={18} />} {message}</p>}
          <button className="role-gate-submit" type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? 'Uploading...' : 'Submit for Approval'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default SubmitPhotos
