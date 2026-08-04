import { useMemo, useState } from 'react'
import { Check, Send, RefreshCw, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { reviewSocialPostSubmissionInGoogleSheet } from '../../utils/appsScriptApi'
import './ManageSchedule.css'

const statusTabs = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Denied' },
]

const ManageSocialPosts = () => {
  const { sheetData, refreshSheetData } = useApp()
  const [savingId, setSavingId] = useState('')
  const [message, setMessage] = useState('')
  const [activeStatus, setActiveStatus] = useState('pending')
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

  const reviewSubmission = async (submission, status) => {
    setSavingId(submission.submissionId || submission.id)
    setMessage('')
    try {
      await reviewSocialPostSubmissionInGoogleSheet({ ...submission, status })
      await refreshSheetData?.()
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
                      <h2 style={{ margin: '0.25rem 0 0' }}>{submission.author || 'Anonymous'}{submission.handle ? ` @${submission.handle}` : ''}</h2>
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
                        {submission.platform} · {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                      <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text)', lineHeight: 1.5 }}>
                        {submission.caption || 'No caption'}
                      </p>
                      {submission.postUrl && (
                        <a href={submission.postUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                          View original post →
                        </a>
                      )}
                    </div>
                  </div>
                  {submission.hashtag && (
                    <p style={{ margin: '0.5rem 0 0', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {submission.hashtag}
                    </p>
                  )}
                  {submission.reviewNotes && (
                    <p className="submission-review-note">{submission.reviewNotes}</p>
                  )}
                  {status === 'pending' && (
                    <div className="submission-review-actions" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

export default ManageSocialPosts