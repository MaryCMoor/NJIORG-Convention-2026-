import { useEffect, useMemo, useState } from 'react';
import {
  Search, Filter, Plus, Edit, Download, Megaphone, ChevronDown, ChevronUp, X, Eye, RefreshCw, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { loadPublishedNotificationRows, normalizeNotificationRow } from '../../utils/googleSheetData';
import { saveNotificationToGoogleSheet, updateNotificationInGoogleSheet } from '../../utils/appsScriptApi';
import './ManageAnnouncements.css';

const blankForm = () => ({
  title: '',
  message: '',
  date: new Date().toISOString().slice(0, 16),
  type: 'info',
  status: 'active',
  displayUntil: '',
  ticker: true,
});

const typeOptions = ['info', 'general', 'warning', 'emergency'];
const statusOptions = ['active', 'draft', 'archived'];
const labelize = value => String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);

const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

const fromInputDateTime = (value) => value ? new Date(value).toISOString() : '';

const isActiveAnnouncement = (announcement) => {
  if ((announcement.status || 'active') !== 'active') return false;
  if (!announcement.displayUntil) return true;
  const end = new Date(announcement.displayUntil);
  return Number.isNaN(end.getTime()) || end >= new Date();
};

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [viewAnnouncement, setViewAnnouncement] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [formData, setFormData] = useState(blankForm);

  const refreshAnnouncements = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await loadPublishedNotificationRows();
      setAnnouncements(rows.map(normalizeNotificationRow));
    } catch (error) {
      console.error(error);
      setLoadError(error.message || 'Could not load Notifications from Google Sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAnnouncements();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return announcements
      .filter(announcement => {
        const matchesSearch = !query || [announcement.title, announcement.message, announcement.body, announcement.type]
          .some(value => String(value || '').toLowerCase().includes(query));
        const matchesType = filterType === 'all' || announcement.type === filterType;
        const matchesStatus = filterStatus === 'all' || announcement.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        const valA = String(a[sortBy] || '').toLowerCase();
        const valB = String(b[sortBy] || '').toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [announcements, searchQuery, filterType, filterStatus, sortBy, sortOrder]);

  const activeTickerCount = useMemo(() => announcements.filter(item => item.ticker !== false && isActiveAnnouncement(item)).length, [announcements]);
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage) || 1;
  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAnnouncements.slice(start, start + itemsPerPage);
  }, [filteredAnnouncements, currentPage, itemsPerPage]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field) => sortBy === field
    ? (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
    : '';

  const openAddModal = () => {
    setEditingAnnouncement(null);
    setFormData(blankForm());
    setSaveStatus('idle');
    setSaveMessage('');
    setShowModal(true);
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      id: announcement.id,
      title: announcement.title || '',
      message: announcement.message || announcement.body || '',
      date: toInputDateTime(announcement.date || announcement.timestamp),
      type: announcement.type || 'info',
      status: announcement.status || 'active',
      displayUntil: toInputDateTime(announcement.displayUntil),
      ticker: announcement.ticker !== false,
    });
    setSaveStatus('idle');
    setSaveMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saveStatus === 'saving') return;
    setShowModal(false);
    setEditingAnnouncement(null);
    setSaveStatus('idle');
    setSaveMessage('');
    setFormData(blankForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveStatus('saving');
    setSaveMessage(editingAnnouncement ? 'Updating announcement...' : 'Saving announcement...');

    const payload = {
      ...formData,
      date: fromInputDateTime(formData.date) || new Date().toISOString(),
      displayUntil: fromInputDateTime(formData.displayUntil),
    };

    try {
      const result = editingAnnouncement
        ? await updateNotificationInGoogleSheet(payload)
        : await saveNotificationToGoogleSheet(payload);
      const savedAnnouncement = normalizeNotificationRow({
        ...payload,
        id: result.id || payload.id || editingAnnouncement?.id,
      });
      await refreshAnnouncements();
      setAnnouncements(prev => prev.some(item => item.id === savedAnnouncement.id)
        ? prev.map(item => item.id === savedAnnouncement.id ? savedAnnouncement : item)
        : [...prev, savedAnnouncement]);
      setShowModal(false);
      setEditingAnnouncement(null);
      setFormData(blankForm());
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      setSaveMessage(error.message || 'Announcement was not saved to Google Sheet.');
    }
  };

  const exportAnnouncements = () => {
    const headers = ['id', 'title', 'message', 'date', 'type', 'status', 'displayUntil', 'ticker'];
    const csv = [
      headers.join(','),
      ...filteredAnnouncements.map(item => headers.map(header => `"${String(item[header] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-sheet-notifications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="manage-announcements">
      <header className="page-header">
        <div className="header-left">
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Reading directly from the Google Sheet Notifications tab · {filteredAnnouncements.length} of {announcements.length} announcements · {activeTickerCount} showing in app ticker</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={refreshAnnouncements} disabled={loading}><RefreshCw size={18}/><span>{loading ? 'Refreshing...' : 'Refresh Sheet'}</span></button>
          <button className="btn btn-secondary" onClick={exportAnnouncements}><Download size={18}/><span>Export CSV</span></button>
          <button className="btn btn-primary" onClick={openAddModal}><Plus size={18}/><span>Create Announcement</span></button>
        </div>
      </header>

      {loadError && <div className="sheet-save-message error">{loadError}</div>}

      <section className="filters-section">
        <div className="search-box"><Search size={20} className="search-icon"/><input type="text" placeholder="Search announcements..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="search-input"/></div>
        <div className="filter-toggle"><button className={`btn btn-outline ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}><Filter size={18}/><span>Filters</span><ChevronDown size={16} className={showFilters ? 'rotated' : ''}/></button></div>
        {showFilters && (
          <div className="filters-panel"><div className="filter-row">
            <select value={filterType} onChange={event => setFilterType(event.target.value)} className="filter-select"><option value="all">All Types</option>{typeOptions.map(type => <option key={type} value={type}>{labelize(type)}</option>)}</select>
            <select value={filterStatus} onChange={event => setFilterStatus(event.target.value)} className="filter-select"><option value="all">All Statuses</option>{statusOptions.map(status => <option key={status} value={status}>{labelize(status)}</option>)}</select>
          </div></div>
        )}
      </section>

      <section className="table-section">
        <div className="table-wrapper"><table className="data-table" role="grid"><thead><tr>
          <th><button className="sortable-header" onClick={() => handleSort('title')}>Title <span className="sort-icon">{renderSortIcon('title')}</span></button></th>
          <th><button className="sortable-header" onClick={() => handleSort('type')}>Type <span className="sort-icon">{renderSortIcon('type')}</span></button></th>
          <th><button className="sortable-header" onClick={() => handleSort('status')}>Status <span className="sort-icon">{renderSortIcon('status')}</span></button></th>
          <th><button className="sortable-header" onClick={() => handleSort('date')}>Date <span className="sort-icon">{renderSortIcon('date')}</span></button></th>
          <th><button className="sortable-header" onClick={() => handleSort('displayUntil')}>Display Until <span className="sort-icon">{renderSortIcon('displayUntil')}</span></button></th>
          <th>Ticker</th>
          <th>Actions</th>
        </tr></thead><tbody>
          {loading ? (
            <tr><td colSpan={7} className="empty-state"><Megaphone size={32}/><p>Loading Google Sheet notifications...</p></td></tr>
          ) : paginatedAnnouncements.length === 0 ? (
            <tr><td colSpan={7} className="empty-state"><Info size={32}/><p>No notifications found in the Google Sheet.</p><button className="btn btn-primary" onClick={openAddModal}><Plus size={16}/>Create First</button></td></tr>
          ) : (
            paginatedAnnouncements.map(item => <tr key={item.id}>
              <td className="title-cell"><div className="ann-title">{item.title}</div>{(item.message || item.body) && <div className="ann-desc">{item.message || item.body}</div>}</td>
              <td><span className="category-tag">{labelize(item.type)}</span></td>
              <td><span className={`status-badge status-${item.status || 'active'}`}>{labelize(item.status || 'active')}</span></td>
              <td>{item.date ? new Date(item.date).toLocaleString() : '—'}</td>
              <td>{item.displayUntil ? new Date(item.displayUntil).toLocaleString() : 'No end time'}</td>
              <td><span className={`pin-status ${item.ticker !== false ? 'pinned' : ''}`}>{item.ticker !== false ? 'Yes' : 'No'}</span></td>
              <td><div className="action-buttons"><button className="icon-btn view" onClick={() => setViewAnnouncement(item)}><Eye size={16}/></button><button className="icon-btn edit" onClick={() => openEditModal(item)}><Edit size={16}/></button></div></td>
            </tr>)
          )}
        </tbody></table></div>
        {totalPages > 1 && <nav className="pagination" aria-label="Pagination"><button className="page-btn" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Previous"><ChevronLeft size={18}/></button><div className="page-info">Page {currentPage} of {totalPages} ({filteredAnnouncements.length} total)</div><button className="page-btn" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} aria-label="Next"><ChevronRight size={18}/></button></nav>}
      </section>

      {showModal && <div className="modal-overlay" onClick={closeModal}><div className="modal" onClick={event => event.stopPropagation()}><div className="modal-header"><h2 className="modal-title">{editingAnnouncement ? 'Edit Announcement in Google Sheet' : 'Create Announcement'}</h2><button className="modal-close" onClick={closeModal}><X size={20}/></button></div><form onSubmit={handleSubmit} className="modal-form"><div className="form-grid"><div className="form-field"><label htmlFor="title">Title *</label><input type="text" id="title" value={formData.title} onChange={event => setFormData({...formData, title: event.target.value})} required/></div><div className="form-field"><label htmlFor="type">Type</label><select id="type" value={formData.type} onChange={event => setFormData({...formData, type: event.target.value})}>{typeOptions.map(type => <option key={type} value={type}>{labelize(type)}</option>)}</select></div><div className="form-field"><label htmlFor="status">Status</label><select id="status" value={formData.status} onChange={event => setFormData({...formData, status: event.target.value})}>{statusOptions.map(status => <option key={status} value={status}>{labelize(status)}</option>)}</select></div><div className="form-field"><label htmlFor="date">Start Showing</label><input type="datetime-local" id="date" value={formData.date} onChange={event => setFormData({...formData, date: event.target.value})}/></div><div className="form-field"><label htmlFor="displayUntil">Stop Showing</label><input type="datetime-local" id="displayUntil" value={formData.displayUntil} onChange={event => setFormData({...formData, displayUntil: event.target.value})}/></div><div className="form-field"><label><input type="checkbox" checked={formData.ticker} onChange={event => setFormData({...formData, ticker: event.target.checked})}/> Show in top ticker</label></div><div className="form-field full-width"><label htmlFor="message">Message *</label><textarea id="message" value={formData.message} onChange={event => setFormData({...formData, message: event.target.value})} rows={4} required/></div></div>{saveMessage && <div className={`sheet-save-message ${saveStatus}`}>{saveMessage}</div>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saveStatus === 'saving'}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Saving...' : (editingAnnouncement ? 'Update Google Sheet' : 'Create Announcement')}</button></div></form></div></div>}

      {viewAnnouncement && <div className="modal-overlay" onClick={() => setViewAnnouncement(null)}><div className="modal modal-lg" onClick={event => event.stopPropagation()}><div className="modal-header"><h2 className="modal-title">Announcement Details</h2><button className="modal-close" onClick={() => setViewAnnouncement(null)}><X size={20}/></button></div><div className="modal-body"><div className="view-grid"><div className="view-section"><h4>Content</h4><dl><dt>Title</dt><dd>{viewAnnouncement.title}</dd><dt>Message</dt><dd>{viewAnnouncement.message || viewAnnouncement.body}</dd></dl></div><div className="view-section"><h4>Display</h4><dl><dt>Type</dt><dd>{labelize(viewAnnouncement.type)}</dd><dt>Status</dt><dd>{labelize(viewAnnouncement.status || 'active')}</dd><dt>Start</dt><dd>{viewAnnouncement.date ? new Date(viewAnnouncement.date).toLocaleString() : '—'}</dd><dt>Stop</dt><dd>{viewAnnouncement.displayUntil ? new Date(viewAnnouncement.displayUntil).toLocaleString() : 'No end time'}</dd><dt>Ticker</dt><dd>{viewAnnouncement.ticker !== false ? 'Yes' : 'No'}</dd></dl></div></div></div><div className="modal-actions"><button className="btn btn-secondary" onClick={() => setViewAnnouncement(null)}>Close</button><button className="btn btn-primary" onClick={() => { setViewAnnouncement(null); openEditModal(viewAnnouncement); }}><Edit size={16}/> Edit</button></div></div></div>}
    </div>
  );
};

export default ManageAnnouncements;
