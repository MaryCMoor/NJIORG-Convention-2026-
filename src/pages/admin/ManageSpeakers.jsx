import { useEffect, useMemo, useState } from 'react';
import {
  Search, Filter, Plus, Download, ChevronDown, ChevronUp, X, Eye, Edit, RefreshCw, ChevronLeft, ChevronRight, Mic
} from 'lucide-react';
import {
  loadPublishedEventRows,
  loadPublishedSpeakerRows,
  normalizeSheetRowForAdminSchedule,
  normalizeSheetRowForAdminSpeaker,
} from '../../utils/googleSheetData';
import { saveSpeakerToGoogleSheet, updateSpeakerInGoogleSheet } from '../../utils/appsScriptApi';
import './ManageSchedule.css';

const blankForm = () => ({
  name: '',
  title: '',
  photo: '',
  bio: '',
  event: '',
  memberId: '',
});

const sortValue = (speaker, field) => String(speaker[field] || '').toLowerCase();

const splitEventTags = (value) => String(value || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);

const eventOptionLabel = (event) => [
  event.day,
  event.time,
  event.title,
].filter(Boolean).join(' · ');

const ManageSpeakers = () => {
  const [speakers, setSpeakers] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [viewSpeaker, setViewSpeaker] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sheetSaveStatus, setSheetSaveStatus] = useState('idle');
  const [sheetSaveMessage, setSheetSaveMessage] = useState('');
  const [formData, setFormData] = useState(blankForm);

  const refreshSpeakers = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [speakerRows, eventRows] = await Promise.all([
        loadPublishedSpeakerRows(),
        loadPublishedEventRows(),
      ]);
      setSpeakers(speakerRows.map(normalizeSheetRowForAdminSpeaker));
      setEventOptions(eventRows.map(normalizeSheetRowForAdminSchedule));
    } catch (error) {
      console.error(error);
      setLoadError(error.message || 'Could not load Speakers from Google Sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSpeakers();
  }, []);

  const eventLabelByTag = useMemo(() => {
    const map = new Map();
    eventOptions.forEach(event => {
      const label = eventOptionLabel(event);
      if (event.eventId) map.set(String(event.eventId), label);
      if (event.title) map.set(String(event.title), label);
    });
    return map;
  }, [eventOptions]);

  const formatSpeakerEvents = (value) => {
    const tags = splitEventTags(value);
    if (!tags.length) return '—';
    return tags.map(tag => eventLabelByTag.get(tag) || tag).join(', ');
  };

  const filteredSpeakers = useMemo(() => {
    return speakers
      .filter(speaker => {
        const q = searchQuery.toLowerCase();
        return !q || [speaker.name, speaker.title, speaker.bio, speaker.event]
          .some(value => String(value || '').toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const primaryA = sortValue(a, sortBy);
        const primaryB = sortValue(b, sortBy);
        if (primaryA < primaryB) return sortOrder === 'asc' ? -1 : 1;
        if (primaryA > primaryB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [speakers, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredSpeakers.length / itemsPerPage) || 1;
  const paginatedSpeakers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSpeakers.slice(start, start + itemsPerPage);
  }, [filteredSpeakers, currentPage, itemsPerPage]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const openAddModal = () => {
    setFormData(blankForm());
    setEditingSpeaker(null);
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setShowModal(true);
  };

  const openEditModal = (speaker) => {
    setEditingSpeaker(speaker);
    setFormData({
      speakerId: speaker.speakerId || speaker.id,
      memberId: speaker.memberId || '',
      name: speaker.name || '',
      title: speaker.title || '',
      photo: speaker.photo || '',
      bio: speaker.bio || '',
      event: speaker.event || '',
    });
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (sheetSaveStatus === 'saving') return;
    setShowModal(false);
    setEditingSpeaker(null);
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setFormData(blankForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSheetSaveStatus('saving');
    setSheetSaveMessage(editingSpeaker ? 'Updating speaker in Google Sheet...' : 'Saving speaker to Google Sheet...');

    try {
      const result = editingSpeaker
        ? await updateSpeakerInGoogleSheet(formData)
        : await saveSpeakerToGoogleSheet(formData);
      const savedSpeaker = normalizeSheetRowForAdminSpeaker({
        ...formData,
        speakerId: result.speakerId || formData.speakerId || editingSpeaker?.speakerId,
      });

      await refreshSpeakers();
      setSpeakers(prev => prev.some(item => item.id === savedSpeaker.id)
        ? prev.map(item => item.id === savedSpeaker.id ? savedSpeaker : item)
        : [...prev, savedSpeaker]);
      setSheetSaveStatus('success');
      setSheetSaveMessage(editingSpeaker ? 'Speaker updated in Google Sheet.' : 'Speaker saved to Google Sheet.');
      setShowModal(false);
      setEditingSpeaker(null);
      setFormData(blankForm());
    } catch (error) {
      console.error(error);
      setSheetSaveStatus('error');
      setSheetSaveMessage(error.message || 'Speaker was not saved to Google Sheet.');
    }
  };

  const exportSpeakers = () => {
    const headers = ['speakerId', 'memberId', 'name', 'title', 'photo', 'bio', 'event'];
    const csv = [
      headers.join(','),
      ...filteredSpeakers.map(speaker => headers.map(header => `"${String(speaker[header] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-sheet-speakers-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="page-title">Speakers</h1>
          <p className="page-subtitle">Reading directly from the Google Sheet Speakers tab · {filteredSpeakers.length} of {speakers.length} speakers</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={refreshSpeakers} disabled={loading}>
            <RefreshCw size={18} /><span>{loading ? 'Refreshing...' : 'Refresh Sheet'}</span>
          </button>
          <button className="btn btn-secondary" onClick={exportSpeakers}>
            <Download size={18} /><span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /><span>Add Speaker</span>
          </button>
        </div>
      </header>

      {loadError && <div className="sheet-save-message error">{loadError}</div>}

      <section className="filters-section">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search Google Sheet speakers..."
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
                <th><button className="sortable-header" onClick={() => handleSort('name')}>Name <span className="sort-icon">{renderSortIcon('name')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('title')}>Title <span className="sort-icon">{renderSortIcon('title')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('event')}>Event <span className="sort-icon">{renderSortIcon('event')}</span></button></th>
                <th>Bio</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="empty-state"><RefreshCw size={32}/><p>Loading Speakers tab...</p></td></tr>
              ) : paginatedSpeakers.length === 0 ? (
                <tr><td colSpan={6} className="empty-state"><Mic size={32}/><p>No speakers found in the Google Sheet.</p><button className="btn btn-primary" onClick={openAddModal}><Plus size={16}/>Add First Speaker</button></td></tr>
              ) : (
                paginatedSpeakers.map(speaker => (
                  <tr key={speaker.id}>
                    <td className="row-action-cell"><button className="icon-btn edit" onClick={() => openEditModal(speaker)} aria-label={`Edit ${speaker.name}`}><Edit size={16}/></button></td>
                    <td className="title-cell"><div className="event-title">{speaker.name || '—'}</div></td>
                    <td>{speaker.title || '—'}</td>
                    <td>{formatSpeakerEvents(speaker.event)}</td>
                    <td>{speaker.bio ? 'Yes' : '—'}</td>
                    <td><div className="action-buttons"><button className="icon-btn view" onClick={() => setViewSpeaker(speaker)} aria-label={`View ${speaker.name}`}><Eye size={16}/></button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <nav className="pagination" aria-label="Pagination"><button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous"><ChevronLeft size={18}/></button><div className="page-info">Page {currentPage} of {totalPages} ({filteredSpeakers.length} total)</div><button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next"><ChevronRight size={18}/></button></nav>}
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingSpeaker ? 'Edit Speaker' : 'Add Speaker'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-field"><label htmlFor="speakerName">Name *</label><input type="text" id="speakerName" value={formData.name} onChange={event => setFormData({...formData, name: event.target.value})} required /></div>
                <div className="form-field"><label htmlFor="speakerTitle">Title *</label><input type="text" id="speakerTitle" value={formData.title} onChange={event => setFormData({...formData, title: event.target.value})} required /></div>
                <div className="form-field full-width"><label htmlFor="speakerPhoto">Photo URL</label><input type="url" id="speakerPhoto" value={formData.photo} onChange={event => setFormData({...formData, photo: event.target.value})} placeholder="https://..." /></div>
                <div className="form-field full-width"><label htmlFor="speakerEvent">Events Where Speaker Is Speaking</label><select id="speakerEvent" multiple size={Math.min(Math.max(eventOptions.length, 3), 8)} value={splitEventTags(formData.event)} onChange={event => setFormData({...formData, event: Array.from(event.target.selectedOptions).map(option => option.value).join(', ')})}>{eventOptions.map(event => <option key={event.eventId || event.id} value={event.eventId || event.id}>{eventOptionLabel(event)}</option>)}</select><p className="field-help">Hold Ctrl/Command to select more than one event. These connect the speaker to the public Speaker page and schedule tags.</p></div>
                <div className="form-field full-width"><label htmlFor="speakerBio">Additional Speaker Info</label><textarea id="speakerBio" value={formData.bio} onChange={event => setFormData({...formData, bio: event.target.value})} rows={5} /></div>
              </div>
              {sheetSaveMessage && <div className={`sheet-save-message ${sheetSaveStatus}`}>{sheetSaveMessage}</div>}
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={closeModal} disabled={sheetSaveStatus === 'saving'}>Cancel</button><button type="submit" className="btn btn-primary" disabled={sheetSaveStatus === 'saving'}>{sheetSaveStatus === 'saving' ? 'Saving...' : editingSpeaker ? 'Update Speaker' : 'Add Speaker'}</button></div>
            </form>
          </div>
        </div>
      )}

      {viewSpeaker && (
        <div className="modal-overlay" onClick={() => setViewSpeaker(null)}>
          <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Speaker Details</h2><button className="modal-close" onClick={() => setViewSpeaker(null)}><X size={20}/></button></div>
            <div className="modal-body"><div className="view-grid"><div className="view-section"><h4>Name</h4><p>{viewSpeaker.name || '—'}</p></div><div className="view-section"><h4>Title</h4><p>{viewSpeaker.title || '—'}</p></div><div className="view-section full-width"><h4>Event</h4><p>{formatSpeakerEvents(viewSpeaker.event)}</p></div><div className="view-section full-width"><h4>Bio</h4><p>{viewSpeaker.bio || '—'}</p></div></div></div>
            <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setViewSpeaker(null)}>Close</button><button className="btn btn-primary" onClick={() => { setViewSpeaker(null); openEditModal(viewSpeaker); }}><Edit size={16}/> Edit</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSpeakers;
