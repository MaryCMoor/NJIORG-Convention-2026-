import { useMemo, useState } from 'react'
import { Check, Images, RefreshCw, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { reviewGallerySubmissionInGoogleSheet } from '../../utils/appsScriptApi'
import './ManageSchedule.css'
import '../AppArea.css'

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

const getDriveThumbnailUrl = (url, size = 'w1200') => {
  const id = extractDriveFileId(url)
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=${size}` : url
}

const isVideoSubmission = (item) => item.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(String(item.mediaUrl || item.videoUrl || ''))

const statusTabs = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Denied' },
]

const ManageGallerySubmissions = () => {
  const { sheetData, refreshSheetData } = useApp()
  const [savingId, setSavingId] = useState('')
  const [message, setMessage] = useState('')
  const [activeStatus, setActiveStatus] = useState('pending')
  const submissions = sheetData.gallerySubmissions || []

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

  const reviewSubmission = async (submission, status) => {
    setSavingId(submission.submissionId || submission.id)
    setMessage('')
    try {
      await reviewGallerySubmissionInGoogleSheet({ ...submission, status })
      await refreshSheetData?.()
      setMessage(status === 'approved' ? 'Submission approved.' : 'Submission rejected.')
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
          <h1 className="page-title">Photo Submissions</h1>
          <p className="page-subtitle">Approve or reject submitted photos/videos before they appear in the public Gallery.</p>
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
            <span>{tab.label}</span>
            <strong>{counts[tab.id] || 0}</strong>
          </button>
        ))}
      </div>

      {visibleSubmissions.length === 0 ? (
        <section className="table-section empty-state">
          <Images size={38} />
          <p>No {statusTabs.find(tab => tab.id === activeStatus)?.label.toLowerCase()} photo submissions.</p>
        </section>
      ) : (
        <section className="submission-review-grid">
          {visibleSubmissions.map(submission => {
            const id = submission.submissionId || submission.id
            const status = String(submission.status || 'pending').toLowerCase()
            const isVideo = isVideoSubmission(submission)
            const src = submission.mediaUrl || submission.videoUrl || submission.imageUrl
            const displaySrc = getDriveThumbnailUrl(submission.thumbnailUrl || src)

            return (
              <article key={id} className={`submission-review-card status-${status}`}>
                <div className="submission-review-media profile-style-preview">
                  {isVideo ? (
                    <video src={src} controls playsInline />
                  ) : (
                    <img src={displaySrc} alt={submission.caption || 'Submitted gallery item'} loading="lazy" />
                  )}
                </div>
                <div className="submission-review-body">
                  <span className="category-badge primary">{status === 'rejected' ? 'denied' : status}</span>
                  <h2>{submission.caption || 'Submitted media'}</h2>
                  <p>{submission.uploaderName || 'Anonymous'}{submission.assembly ? ` • ${submission.assembly}` : ''}</p>
                  {submission.submittedAt && <p>{new Date(submission.submittedAt).toLocaleString()}</p>}
                  {submission.reviewNotes && <p className="submission-review-note">{submission.reviewNotes}</p>}
                  {status === 'pending' && (
                    <div className="submission-review-actions">
                      <button className="btn btn-primary" disabled={savingId === id} onClick={() => reviewSubmission(submission, 'approved')}>
                        <Check size={16} /> Approve
                      </button>
                      <button className="btn btn-secondary" disabled={savingId === id} onClick={() => reviewSubmission(submission, 'rejected')}>
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
    </div>
  )
}

export default ManageGallerySubmissions
