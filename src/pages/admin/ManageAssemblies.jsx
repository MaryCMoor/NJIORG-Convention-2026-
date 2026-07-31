import { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Download, ChevronDown, ChevronUp, X, Eye, Edit, RefreshCw, ChevronLeft, ChevronRight, Landmark
} from 'lucide-react';
import {
  loadAssembliesFromGoogleSheet,
  saveAssemblyToGoogleSheet,
  updateAssemblyInGoogleSheet,
} from '../../utils/appsScriptApi';
import './ManageSchedule.css';

const blankForm = () => ({
  assemblyName: '',
  motherAdvisor: '',
  termTheme: '',
  galleryMediaUrls: '',
  notes: '',
});

const normalizeAssemblyForAdmin = (assembly, index = 0) => ({
  id: assembly.assemblyId || assembly.id || `assembly-${index + 1}`,
  assemblyId: assembly.assemblyId || assembly.id || '',
  assemblyName: assembly.assemblyName || assembly.name || '',
  motherAdvisor: assembly.motherAdvisor || '',
  termTheme: assembly.termTheme || '',
  galleryMediaUrls: assembly.galleryMediaUrls || assembly.galleryImageUrls || '',
  notes: assembly.notes || '',
});

const sortValue = (assembly, field) => String(assembly[field] || '').toLowerCase();

