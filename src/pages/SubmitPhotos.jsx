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
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (files.length === 0) {
      setStatus('error')
      setMessage('Please choose at least one photo or video to upload.')
      return
    }

    setStatus('saving')
    setMessage(`Uploading ${files.length} submission${files.length === 1 ? '' : 's'}...`)
    try {
      for (const selectedFile of files) {
        const fileData = await fileToBase64(selectedFile)
        await submitGalleryMediaToGoogleSheet({
          ...formData,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || 'application/octet-stream',
          fileData,
          mediaType: selectedFile.type?.startsWith('video/') ? 'video' : 'image',
        })
      }
      setStatus('success')
      setMessage(`Thank you! ${files.length} photo/video submission${files.length === 1 ? ' was' : 's were'} sent for approval.`)
      setFormData({ uploaderName: '', uploaderEmail: '', caption: '', assembly: '' })
      setFiles([])
      form?.reset()
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
        <h2><Upload size={22} /> Upload photos or videos</h2>
        <form className="submission-form" onSubmit={handleSubmit}>
          <label>
            Your name *
            <input type="text" value={formData.uploaderName} onChange={event => setFormData(prev => ({ ...prev, uploaderName: event.target.value }))} placeholder="Required" required />
          </label>
          <label>
            Email
            <input type="email" value={formData.uploaderEmail} onChange={event => setFormData(prev => ({ ...prev, uploaderEmail: event.target.value }))} placeholder="Optional, for follow-up only" />
          </label>
          <label>
            Assembly / group *
            <input type="text" value={formData.assembly} onChange={event => setFormData(prev => ({ ...prev, assembly: event.target.value }))} placeholder="Required" required />
          </label>
          <label>
            Caption
            <textarea value={formData.caption} onChange={event => setFormData(prev => ({ ...prev, caption: event.target.value }))} rows={4} placeholder="Tell us about this moment" />
          </label>
          <label>
            Photos or videos
            <input type="file" accept="image/*,video/*" multiple onChange={event => setFiles(Array.from(event.target.files || []))} required />
          </label>
          {files.length > 0 && (
            <p className="submission-file-count">{files.length} file{files.length === 1 ? '' : 's'} selected</p>
          )}
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
