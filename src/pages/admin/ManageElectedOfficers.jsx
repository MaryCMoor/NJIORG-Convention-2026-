import { useEffect, useMemo, useState } from 'react'
import {
  Search, Filter, Plus, Download, ChevronDown, ChevronUp, X, Eye, Edit, RefreshCw, ChevronLeft, ChevronRight, UserRound, Crown, ToggleRight, ToggleLeft, Save
} from 'lucide-react'
import { normalizeSheetRowForAdminMember } from '../../utils/googleSheetData'
import { loadElectedOfficersFromGoogleSheet, saveElectedOfficerToGoogleSheet, updateElectedOfficerInGoogleSheet, saveAppConfigToGoogleSheet } from '../../utils/appsScriptApi'
import { useApp } from '../../context/AppContext'
import './ManageSchedule.css'

// Helper to convert Google Drive sharing links to thumbnail URLs
const convertDriveLinkToThumbnail = (url) => {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('drive.google.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean)
      const fileIndex = parts.indexOf('d')
      const id = fileIndex >= 0 ? parts[fileIndex + 1] : parsed.searchParams.get('id')
      return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w200` : url
    }
    return url
  } catch {
    return url
  }
}

const ELECTED_CATEGORY = 'Elected Grand Officers';

const blankForm = () => ({
  name: '',
  station: '',
  assembly: '',
  photo: '',
  bio: '',
  category: ELECTED_CATEGORY,
  videoUrl: '',
  isSpeaker: false,
});

const sortValue = (member, field) => String(member[field] || '').toLowerCase();

const ManageElectedOfficers = () => {
  const { appConfig, setAppConfig } = useApp()
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewMember, setViewMember] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [sheetSaveStatus, setSheetSaveStatus] = useState('idle');
  const [sheetSaveMessage, setSheetSaveMessage] = useState('');
  const [formData, setFormData] = useState(blankForm);
  const [showVisibilityToggle, setShowVisibilityToggle] = useState(true);

  const isVisible = appConfig?.showElectedGrandOfficers === true

  const toggleVisibility = async () => {
    const newConfig = { ...appConfig, showElectedGrandOfficers: !isVisible }
    try {
      await saveAppConfigToGoogleSheet(newConfig)
      setAppConfig(newConfig)
    } catch (error) {
      console.error('Failed to save visibility:', error)
    }
  }

  const refreshMembers = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await loadElectedOfficersFromGoogleSheet();
      const officers = rows.map(normalizeSheetRowForAdminMember);
      setMembers(officers);
    } catch (error) {
      console.error(error);
      setLoadError(error.message || 'Could not load Elected Grand Officers from Google Sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    return members
      .filter(member => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || [member.name, member.station, member.assembly, member.bio, member.category]
          .some(value => String(value || '').toLowerCase().includes(q));
        return matchesSearch;
      })
      .sort((a, b) => {
        const primaryA = sortValue(a, sortBy);
        const primaryB = sortValue(b, sortBy);
        if (primaryA < primaryB) return sortOrder === 'asc' ? -1 : 1;
        if (primaryA > primaryB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [members, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const openAddModal = () => {
    setFormData(blankForm());
    setEditingMember(null);
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      memberId: member.memberId || member.id,
      name: member.name || '',
      station: member.station || '',
      assembly: member.assembly || '',
      photo: member.photo || '',
      bio: member.bio || '',
      category: ELECTED_CATEGORY,
      videoUrl: member.videoUrl || '',
      isSpeaker: member.isSpeaker === true,
      originalName: member.name || '',
      originalStation: member.station || '',
    });
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (sheetSaveStatus === 'saving') return;
    setShowModal(false);
    setEditingMember(null);
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setFormData(blankForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSheetSaveStatus('saving');
    setSheetSaveMessage(editingMember ? 'Updating officer in Google Sheet...' : 'Saving officer to Google Sheet...');

    try {
      // Convert Google Drive photo link to thumbnail format
      const dataToSave = {
        ...formData,
        photo: convertDriveLinkToThumbnail(formData.photo)
      }

      const result = editingMember
        ? await updateElectedOfficerInGoogleSheet(dataToSave)
        : await saveElectedOfficerToGoogleSheet(dataToSave);
      const savedMember = normalizeSheetRowForAdminMember({
        ...formData,
        memberId: result.memberId || formData.memberId || editingMember?.memberId,
      });

      await refreshMembers();
      setMembers(prev => prev.some(item => item.id === savedMember.id)
        ? prev.map(item => item.id === savedMember.id ? savedMember : item)
        : [...prev, savedMember]);
      setSheetSaveStatus('success');
      setSheetSaveMessage(editingMember ? 'Officer updated in Google Sheet.' : 'Officer saved to Google Sheet.');
      setShowModal(false);
      setEditingMember(null);
      setFormData(blankForm());
    } catch (error) {
      console.error(error);
      setSheetSaveStatus('error');
      setSheetSaveMessage(error.message || 'Officer was not saved to Google Sheet.');
    }
  };

  const exportMembers = () => {
    const headers = ['memberId', 'name', 'station', 'assembly', 'photo', 'bio', 'category', 'videoUrl', 'isSpeaker'];
    const csv = [
      headers.join(','),
      ...filteredMembers.map(member => headers.map(header => `\"${String(member[header] || '').replace(/\"/g, '\"\"')}\"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elected-grand-officers-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="page-title">
            <Crown size={28} style={{marginRight: '0.5rem', color: 'var(--color-gold-500)'}} />
            Elected Grand Officers 2026-2027
          </h1>
          <p className="page-subtitle">
            Reading directly from the Google Sheet "2026-2027 Elected Grand Officers" tab · {filteredMembers.length} of {members.length} elected officers
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={refreshMembers} disabled={loading}>
            <RefreshCw size={18} /><span>{loading ? 'Refreshing...' : 'Refresh Sheet'}</span>
          </button>
          <button className="btn btn-secondary" onClick={exportMembers}>
            <Download size={18} /><span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /><span>Add Officer</span>
          </button>
        </div>
      </header>

      <div className="visibility-toggle-section" style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <span style={{fontWeight: 600}}>Public Page Visibility:</span>
            <label className="toggle-switch" style={{position: 'relative', width: '52px', height: '28px', cursor: 'pointer'}}>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={toggleVisibility}
                style={{opacity: 0, width: 0, height: 0}}
              />
              <span className="toggle-slider" style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: isVisible ? 'var(--color-primary)' : '#ccc',
                borderRadius: '28px', transition: '.3s'
              }} />
            </label>
            <span style={{fontWeight: 600, color: isVisible ? 'var(--color-primary)' : 'var(--color-text-light)'}}>
              {isVisible ? 'VISIBLE to everyone' : 'HIDDEN from public'}
            </span>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={() => window.open('/elected-grand-officers', '_blank')}
            style={{marginLeft: 'auto'}}
          >
            <Eye size={18} /><span> Preview Page</span>
          </button>
        </div>

      {loadError && <div className="sheet-save-message error">{loadError}</div>}

      <section className="filters-section">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search elected officers..."
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
      </section>

      <section className="table-section">
        <div className="table-wrapper">
          <table className="data-table" role="grid">
            <thead>
              <tr>
                <th className="row-action-heading">Edit</th>
                <th><button className="sortable-header" onClick={() => handleSort('name')}>Name <span className="sort-icon">{renderSortIcon('name')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('station')}>Station/Position <span className="sort-icon">{renderSortIcon('station')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('assembly')}>Assembly <span className="sort-icon">{renderSortIcon('assembly')}</span></button></th>
                <th>Photo</th>
                <th>Bio</th>
                <th>Video</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="empty-state"><RefreshCw size={32}/><p>Loading Elected Grand Officers...</p></td></tr>
              ) : paginatedMembers.length === 0 ? (
                <tr><td colSpan={8} className="empty-state"><Crown size={32}/><p>No elected officers found. Click <strong>Add Officer</strong> to add the first one.</p></td></tr>
              ) : (
                paginatedMembers.map(member => (
                  <tr key={member.id}>
                    <td className="row-action-cell"><button className="icon-btn edit" onClick={() => openEditModal(member)} aria-label={`Edit ${member.name}`}><Edit size={16}/></button></td>
                    <td className="title-cell"><div className="event-title">{member.name || '—'}</div>{member.bio && <div className="event-desc">{member.bio.slice(0, 90)}{member.bio.length > 90 ? '…' : ''}</div>}</td>
                    <td>{member.station || '—'}</td>
                    <td>{member.assembly || '—'}</td>
                    <td>{member.photo ? <span className="category-badge success">Yes</span> : <span className="category-badge">No</span>}</td>
                    <td>{member.bio ? <span className="category-badge primary">Yes</span> : <span className="category-badge">No</span>}</td>
                    <td>{member.videoUrl ? <span className="category-badge primary">Yes</span> : <span className="category-badge">No</span>}</td>
                    <td><div className="action-buttons"><button className="icon-btn view" onClick={() => setViewMember(member)} aria-label={`View ${member.name}`}><Eye size={16}/></button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <nav className="pagination" aria-label="Pagination"><button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous"><ChevronLeft size={18}/></button><div className="page-info">Page {currentPage} of {totalPages} ({filteredMembers.length} total)</div><button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next"><ChevronRight size={18}/></button></nav>}
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingMember ? 'Edit Officer' : 'Add Officer'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-field"><label htmlFor="name">Name *</label><input type="text" id="name" value={formData.name} onChange={event => setFormData({...formData, name: event.target.value})} required /></div>
                <div className="form-field"><label htmlFor="station">Station/Position *</label><input type="text" id="station" value={formData.station} onChange={event => setFormData({...formData, station: event.target.value})} required /></div>
                <div className="form-field"><label htmlFor="assembly">Assembly</label><input type="text" id="assembly" value={formData.assembly} onChange={event => setFormData({...formData, assembly: event.target.value})} /></div>
                <div className="form-field full-width"><label htmlFor="photo">Photo URL</label><input type="url" id="photo" value={formData.photo} onChange={event => setFormData({...formData, photo: event.target.value})} placeholder="https://... (Google Drive links auto-converted to thumbnails)" /></div>
                {formData.photo && (
                  <div className="form-field full-width" style={{marginTop: '-0.5rem'}}>
                    <label>Converted Thumbnail:</label>
                    <code style={{fontSize: '0.8rem', color: 'var(--color-text-light)', wordBreak: 'break-all'}}>{convertDriveLinkToThumbnail(formData.photo)}</code>
                  </div>
                )}
                <div className="form-field full-width"><label htmlFor="videoUrl">Video URL</label><input type="url" id="videoUrl" value={formData.videoUrl} onChange={event => setFormData({...formData, videoUrl: event.target.value})} placeholder="YouTube, Vimeo, or direct video URL" /></div>
                <div className="form-field full-width"><label htmlFor="isSpeaker"><input type="checkbox" id="isSpeaker" checked={formData.isSpeaker === true} onChange={event => setFormData({...formData, isSpeaker: event.target.checked})} /> Also show this person on the Speaker List</label></div>
                <div className="form-field full-width"><label htmlFor="bio">Bio</label><textarea id="bio" value={formData.bio} onChange={event => setFormData({...formData, bio: event.target.value})} rows={5} /></div>
              </div>
              {sheetSaveMessage && <div className={`sheet-save-message ${sheetSaveStatus}`}>{sheetSaveMessage}</div>}
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={closeModal} disabled={sheetSaveStatus === 'saving'}>Cancel</button><button type="submit" className="btn btn-primary" disabled={sheetSaveStatus === 'saving'}>{sheetSaveStatus === 'saving' ? 'Saving...' : editingMember ? 'Update Officer' : 'Add Officer'}</button></div>
            </form>
          </div>
        </div>
      )}

      {viewMember && (
        <div className="modal-overlay" onClick={() => setViewMember(null)}>
          <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Officer Details</h2><button className="modal-close" onClick={() => setViewMember(null)}><X size={20}/></button></div>
            <div className="modal-body"><div className="view-grid"><div className="view-section"><h4>Name</h4><p>{viewMember.name || '—'}</p></div><div className="view-section"><h4>Station</h4><p>{viewMember.station || '—'}</p></div><div className="view-section"><h4>Category</h4><p>{viewMember.category || '—'}</p></div><div className="view-section"><h4>Assembly</h4><p>{viewMember.assembly || '—'}</p></div><div className="view-section full-width"><h4>Bio</h4><p>{viewMember.bio || '—'}</p></div><div className="view-section full-width"><h4>Video URL</h4><p>{viewMember.videoUrl || '—'}</p></div></div></div>
            <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setViewMember(null)}>Close</button><button className="btn btn-primary" onClick={() => { setViewMember(null); openEditModal(viewMember); }}><Edit size={16}/> Edit</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageElectedOfficers;