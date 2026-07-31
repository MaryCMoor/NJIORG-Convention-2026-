import { useEffect, useMemo, useState } from 'react';
import {
  Search, Filter, Plus, Download, ChevronDown, ChevronUp, X, Eye, Edit, RefreshCw, ChevronLeft, ChevronRight, UserRound
} from 'lucide-react';
import { loadPublishedMemberRows, normalizeSheetRowForAdminMember } from '../../utils/googleSheetData';
import { saveMemberToGoogleSheet, updateMemberInGoogleSheet } from '../../utils/appsScriptApi';
import './ManageSchedule.css';

const categoryOptions = ['Grand Officers', 'Mother Advisors', 'Adult Grand Executive Committee', 'Majority Committee'];

const blankForm = () => ({
  name: '',
  station: '',
  assembly: '',
  photo: '',
  bio: '',
  category: 'Grand Officers',
  videoUrl: '',
});

const sortValue = (member, field) => String(member[field] || '').toLowerCase();

const ManageMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
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

  const refreshMembers = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await loadPublishedMemberRows();
      setMembers(rows.map(normalizeSheetRowForAdminMember));
    } catch (error) {
      console.error(error);
      setLoadError(error.message || 'Could not load Members from Google Sheet.');
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
        const matchesCategory = filterCategory === 'all' || member.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const primaryA = sortValue(a, sortBy);
        const primaryB = sortValue(b, sortBy);
        if (primaryA < primaryB) return sortOrder === 'asc' ? -1 : 1;
        if (primaryA > primaryB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [members, searchQuery, filterCategory, sortBy, sortOrder]);

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
      category: member.category || 'Grand Officers',
      videoUrl: member.videoUrl || '',
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
    setSheetSaveMessage(editingMember ? 'Updating member in Google Sheet...' : 'Saving member to Google Sheet...');

    try {
      const result = editingMember
        ? await updateMemberInGoogleSheet(formData)
        : await saveMemberToGoogleSheet(formData);
      const savedMember = normalizeSheetRowForAdminMember({
        ...formData,
        memberId: result.memberId || formData.memberId || editingMember?.memberId,
      });

      await refreshMembers();
      setMembers(prev => prev.some(item => item.id === savedMember.id)
        ? prev.map(item => item.id === savedMember.id ? savedMember : item)
        : [...prev, savedMember]);
      setSheetSaveStatus('success');
      setSheetSaveMessage(editingMember ? 'Member updated in Google Sheet.' : 'Member saved to Google Sheet.');
      setShowModal(false);
      setEditingMember(null);
      setFormData(blankForm());
    } catch (error) {
      console.error(error);
      setSheetSaveStatus('error');
      setSheetSaveMessage(error.message || 'Member was not saved to Google Sheet.');
    }
  };

  const exportMembers = () => {
    const headers = ['memberId', 'name', 'station', 'assembly', 'photo', 'bio', 'category', 'videoUrl'];
    const csv = [
      headers.join(','),
      ...filteredMembers.map(member => headers.map(header => `"${String(member[header] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-sheet-members-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="page-title">Manage Members</h1>
          <p className="page-subtitle">Reading directly from the Google Sheet Members tab · {filteredMembers.length} of {members.length} members</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={refreshMembers} disabled={loading}>
            <RefreshCw size={18} /><span>{loading ? 'Refreshing...' : 'Refresh Sheet'}</span>
          </button>
          <button className="btn btn-secondary" onClick={exportMembers}>
            <Download size={18} /><span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /><span>Add Member</span>
          </button>
        </div>
      </header>

      {loadError && <div className="sheet-save-message error">{loadError}</div>}

      <section className="filters-section">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search Google Sheet members..."
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
              <select value={filterCategory} onChange={event => setFilterCategory(event.target.value)} className="filter-select">
                <option value="all">All Categories</option>
                {categoryOptions.map(category => <option key={category} value={category}>{category}</option>)}
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
                <th><button className="sortable-header" onClick={() => handleSort('name')}>Name <span className="sort-icon">{renderSortIcon('name')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('station')}>Station <span className="sort-icon">{renderSortIcon('station')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('category')}>Category <span className="sort-icon">{renderSortIcon('category')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('assembly')}>Assembly <span className="sort-icon">{renderSortIcon('assembly')}</span></button></th>
                <th>Video</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="empty-state"><RefreshCw size={32}/><p>Loading Members tab...</p></td></tr>
              ) : paginatedMembers.length === 0 ? (
                <tr><td colSpan={7} className="empty-state"><UserRound size={32}/><p>No members found in the Google Sheet.</p><button className="btn btn-primary" onClick={openAddModal}><Plus size={16}/>Add First Member</button></td></tr>
              ) : (
                paginatedMembers.map(member => (
                  <tr key={member.id}>
                    <td className="row-action-cell"><button className="icon-btn edit" onClick={() => openEditModal(member)} aria-label={`Edit ${member.name}`}><Edit size={16}/></button></td>
                    <td className="title-cell"><div className="event-title">{member.name || '—'}</div>{member.bio && <div className="event-desc">{member.bio.slice(0, 90)}{member.bio.length > 90 ? '…' : ''}</div>}</td>
                    <td>{member.station || '—'}</td>
                    <td><span className="category-badge primary">{member.category || '—'}</span></td>
                    <td>{member.assembly || '—'}</td>
                    <td>{member.videoUrl ? 'Yes' : '—'}</td>
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
              <h2 className="modal-title">{editingMember ? 'Edit Member' : 'Add Member'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-field"><label htmlFor="name">Name *</label><input type="text" id="name" value={formData.name} onChange={event => setFormData({...formData, name: event.target.value})} required /></div>
                <div className="form-field"><label htmlFor="station">Station/Position *</label><input type="text" id="station" value={formData.station} onChange={event => setFormData({...formData, station: event.target.value})} required /></div>
                <div className="form-field"><label htmlFor="category">Category</label><select id="category" value={formData.category} onChange={event => setFormData({...formData, category: event.target.value})}>{categoryOptions.map(category => <option key={category} value={category}>{category}</option>)}</select></div>
                <div className="form-field"><label htmlFor="assembly">Assembly</label><input type="text" id="assembly" value={formData.assembly} onChange={event => setFormData({...formData, assembly: event.target.value})} /></div>
                <div className="form-field full-width"><label htmlFor="photo">Photo URL</label><input type="url" id="photo" value={formData.photo} onChange={event => setFormData({...formData, photo: event.target.value})} placeholder="https://..." /></div>
                <div className="form-field full-width"><label htmlFor="videoUrl">Video URL</label><input type="url" id="videoUrl" value={formData.videoUrl} onChange={event => setFormData({...formData, videoUrl: event.target.value})} placeholder="YouTube, Vimeo, or direct video URL" /></div>
                <div className="form-field full-width"><label htmlFor="bio">Bio</label><textarea id="bio" value={formData.bio} onChange={event => setFormData({...formData, bio: event.target.value})} rows={5} /></div>
              </div>
              {sheetSaveMessage && <div className={`sheet-save-message ${sheetSaveStatus}`}>{sheetSaveMessage}</div>}
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={closeModal} disabled={sheetSaveStatus === 'saving'}>Cancel</button><button type="submit" className="btn btn-primary" disabled={sheetSaveStatus === 'saving'}>{sheetSaveStatus === 'saving' ? 'Saving...' : editingMember ? 'Update Member' : 'Add Member'}</button></div>
            </form>
          </div>
        </div>
      )}

      {viewMember && (
        <div className="modal-overlay" onClick={() => setViewMember(null)}>
          <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Member Details</h2><button className="modal-close" onClick={() => setViewMember(null)}><X size={20}/></button></div>
            <div className="modal-body"><div className="view-grid"><div className="view-section"><h4>Name</h4><p>{viewMember.name || '—'}</p></div><div className="view-section"><h4>Station</h4><p>{viewMember.station || '—'}</p></div><div className="view-section"><h4>Category</h4><p>{viewMember.category || '—'}</p></div><div className="view-section"><h4>Assembly</h4><p>{viewMember.assembly || '—'}</p></div><div className="view-section full-width"><h4>Bio</h4><p>{viewMember.bio || '—'}</p></div><div className="view-section full-width"><h4>Video URL</h4><p>{viewMember.videoUrl || '—'}</p></div></div></div>
            <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setViewMember(null)}>Close</button><button className="btn btn-primary" onClick={() => { setViewMember(null); openEditModal(viewMember); }}><Edit size={16}/> Edit</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMembers;
