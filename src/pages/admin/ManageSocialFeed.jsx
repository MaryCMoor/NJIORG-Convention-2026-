import { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Download, ChevronDown, ChevronUp, X, Eye, Edit, RefreshCw, ChevronLeft, ChevronRight, Hash
} from 'lucide-react';
import {
  loadSocialPostsFromGoogleSheet,
  saveSocialPostToGoogleSheet,
  updateSocialPostInGoogleSheet,
} from '../../utils/appsScriptApi';
import './ManageSchedule.css';

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

const getMediaPreviewUrl = (post) => {
  const url = post.videoUrl || post.mediaUrl
  return getDriveThumbnailUrl(url)
}

const blankForm = () => ({
  platform: 'Instagram',
  author: '',
  handle: '',
  postUrl: '',
  caption: '',
  mediaUrl: '',
  videoUrl: '',
  hashtag: '',
  postedAt: '',
  likes: 0,
  comments: 0,
  status: 'active',
});

const platformOptions = ['Instagram', 'Facebook', 'TikTok', 'X/Twitter', 'YouTube', 'Other'];
const statusOptions = ['active', 'inactive'];

const normalizeSocialPostForAdmin = (post, index = 0) => ({
  id: post.postId || post.id || `social-${index + 1}`,
  postId: post.postId || post.id || '',
  platform: post.platform || 'Instagram',
  author: post.author || '',
  handle: post.handle || '',
  postUrl: post.postUrl || '',
  caption: post.caption || post.text || '',
  mediaUrl: post.mediaUrl || '',
  videoUrl: post.videoUrl || '',
  hashtag: post.hashtag || '',
  postedAt: post.postedAt || post.date || '',
  likes: post.likes || 0,
  comments: post.comments || 0,
  status: post.status || 'active',
});

const sortValue = (post, field) => String(post[field] || '').toLowerCase();

const toDatetimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 16);
};

const ManageSocialFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('postedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [viewPost, setViewPost] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sheetSaveStatus, setSheetSaveStatus] = useState('idle');
  const [sheetSaveMessage, setSheetSaveMessage] = useState('');
  const [formData, setFormData] = useState(blankForm);

  const refreshPosts = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await loadSocialPostsFromGoogleSheet();
      setPosts(rows.map(normalizeSocialPostForAdmin));
    } catch (error) {
      console.error(error);
      setLoadError(error.message || 'Could not load SocialPosts from Google Sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts
      .filter(post => {
        const q = searchQuery.toLowerCase();
        return !q || [post.platform, post.author, post.handle, post.caption, post.hashtag, post.status]
          .some(value => String(value || '').toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const primaryA = sortValue(a, sortBy);
        const primaryB = sortValue(b, sortBy);
        if (primaryA < primaryB) return sortOrder === 'asc' ? -1 : 1;
        if (primaryA > primaryB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [posts, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage) || 1;
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPosts.slice(start, start + itemsPerPage);
  }, [filteredPosts, currentPage, itemsPerPage]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder(field === 'postedAt' ? 'desc' : 'asc');
    }
  };

  const openAddModal = () => {
    setFormData(blankForm());
    setEditingPost(null);
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setShowModal(true);
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setFormData({
      postId: post.postId || post.id,
      platform: post.platform || 'Instagram',
      author: post.author || '',
      handle: post.handle || '',
      postUrl: post.postUrl || '',
      caption: post.caption || '',
      mediaUrl: post.mediaUrl || '',
      videoUrl: post.videoUrl || '',
      hashtag: post.hashtag || '',
      postedAt: toDatetimeLocal(post.postedAt),
      likes: post.likes || 0,
      comments: post.comments || 0,
      status: post.status || 'active',
    });
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (sheetSaveStatus === 'saving') return;
    setShowModal(false);
    setEditingPost(null);
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setFormData(blankForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSheetSaveStatus('saving');
    setSheetSaveMessage(editingPost ? 'Updating social post in Google Sheet...' : 'Saving social post to Google Sheet...');

    try {
      const payload = {
        ...formData,
        likes: Number(formData.likes) || 0,
        comments: Number(formData.comments) || 0,
      };
      const result = editingPost
        ? await updateSocialPostInGoogleSheet(payload)
        : await saveSocialPostToGoogleSheet(payload);
      const savedPost = normalizeSocialPostForAdmin({
        ...payload,
        postId: result.postId || payload.postId || editingPost?.postId,
      });

      await refreshPosts();
      setPosts(prev => prev.some(item => item.id === savedPost.id)
        ? prev.map(item => item.id === savedPost.id ? savedPost : item)
        : [...prev, savedPost]);
      setSheetSaveStatus('success');
      setSheetSaveMessage(editingPost ? 'Social post updated in Google Sheet.' : 'Social post saved to Google Sheet.');
      setShowModal(false);
      setEditingPost(null);
      setFormData(blankForm());
    } catch (error) {
      console.error(error);
      setSheetSaveStatus('error');
      setSheetSaveMessage(error.message || 'Social post was not saved to Google Sheet.');
    }
  };

  const exportPosts = () => {
    const headers = ['postId', 'platform', 'author', 'handle', 'postUrl', 'caption', 'mediaUrl', 'videoUrl', 'hashtag', 'postedAt', 'likes', 'comments', 'status'];
    const csv = [
      headers.join(','),
      ...filteredPosts.map(post => headers.map(header => `"${String(post[header] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-sheet-social-posts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSortIcon = (field) => sortBy === field
    ? (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
    : '';

  return (
    <div className="manage-schedule">
      <header className="page-header">
        <div className="header-left">
          <h1 className="page-title">Social Feed</h1>
          <p className="page-subtitle">Add curated posts with author, date/time, likes, comments, media, and a link to the original post.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={refreshPosts} disabled={loading}>
            <RefreshCw size={18} /><span>{loading ? 'Refreshing...' : 'Refresh Sheet'}</span>
          </button>
          <button className="btn btn-secondary" onClick={exportPosts}>
            <Download size={18} /><span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /><span>Add Post</span>
          </button>
        </div>
      </header>

      {loadError && <div className="sheet-save-message error">{loadError}</div>}

      <section className="filters-section">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search social posts..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="search-input"
          />
        </div>
      </section>

      <section className="table-section">
        <div className="table-wrapper">
          <table className="data-table" role="grid">
            <thead>
              <tr>
                <th className="row-action-heading">Edit</th>
                <th><button className="sortable-header" onClick={() => handleSort('platform')}>Platform <span className="sort-icon">{renderSortIcon('platform')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('author')}>Author <span className="sort-icon">{renderSortIcon('author')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('postedAt')}>Posted <span className="sort-icon">{renderSortIcon('postedAt')}</span></button></th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="empty-state"><RefreshCw size={32}/><p>Loading SocialPosts tab...</p></td></tr>
              ) : paginatedPosts.length === 0 ? (
                <tr><td colSpan={8} className="empty-state"><Hash size={32}/><p>No social posts found yet.</p><button className="btn btn-primary" onClick={openAddModal}><Plus size={16}/>Add First Post</button></td></tr>
              ) : (
                paginatedPosts.map(post => (
                  <tr key={post.id}>
                    <td className="row-action-cell"><button className="icon-btn edit" onClick={() => openEditModal(post)} aria-label={`Edit ${post.caption || post.author}`}><Edit size={16}/></button></td>
                    <td>{post.platform || '—'}</td>
                    <td className="title-cell"><div className="event-title">{post.author || post.handle || '—'}</div>{post.caption && <div className="event-desc">{post.caption.slice(0, 90)}{post.caption.length > 90 ? '…' : ''}</div>}</td>
                    <td>{post.postedAt || '—'}</td>
                    <td>{post.likes || 0}</td>
                    <td>{post.comments || 0}</td>
                    <td><span className="category-badge primary">{post.status || 'active'}</span></td>
                    <td><div className="action-buttons"><button className="icon-btn view" onClick={() => setViewPost(post)} aria-label="View post"><Eye size={16}/></button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <nav className="pagination" aria-label="Pagination"><button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous"><ChevronLeft size={18}/></button><div className="page-info">Page {currentPage} of {totalPages} ({filteredPosts.length} total)</div><button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next"><ChevronRight size={18}/></button></nav>}
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPost ? 'Edit Social Post' : 'Add Social Post'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-field"><label htmlFor="platform">Platform</label><select id="platform" value={formData.platform} onChange={event => setFormData({...formData, platform: event.target.value})}>{platformOptions.map(platform => <option key={platform} value={platform}>{platform}</option>)}</select></div>
                <div className="form-field"><label htmlFor="status">Status</label><select id="status" value={formData.status} onChange={event => setFormData({...formData, status: event.target.value})}>{statusOptions.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
                <div className="form-field"><label htmlFor="author">Posted By</label><input type="text" id="author" value={formData.author} onChange={event => setFormData({...formData, author: event.target.value})} placeholder="Name or account" /></div>
                <div className="form-field"><label htmlFor="handle">Handle</label><input type="text" id="handle" value={formData.handle} onChange={event => setFormData({...formData, handle: event.target.value})} placeholder="@handle" /></div>
                <div className="form-field full-width"><label htmlFor="postUrl">Post URL *</label><input type="url" id="postUrl" value={formData.postUrl} onChange={event => setFormData({...formData, postUrl: event.target.value})} required placeholder="https://..." /></div>
                <div className="form-field"><label htmlFor="postedAt">Day / Time Posted</label><input type="datetime-local" id="postedAt" value={formData.postedAt} onChange={event => setFormData({...formData, postedAt: event.target.value})} /></div>
                <div className="form-field"><label htmlFor="hashtag">Hashtag</label><input type="text" id="hashtag" value={formData.hashtag} onChange={event => setFormData({...formData, hashtag: event.target.value})} placeholder="#NJIORG_Convention2026" /></div>
                <div className="form-field"><label htmlFor="likes">Likes</label><input type="number" min="0" id="likes" value={formData.likes} onChange={event => setFormData({...formData, likes: event.target.value})} /></div>
                <div className="form-field"><label htmlFor="comments">Comments</label><input type="number" min="0" id="comments" value={formData.comments} onChange={event => setFormData({...formData, comments: event.target.value})} /></div>
                <div className="form-field full-width"><label htmlFor="mediaUrl">Image URL</label><input type="url" id="mediaUrl" value={formData.mediaUrl} onChange={event => setFormData({...formData, mediaUrl: event.target.value})} placeholder="Optional image URL" /></div>
                <div className="form-field full-width"><label htmlFor="videoUrl">Video URL</label><input type="url" id="videoUrl" value={formData.videoUrl} onChange={event => setFormData({...formData, videoUrl: event.target.value})} placeholder="Optional direct video URL" /></div>
                <div className="form-field full-width"><label htmlFor="caption">Post Text / Caption</label><textarea id="caption" value={formData.caption} onChange={event => setFormData({...formData, caption: event.target.value})} rows={5} /></div>
              </div>
              {sheetSaveMessage && <div className={`sheet-save-message ${sheetSaveStatus}`}>{sheetSaveMessage}</div>}
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={closeModal} disabled={sheetSaveStatus === 'saving'}>Cancel</button><button type="submit" className="btn btn-primary" disabled={sheetSaveStatus === 'saving'}>{sheetSaveStatus === 'saving' ? 'Saving...' : editingPost ? 'Update Post' : 'Add Post'}</button></div>
            </form>
          </div>
        </div>
      )}

      {viewPost && (
        <div className="modal-overlay" onClick={() => setViewPost(null)}>
          <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Social Post Details</h2><button className="modal-close" onClick={() => setViewPost(null)}><X size={20}/></button></div>
            <div className="modal-body">
              <div className="view-grid">
                <div className="view-section full-width">
                  <h4>Media Preview</h4>
                  {viewPost.videoUrl ? (
                    <video src={getMediaPreviewUrl(viewPost)} controls playsInline style={{maxWidth:'100%',borderRadius:'var(--radius-md)'}} />
                  ) : viewPost.mediaUrl ? (
                    <img src={getMediaPreviewUrl(viewPost)} alt={viewPost.caption || 'Social post'} style={{maxWidth:'100%',borderRadius:'var(--radius-md)'}} />
                  ) : (
                    <p className="empty-preview">No media attached</p>
                  )}
                </div>
                <div className="view-section"><h4>Platform</h4><p>{viewPost.platform || '—'}</p></div>
                <div className="view-section"><h4>Posted By</h4><p>{viewPost.author || viewPost.handle || '—'}</p></div>
                <div className="view-section full-width"><h4>Post URL</h4><p>{viewPost.postUrl || '—'}</p></div>
                <div className="view-section full-width"><h4>Caption</h4><p>{viewPost.caption || '—'}</p></div>
              </div>
            </div>
            <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setViewPost(null)}>Close</button><button className="btn btn-primary" onClick={() => { setViewPost(null); openEditModal(viewPost); }}><Edit size={16}/> Edit</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSocialFeed;
