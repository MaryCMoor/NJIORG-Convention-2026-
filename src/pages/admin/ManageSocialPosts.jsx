import { useMemo, useState } from 'react'
import { Check, Send, RefreshCw, X, Upload, Image, Video } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { reviewSocialPostSubmissionInGoogleSheet } from '../../utils/appsScriptApi'
import './ManageSchedule.css'

// Extract Google Drive file ID from various URL formats
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

// Convert Google Drive URLs to direct thumbnail/image URLs
const getDriveThumbnailUrl = (url, size = 'w1600') => {
  const id = extractDriveFileId(url)
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=${size}` : url
}

const getMediaPreviewUrl = (submission) => {
  const url = submission.videoUrl || submission.mediaUrl
  return getDriveThumbnailUrl(url)
}

const isVideoPost = (submission) => submission.videoUrl || /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(String(submission.mediaUrl || ''))

const statusTabs = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Denied' },
]

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '')
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const ManageSocialPosts = () => {
  const { sheetData, refreshSheetData } = useApp()
  const [savingId, setSavingId] = useState('')
  const [message, setMessage] = useState('')
  const [activeStatus, setActiveStatus] = useState('pending')
  const [approvingId, setApprovingId] = useState(null)
  const [approveMedia, setApproveMedia] = useState({ mediaFile: null, mediaType: 'image' })
  const submissions = sheetData.socialPostSubmissions || []

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
      const rank = { pending: 0, approved: 1, rejected: 2 }
      const statusA = rank[String(a.status || 'pending').toLowerCase()] ?? 3
      const statusB = rank[String(b.status || 'pending').toLowerCase()] ?? 3
      if (statusA !== statusB) return statusA - statusB
      return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
    })
  }, [submissions])

  const counts = useMemo(() => {
    return submissions.reduce((acc, submission) => {
      const status = String(submission.status || 'pending').toLowerCase()
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
  }, [submissions])

  const visibleSubmissions = useMemo(() => {
    return sortedSubmissions.filter(submission => String(submission.status || 'pending').toLowerCase() === activeStatus)
  }, [activeStatus, sortedSubmissions])

  const handleMediaFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setApproveMedia(prev => ({
        ...prev,
        mediaFile: file,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image'
      }))
    }
  }

  const openApproveModal = (submission) => {
    setApprovingId(submission.submissionId || submission.id)
    setApproveMedia({ mediaFile: null, mediaType: 'image' })
  }

  const closeApproveModal = () => {
    setApprovingId(null)
    setApproveMedia({ mediaFile: null, mediaType: 'image' })
  }

  const reviewSubmission = async (submission, status) => {
    if (status === 'approved' && !approveMedia.mediaFile) {
      // Open modal for media upload
      openApproveModal(submission)
      return
    }

    const submissionId = submission.submissionId || submission.id
    setSavingId(submissionId)
    setMessage('')

    try {
      const payload = { ...submission, status }
      
      // If approving with media, convert to base64
      if (status === 'approved' && approveMedia.mediaFile) {
        const fileData = await fileToBase64(approveMedia.mediaFile)
        payload.mediaFile = approveMedia.mediaFile.name
        payload.mediaType = approveMedia.mediaType
        payload.mediaData = fileData
      }

      await reviewSocialPostSubmissionInGoogleSheet(payload)
      await refreshSheetData?.()
      closeApproveModal()
      setMessage(status === 'approved' ? 'Post approved and added to Social Wall.' : 'Post rejected.')
    } catch (error) {
      console.error(error)
      setMessage(error.message || 'Could not update submission.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="manage-schedule">
      <header className="page-header">
        <div className="header-left">
          <h1 className="page-title">Social Post Submissions</h1>
          <p className="page-subtitle">Approve or reject submitted social posts before they appear on the Social Wall. {submissions.length} total submissions</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => refreshSheetData?.()}>
            <RefreshCw size={18} /><span>Refresh</span>
          </button>
        </div>
      </header>

      {message && <div className="sheet-save-message success">{message}</div>}

      <div className="submission-status-tabs" role="tablist" aria-label="Submission status">
        {statusTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeStatus === tab.id}
            className={`submission-status-tab ${activeStatus === tab.id ? 'active' : ''}`}
            onClick={() => setActiveStatus(tab.id)}
          >
            <Send size={16} />
            <span>{tab.label}</span>
            <strong>{counts[tab.id] || 0}</strong>
          </button>
        ))}
      </div>

      {visibleSubmissions.length === 0 ? (
        <section className="table-section empty-state">
          <Send size={38} />
          <p>No {statusTabs.find(tab => tab.id === activeStatus)?.label.toLowerCase()} social post submissions.</p>
        </section>
      ) : (
        <section className="submission-review-grid">
          {visibleSubmissions.map(submission => {
            const id = submission.submissionId || submission.id
            const status = String(submission.status || 'pending').toLowerCase()
            const mediaUrl = getMediaPreviewUrl(submission)
            const isVideo = isVideoPost(submission)

            return (
              <article key={id} className={`submission-review-card status-${status}`}>
                <div className="submission-review-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary)', display: 'grid', placeItems: 'center', color: 'white', flexShrink: 0 }}>
                      <Send size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className={`category-badge ${status === 'rejected' ? 'secondary' : 'primary'}`}>
                        {status === 'rejected' ? 'denied' : status}
                      </span>
                      <h2>{submission.author || 'Anonymous'}{submission.handle ? ` @${submission.handle}` : ''}</h2>
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
                        {submission.platform} · {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                      <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text)', lineHeight: 1.5 }}>
                        {submission.caption || 'No caption'}
                      </p>
                      {mediaUrl && (
                        <div style={{ marginTop: '0.75rem', maxWidth: '300px' }}>
                          {isVideo ? (
                            <video src={mediaUrl} controls playsInline style={{ width: '100%', borderRadius: 'var(--radius-md)', background: '#000' }} />
                          ) : (
                            <img src={mediaUrl} alt={submission.caption || 'Submitted post'} style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
                          )}
                        </div>
                      )}
                      {submission.postUrl && (
                        <a href={submission.postUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                          View original post →
                        </a>
                      )}
                      {submission.hashtag && (
                        <p style={{ margin: '0.5rem 0 0', fontWeight: 600, color: 'var(--color-primary)' }}>
                          {submission.hashtag}
                        </p>
                      )}
                      {submission.reviewNotes && (
                        <p className="submission-review-note">{submission.reviewNotes}</p>
                      )}
                    </div>
                  </div>
                  {status === 'pending' && (
                    <div className="submission-review-actions" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-primary" 
                        disabled={savingId === id}
                        onClick={() => reviewSubmission(submission, 'approved')}
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        disabled={savingId === id}
                        onClick={() => reviewSubmission(submission, 'rejected')}
                      >
                        <X size={16} /> Deny
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}

      {/* Approve with Media Modal */}
      {approvingId && (
        <div className="modal-overlay" onClick={closeApproveModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Approve with Media</h2>
              <button className="modal-close" onClick={closeApproveModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); reviewSubmission({ submissionId: approvingId }, 'approved'); }} className="modal-form">
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="approve-media-type">Media Type</label>
                  <select 
                    id="approve-media-type"
                    value={approveMedia.mediaType}
                    onChange={e => setApproveMedia(prev => ({ ...prev, mediaType: e.target.value }))}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div className="form-field full-width">
                  <label htmlFor="approve-media-file">
                    {approveMedia.mediaType === 'video' ? (
                      <>Upload Video <Video size={14} /></>
                    ) : (
                      <>Upload Image <Image size={14} /></>
                    )}
                  </label>
                  <input
                    type="file"
                    id="approve-media-file"
                    accept={approveMedia.mediaType === 'video' ? 'video/*' : 'image/*'}
                    onChange={handleMediaFileChange}
                    required
                  />
                  {approveMedia.mediaFile && (
                    <p className="submission-file-count">{approveMedia.mediaFile.name} ({Math.round(approveMedia.mediaFile.size / 1024)} KB)</p>
                  )}
                </div>
              </div>
              <div className="submission-review-actions" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={closeApproveModal} disabled={savingId === approvingId}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingId === approvingId || !approveMedia.mediaFile}>
                  {savingId === approvingId ? 'Approving...' : 'Approve with Media'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageSocialPosts