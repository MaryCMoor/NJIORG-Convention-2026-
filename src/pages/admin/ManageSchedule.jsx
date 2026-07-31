import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Filter, Plus, Download, Calendar, ChevronDown, ChevronUp, X, Info, Eye, Edit, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ADMIN_CONFIG } from '../../config/admin';
import { loadPublishedEventRows, normalizeSheetRowForAdminSchedule } from '../../utils/googleSheetData';
import { saveEventToGoogleSheet, updateEventInGoogleSheet } from '../../utils/appsScriptApi';
import './ManageSchedule.css';

const blankForm = () => ({
  title: '',
  day: 'Friday',
  time: '',
  timeEnd: '',
  location: '',
  description: '',
  type: 'General',
  speaker: '',
});

const dayOptions = ['Friday', 'Saturday', 'Sunday'];
const typeOptions = ['General', 'Ceremony', 'Workshop', 'Meal', 'Entertainment', 'Meeting', 'Competition', 'Social'];

const sortValue = (event, field) => String(event[field] || '').toLowerCase();

const ManageSchedule = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('day');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [sheetSaveStatus, setSheetSaveStatus] = useState('idle');
  const [sheetSaveMessage, setSheetSaveMessage] = useState('');
  const [formData, setFormData] = useState(blankForm);

  const refreshEvents = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await loadPublishedEventRows();
      setEvents(rows.map(normalizeSheetRowForAdminSchedule));
    } catch (error) {
      console.error(error);
      setLoadError(error.message || 'Could not load Events from Google Sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEvents();
  }, []);

  useEffect(() => {
    if (location.pathname.endsWith('/schedule/new')) {
      openAddModal();
      navigate(`${ADMIN_CONFIG.routePrefix}/schedule`, { replace: true });
    }
  }, [location.pathname, navigate]);

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || [event.title, event.description, event.location, event.speaker, event.type]
          .some(value => String(value || '').toLowerCase().includes(q));
        const matchesDay = filterDay === 'all' || event.day === filterDay;
        const matchesType = filterType === 'all' || event.type === filterType;
        return matchesSearch && matchesDay && matchesType;
      })
      .sort((a, b) => {
        const primaryA = sortBy === 'time' ? `${a.day} ${a.time}` : sortValue(a, sortBy);
        const primaryB = sortBy === 'time' ? `${b.day} ${b.time}` : sortValue(b, sortBy);
        if (primaryA < primaryB) return sortOrder === 'asc' ? -1 : 1;
        if (primaryA > primaryB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [events, searchQuery, filterDay, filterType, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage, itemsPerPage]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const openAddModal = () => {
    setFormData(blankForm());
    setEditingEvent(null);
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      day: event.day || 'Friday',
      time: event.time || '',
      timeEnd: event.timeEnd || '',
      location: event.location || '',
      description: event.description || '',
      type: event.type || 'General',
      speaker: event.speaker || '',
      eventId: event.eventId || event.id,
    });
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (sheetSaveStatus === 'saving') return;
    setShowModal(false);
    setEditingEvent(null);
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setFormData(blankForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSheetSaveStatus('saving');
    setSheetSaveMessage(editingEvent ? 'Updating event in Google Sheet...' : 'Saving event to Google Sheet...');

    try {
      const result = editingEvent
        ? await updateEventInGoogleSheet(formData)
        : await saveEventToGoogleSheet(formData);
      const savedEvent = normalizeSheetRowForAdminSchedule({
        ...formData,
        eventId: result.eventId || formData.eventId || editingEvent?.eventId,
        dateCreated: result.dateCreated || editingEvent?.dateCreated,
      });

      await refreshEvents();
      setEvents(prev => prev.some(item => item.id === savedEvent.id)
        ? prev.map(item => item.id === savedEvent.id ? savedEvent : item)
        : [...prev, savedEvent]);
      setSheetSaveStatus('success');
      setSheetSaveMessage(editingEvent ? 'Event updated in Google Sheet.' : 'Event saved to Google Sheet.');
      setShowModal(false);
      setEditingEvent(null);
      setFormData(blankForm());
    } catch (error) {
      console.error(error);
      setSheetSaveStatus('error');
      setSheetSaveMessage(error.message || 'Event was not saved to Google Sheet.');
    }
  };

  const exportSchedule = () => {
    const headers = ['eventId', 'title', 'day', 'time', 'timeEnd', 'location', 'description', 'type', 'speaker', 'dateCreated'];
    const csv = [
      headers.join(','),
      ...filteredEvents.map(event => headers.map(header => `"${String(event[header] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-sheet-events-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="page-title">Manage Schedule</h1>
          <p className="page-subtitle">Reading directly from the Google Sheet Events tab · {filteredEvents.length} of {events.length} events</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={refreshEvents} disabled={loading}>
            <RefreshCw size={18} /><span>{loading ? 'Refreshing...' : 'Refresh Sheet'}</span>
          </button>
          <button className="btn btn-secondary" onClick={exportSchedule}>
            <Download size={18} /><span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /><span>Add Event</span>
          </button>
        </div>
      </header>

      {loadError && <div className="sheet-save-message error">{loadError}</div>}

      <section className="filters-section">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search Google Sheet events..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-toggle">
          <button className={`btn btn-outline ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} /><span>Filters</span><ChevronDown size={16} className={showFilters ? 'rotated' : ''}/>
          </button>
        </div>
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-row">
              <select value={filterDay} onChange={event => setFilterDay(event.target.value)} className="filter-select">
                <option value="all">All Days</option>
                {dayOptions.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
              <select value={filterType} onChange={event => setFilterType(event.target.value)} className="filter-select">
                <option value="all">All Types</option>
                {typeOptions.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
        )}
      </section>

      <section className="table-section">
        <div className="table-wrapper">
          <table className="data-table" role="grid">
            <thead>
              <tr>
                <th className="row-action-heading">Edit</th>
                <th><button className="sortable-header" onClick={() => handleSort('title')}>Title <span className="sort-icon">{renderSortIcon('title')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('day')}>Day <span className="sort-icon">{renderSortIcon('day')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('time')}>Time <span className="sort-icon">{renderSortIcon('time')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('type')}>Type <span className="sort-icon">{renderSortIcon('type')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('location')}>Location <span className="sort-icon">{renderSortIcon('location')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('speaker')}>Speaker <span className="sort-icon">{renderSortIcon('speaker')}</span></button></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="empty-state"><Calendar size={32}/><p>Loading Google Sheet events...</p></td></tr>
              ) : paginatedEvents.length === 0 ? (
                <tr><td colSpan={8} className="empty-state"><Info size={32}/><p>No events found in the Google Sheet.</p><button className="btn btn-primary" onClick={openAddModal}><Plus size={16}/>Add First Event</button></td></tr>
              ) : (
                paginatedEvents.map(event => (
                  <tr key={event.id}>
                    <td className="row-action-cell"><button className="icon-btn edit" onClick={() => openEditModal(event)} aria-label={`Edit ${event.title}`}><Edit size={16}/></button></td>
                    <td className="title-cell"><div className="event-title">{event.title}</div>{event.description && <div className="event-desc">{event.description}</div>}</td>
                    <td><span className="day-badge">{event.day}</span></td>
                    <td className="time-cell">{event.time || '—'}{event.timeEnd ? ` - ${event.timeEnd}` : ''}</td>
                    <td><span className={`category-badge ${event.type || 'muted'}`}>{event.type || '—'}</span></td>
                    <td>{event.location || '—'}</td>
                    <td>{event.speaker || '—'}</td>
                    <td><div className="action-buttons"><button className="icon-btn view" onClick={() => setViewEvent(event)} aria-label="View event"><Eye size={16}/></button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <nav className="pagination" aria-label="Schedule pagination">
            <button className="page-btn" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Previous"><ChevronLeft size={18}/></button>
            <div className="page-info">Page {currentPage} of {totalPages} ({filteredEvents.length} total)</div>
            <button className="page-btn" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} aria-label="Next"><ChevronRight size={18}/></button>
          </nav>
        )}
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingEvent ? 'Edit Event in Google Sheet' : 'Add Event to Google Sheet'}</h2>
              <button className="modal-close" onClick={closeModal} aria-label="Close"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-field"><label htmlFor="title">Title *</label><input type="text" id="title" value={formData.title} onChange={event => setFormData({...formData, title: event.target.value})} required/></div>
                <div className="form-field"><label htmlFor="day">Day *</label><select id="day" value={formData.day} onChange={event => setFormData({...formData, day: event.target.value})} required>{dayOptions.map(day => <option key={day} value={day}>{day}</option>)}</select></div>
                <div className="form-field"><label htmlFor="time">Start Time *</label><input type="text" id="time" placeholder="11:30 AM" value={formData.time} onChange={event => setFormData({...formData, time: event.target.value})} required/></div>
                <div className="form-field"><label htmlFor="timeEnd">End Time</label><input type="text" id="timeEnd" placeholder="1:45 PM" value={formData.timeEnd} onChange={event => setFormData({...formData, timeEnd: event.target.value})}/></div>
                <div className="form-field"><label htmlFor="location">Location</label><input type="text" id="location" value={formData.location} onChange={event => setFormData({...formData, location: event.target.value})}/></div>
                <div className="form-field"><label htmlFor="type">Type</label><select id="type" value={formData.type} onChange={event => setFormData({...formData, type: event.target.value})}>{typeOptions.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                <div className="form-field full-width"><label htmlFor="speaker">Speaker</label><input type="text" id="speaker" value={formData.speaker} onChange={event => setFormData({...formData, speaker: event.target.value})}/></div>
                <div className="form-field full-width"><label htmlFor="description">Description</label><textarea id="description" value={formData.description} onChange={event => setFormData({...formData, description: event.target.value})} rows={3}/></div>
              </div>
              {sheetSaveMessage && <div className={`sheet-save-message ${sheetSaveStatus}`}>{sheetSaveMessage}</div>}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={sheetSaveStatus === 'saving'}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={sheetSaveStatus === 'saving'}>{sheetSaveStatus === 'saving' ? 'Saving...' : (editingEvent ? 'Update Google Sheet' : 'Add to Google Sheet')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewEvent && (
        <div className="modal-overlay" onClick={() => setViewEvent(null)}>
          <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Event Details</h2><button className="modal-close" onClick={() => setViewEvent(null)}><X size={20}/></button></div>
            <div className="modal-body">
              <div className="view-grid">
                <div className="view-section"><h4>Google Sheet Row</h4><dl><dt>eventId</dt><dd>{viewEvent.eventId}</dd><dt>title</dt><dd>{viewEvent.title}</dd><dt>day</dt><dd>{viewEvent.day}</dd><dt>time</dt><dd>{viewEvent.time}</dd><dt>timeEnd</dt><dd>{viewEvent.timeEnd || '—'}</dd><dt>location</dt><dd>{viewEvent.location || '—'}</dd><dt>type</dt><dd>{viewEvent.type || '—'}</dd><dt>speaker</dt><dd>{viewEvent.speaker || '—'}</dd></dl></div>
                <div className="view-section full-width"><h4>description</h4><p>{viewEvent.description || '—'}</p></div>
              </div>
            </div>
            <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setViewEvent(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSchedule;
