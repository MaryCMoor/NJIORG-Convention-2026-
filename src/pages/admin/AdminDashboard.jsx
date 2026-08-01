import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Megaphone,
  Users,
  Mic,
  Images,
  Settings,
  Award,
  Landmark,
  Hash,
  Crown,
  Palette,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ADMIN_CONFIG } from '../../config/admin';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { appConfig } = useApp();

  const conventionDates = [appConfig.startDate, appConfig.endDate].filter(Boolean).join(' - ');
  const venue = [
    appConfig.venueName,
    appConfig.venueAddress,
    [appConfig.venueCity, appConfig.venueState, appConfig.venueZip].filter(Boolean).join(' '),
  ].filter(Boolean).join(' • ');

  const quickActions = [
    { label: 'Manage Attendees', description: 'Review and update attendee records.', to: `${ADMIN_CONFIG.routePrefix}/attendees`, icon: Users, primary: false },
    { label: 'Manage Schedule', description: 'Add, edit, and review Google Sheet events.', to: `${ADMIN_CONFIG.routePrefix}/schedule`, icon: CalendarIcon, primary: true },
    { label: 'Announcements', description: 'Create updates and ticker alerts from Notifications.', to: `${ADMIN_CONFIG.routePrefix}/announcements`, icon: Megaphone, primary: false },
    { label: 'Meet NJ Rainbow', description: 'Manage member profiles, photos, bios, videos, and speaker toggle.', to: `${ADMIN_CONFIG.routePrefix}/members`, icon: Users, primary: false },
    { label: 'NJ Assemblies', description: 'Manage assemblies, Mother Advisors, term themes, and photos.', to: `${ADMIN_CONFIG.routePrefix}/assemblies`, icon: Landmark, primary: false },
    { label: 'Social Feed', description: 'Add social posts with likes, comments, media, and links.', to: `${ADMIN_CONFIG.routePrefix}/social`, icon: Hash, primary: false },
    { label: 'Speakers', description: 'Edit speaker-specific details and event tags.', to: `${ADMIN_CONFIG.routePrefix}/speakers`, icon: Mic, primary: false },
    { label: 'Awards', description: 'Manage awards and recognitions.', to: `${ADMIN_CONFIG.routePrefix}/awards`, icon: Award, primary: false },
    { label: 'Gallery', description: 'Manage photos from the Gallery sheet.', to: `${ADMIN_CONFIG.routePrefix}/gallery`, icon: Images, primary: false },
    { label: 'Photo Submissions', description: 'Approve or reject guest photo/video uploads.', to: `${ADMIN_CONFIG.routePrefix}/gallery-submissions`, icon: Images, primary: false },
    { label: 'Appearance & Settings', description: 'Update yearly theme, colors, venue, contacts, and social links.', to: `${ADMIN_CONFIG.routePrefix}/settings`, icon: Settings, primary: false },
  ];

  return (
    <div className="admin-dashboard">
      <section className="dashboard-header">
        <div className="header-content">
          <div>
            <h2 className="welcome-title">Welcome back, Administrator</h2>
            <p className="welcome-subtitle">
              Manage {appConfig.appTitle || 'the convention app'} from the Google Sheet-connected tools below.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              <RefreshCw size={18} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-section quick-actions-section" aria-labelledby="quick-actions-title">
        <h3 id="quick-actions-title" className="section-title">Admin Tools</h3>
        <p className="section-desc">Use these areas to update the content that appears in the app.</p>
        <div className="quick-actions-grid admin-tools-grid">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.to} className={`quick-action-btn ${action.primary ? 'primary' : ''}`}>
              <action.icon size={24} aria-hidden="true" />
              <span>{action.label}</span>
              <small>{action.description}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-section convention-info-section" aria-labelledby="convention-info-title">
        <h3 id="convention-info-title" className="section-title">Current App Setup</h3>
        <div className="convention-info-grid">
          <div className="info-card">
            <div className="info-icon"><Crown size={24} /></div>
            <div className="info-content">
              <label>App Title</label>
              <p>{appConfig.appTitle || 'Not set'}</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon"><Palette size={24} /></div>
            <div className="info-content">
              <label>Theme</label>
              <p>{appConfig.themeName || 'Not set'}</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon"><CalendarIcon size={24} /></div>
            <div className="info-content">
              <label>Dates</label>
              <p>{conventionDates || 'Not set'}</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon"><Users size={24} /></div>
            <div className="info-content">
              <label>Venue</label>
              <p>{venue || 'Not set'}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