const ManageAssemblies = () => {
  const [assemblies, setAssemblies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('assemblyName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState(null);
  const [viewAssembly, setViewAssembly] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sheetSaveStatus, setSheetSaveStatus] = useState('idle');
  const [sheetSaveMessage, setSheetSaveMessage] = useState('');
  const [formData, setFormData] = useState(blankForm);

  const refreshAssemblies = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await loadAssembliesFromGoogleSheet();
      setAssemblies(rows.map(normalizeAssemblyForAdmin));
    } catch (error) {
      console.error(error);
      setLoadError(error.message || 'Could not load Assemblies from Google Sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAssemblies();
  }, []);

  const filteredAssemblies = useMemo(() => {
    return assemblies
      .filter(assembly => {
        const q = searchQuery.toLowerCase();
        return !q || [assembly.assemblyName, assembly.motherAdvisor, assembly.termTheme, assembly.notes]
          .some(value => String(value || '').toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const primaryA = sortValue(a, sortBy);
        const primaryB = sortValue(b, sortBy);
        if (primaryA < primaryB) return sortOrder === 'asc' ? -1 : 1;
        if (primaryA > primaryB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [assemblies, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAssemblies.length / itemsPerPage) || 1;
  const paginatedAssemblies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAssemblies.slice(start, start + itemsPerPage);
  }, [filteredAssemblies, currentPage, itemsPerPage]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const openAddModal = () => {
    setFormData(blankForm());
    setEditingAssembly(null);
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setShowModal(true);
  };

  const openEditModal = (assembly) => {
    setEditingAssembly(assembly);
    setFormData({
      assemblyId: assembly.assemblyId || assembly.id,
      assemblyName: assembly.assemblyName || '',
      motherAdvisor: assembly.motherAdvisor || '',
      termTheme: assembly.termTheme || '',
      galleryMediaUrls: assembly.galleryMediaUrls || assembly.galleryImageUrls || '',
      notes: assembly.notes || '',
    });
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (sheetSaveStatus === 'saving') return;
    setShowModal(false);
    setEditingAssembly(null);
    setSheetSaveStatus('idle');
    setSheetSaveMessage('');
    setFormData(blankForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSheetSaveStatus('saving');
    setSheetSaveMessage(editingAssembly ? 'Updating assembly in Google Sheet...' : 'Saving assembly to Google Sheet...');

    try {
      const result = editingAssembly
        ? await updateAssemblyInGoogleSheet(formData)
        : await saveAssemblyToGoogleSheet(formData);
      const savedAssembly = normalizeAssemblyForAdmin({
        ...formData,
        assemblyId: result.assemblyId || formData.assemblyId || editingAssembly?.assemblyId,
      });

      await refreshAssemblies();
      setAssemblies(prev => prev.some(item => item.id === savedAssembly.id)
        ? prev.map(item => item.id === savedAssembly.id ? savedAssembly : item)
        : [...prev, savedAssembly]);
      setSheetSaveStatus('success');
      setSheetSaveMessage(editingAssembly ? 'Assembly updated in Google Sheet.' : 'Assembly saved to Google Sheet.');
      setShowModal(false);
      setEditingAssembly(null);
      setFormData(blankForm());
    } catch (error) {
      console.error(error);
      setSheetSaveStatus('error');
      setSheetSaveMessage(error.message || 'Assembly was not saved to Google Sheet.');
    }
  };

  const exportAssemblies = () => {
    const headers = ['assemblyId', 'assemblyName', 'motherAdvisor', 'termTheme', 'galleryMediaUrls', 'notes'];
    const csv = [
      headers.join(','),
      ...filteredAssemblies.map(assembly => headers.map(header => `"${String(assembly[header] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-sheet-assemblies-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="page-title">NJ Assemblies</h1>
          <p className="page-subtitle">Manage assembly names, Mother Advisors, term themes, and photo URLs.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={refreshAssemblies} disabled={loading}>
            <RefreshCw size={18} /><span>{loading ? 'Refreshing...' : 'Refresh Sheet'}</span>
          </button>
          <button className="btn btn-secondary" onClick={exportAssemblies}>
            <Download size={18} /><span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /><span>Add Assembly</span>
          </button>
        </div>
      </header>

      {loadError && <div className="sheet-save-message error">{loadError}</div>}

      <section className="filters-section">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search assemblies..."
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
                <th><button className="sortable-header" onClick={() => handleSort('assemblyName')}>Assembly <span className="sort-icon">{renderSortIcon('assemblyName')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('motherAdvisor')}>Mother Advisor <span className="sort-icon">{renderSortIcon('motherAdvisor')}</span></button></th>
                <th><button className="sortable-header" onClick={() => handleSort('termTheme')}>Term Theme <span className="sort-icon">{renderSortIcon('termTheme')}</span></button></th>
                <th>Photos</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="empty-state"><RefreshCw size={32}/><p>Loading Assemblies tab...</p></td></tr>
              ) : paginatedAssemblies.length === 0 ? (
                <tr><td colSpan={6} className="empty-state"><Landmark size={32}/><p>No assemblies found yet.</p><button className="btn btn-primary" onClick={openAddModal}><Plus size={16}/>Add First Assembly</button></td></tr>
              ) : (
                paginatedAssemblies.map(assembly => (
                  <tr key={assembly.id}>
                    <td className="row-action-cell"><button className="icon-btn edit" onClick={() => openEditModal(assembly)} aria-label={`Edit ${assembly.assemblyName}`}><Edit size={16}/></button></td>
                    <td className="title-cell"><div className="event-title">{assembly.assemblyName || '—'}</div>{assembly.notes && <div className="event-desc">{assembly.notes.slice(0, 90)}{assembly.notes.length > 90 ? '…' : ''}</div>}</td>
                    <td>{assembly.motherAdvisor || '—'}</td>
                    <td>{assembly.termTheme || '—'}</td>
                    <td>{assembly.galleryMediaUrls ? 'Yes' : '—'}</td>
                    <td><div className="action-buttons"><button className="icon-btn view" onClick={() => setViewAssembly(assembly)} aria-label={`View ${assembly.assemblyName}`}><Eye size={16}/></button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <nav className="pagination" aria-label="Pagination"><button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous"><ChevronLeft size={18}/></button><div className="page-info">Page {currentPage} of {totalPages} ({filteredAssemblies.length} total)</div><button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next"><ChevronRight size={18}/></button></nav>}
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingAssembly ? 'Edit Assembly' : 'Add Assembly'}</h2>
              <button className="modal-close" onClick={closeModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-field"><label htmlFor="assemblyName">Assembly Name *</label><input type="text" id="assemblyName" value={formData.assemblyName} onChange={event => setFormData({...formData, assemblyName: event.target.value})} required /></div>
                <div className="form-field"><label htmlFor="motherAdvisor">Mother Advisor</label><input type="text" id="motherAdvisor" value={formData.motherAdvisor} onChange={event => setFormData({...formData, motherAdvisor: event.target.value})} /></div>
                <div className="form-field full-width"><label htmlFor="termTheme">Term Theme</label><input type="text" id="termTheme" value={formData.termTheme} onChange={event => setFormData({...formData, termTheme: event.target.value})} /></div>
                <div className="form-field full-width"><label htmlFor="galleryMediaUrls">Gallery Photo/Video URLs</label><textarea id="galleryMediaUrls" value={formData.galleryMediaUrls} onChange={event => setFormData({...formData, galleryMediaUrls: event.target.value})} placeholder="Paste one public image or video URL per line. Google Drive file links are OK." rows={6} /></div>
                <div className="form-field full-width"><label htmlFor="notes">Notes</label><textarea id="notes" value={formData.notes} onChange={event => setFormData({...formData, notes: event.target.value})} rows={4} /></div>
              </div>
              {sheetSaveMessage && <div className={`sheet-save-message ${sheetSaveStatus}`}>{sheetSaveMessage}</div>}
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={closeModal} disabled={sheetSaveStatus === 'saving'}>Cancel</button><button type="submit" className="btn btn-primary" disabled={sheetSaveStatus === 'saving'}>{sheetSaveStatus === 'saving' ? 'Saving...' : editingAssembly ? 'Update Assembly' : 'Add Assembly'}</button></div>
            </form>
          </div>
        </div>
      )}

      {viewAssembly && (
        <div className="modal-overlay" onClick={() => setViewAssembly(null)}>
          <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Assembly Details</h2><button className="modal-close" onClick={() => setViewAssembly(null)}><X size={20}/></button></div>
            <div className="modal-body"><div className="view-grid"><div className="view-section"><h4>Assembly</h4><p>{viewAssembly.assemblyName || '—'}</p></div><div className="view-section"><h4>Mother Advisor</h4><p>{viewAssembly.motherAdvisor || '—'}</p></div><div className="view-section full-width"><h4>Term Theme</h4><p>{viewAssembly.termTheme || '—'}</p></div><div className="view-section full-width"><h4>Gallery Photo/Video URLs</h4><p>{viewAssembly.galleryMediaUrls || '—'}</p></div><div className="view-section full-width"><h4>Notes</h4><p>{viewAssembly.notes || '—'}</p></div></div></div>
            <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setViewAssembly(null)}>Close</button><button className="btn btn-primary" onClick={() => { setViewAssembly(null); openEditModal(viewAssembly); }}><Edit size={16}/> Edit</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAssemblies;
