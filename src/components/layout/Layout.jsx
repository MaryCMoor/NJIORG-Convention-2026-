import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import './Layout.css'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedRole, clearRole, currentUser, logout, sidebarOpen, setSidebarOpen, sheetData, appConfig, refreshSheetData } = useApp()
  const [isAppMounted, setIsAppMounted] = useState(false)
  const [showRoleChange, setShowRoleChange] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    setIsAppMounted(true)
    
    // Listen for virtual keyboard on mobile
    const handleFocus = () => setKeyboardOpen(true)
    const handleBlur = () => setKeyboardOpen(false)
    
    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)
    
    return () => {
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)
    }
  }, [])

  useEffect(() => {
    // Always start public users on the home dashboard on first app open, but
    // allow in-app navigation after the home screen is visible.
    if (!isAppMounted && location.pathname !== '/') {
      navigate('/', { replace: true })
    }
  }, [isAppMounted, location.pathname, navigate])


  // Navigation items based on role
  const getNavItems = useCallback(() => {
    if (!selectedRole) return []
    
    const baseItems = [
      { path: '/', icon: 'home', label: 'Home', roles: ['attendee', 'grand_officer', 'advisor', 'administrator'] },
      { path: '/schedule', icon: 'calendar', label: 'Schedule', roles: ['attendee', 'grand_officer', 'advisor', 'administrator'] },
      { path: '/directory', icon: 'users', label: 'People', roles: ['attendee', 'grand_officer', 'advisor', 'administrator'] },
      { path: '/elected-grand-officers', icon: 'crown', label: 'Elected Officers', roles: ['attendee', 'grand_officer', 'advisor', 'administrator'], requiresConfig: 'showElectedGrandOfficers' },
    ]

    const roleItems = {
      attendee: [
        { path: '/gallery', icon: 'camera', label: 'Gallery', roles: ['attendee'] },
        { path: '/my-convention', icon: 'heart', label: 'My Convention', roles: ['attendee'] },
      ],
      grand_officer: [
        { path: '/committees', icon: 'users', label: 'Committees', roles: ['grand_officer'] },
        { path: '/program-book', icon: 'book', label: 'Program', roles: ['grand_officer'] },
        { path: '/announcements', icon: 'megaphone', label: 'Announce', roles: ['grand_officer'] },
      ],
      advisor: [
        { path: '/meals', icon: 'utensils', label: 'Meals', roles: ['advisor'] },
        { path: '/housing', icon: 'map-pin', label: 'Housing', roles: ['advisor'] },
        { path: '/announcements', icon: 'megaphone', label: 'Announce', roles: ['advisor'] },
      ],
      administrator: [
        { path: '/admin/IORG-2026-ADMIN', icon: 'shield', label: 'Admin', roles: ['administrator'] },
        { path: '/gallery', icon: 'camera', label: 'Gallery', roles: ['administrator'] },
        { path: '/reports', icon: 'bar-chart', label: 'Reports', roles: ['administrator'] },
      ],
    }

    return [...baseItems, ...(roleItems[selectedRole] || [])]
      .filter(item => item.roles.includes(selectedRole))
      .filter(item => !item.requiresConfig || Boolean(appConfig?.[item.requiresConfig]) === true)
  }, [selectedRole, appConfig])

  const navItems = getNavItems()

  // Check if current path matches a nav item
  const getActiveIndex = useCallback(() => {
    const currentPath = location.pathname
    return navItems.findIndex(item => {
      if (item.path === '/') return currentPath === '/' || currentPath === '/Convention-App---IORG---2026/'
      return currentPath.startsWith(item.path)
    })
  }, [location.pathname, navItems])

  const activeIndex = getActiveIndex()
  const isHomeRoute = location.pathname === '/' || location.pathname === '/NJIORG-Convention-2026-/'
  const activeAnnouncements = sheetData.notifications.filter(item => {
    if ((item.status || 'active') !== 'active' || item.ticker === false) return false
    if (!item.displayUntil) return true
    const end = new Date(item.displayUntil)
    return Number.isNaN(end.getTime()) || end >= new Date()
  })

  const handleNavPress = (index, item) => {
    if (index === activeIndex) return

    navigate(item.path)
    setSidebarOpen(false)
  }

  const handleRoleChange = () => {
    clearRole()
    setShowRoleChange(true)
    setSidebarOpen(false)
    // Refresh app config when role changes to pick up visibility settings
    refreshSheetData()
  }

  if (!isAppMounted) {
    return null // Loading handled by index.html
  }

  return (
    <div className={`app-layout app-view ${keyboardOpen ? 'keyboard-open' : ''} ${isHomeRoute ? 'home-route' : ''}`} data-react-root="true">
      {/* Status bar spacer for PWA */}
      <div className="status-bar-spacer" aria-hidden="true" />
      
      {/* Main content with safe areas */}
      <main className="main-content" role="main">
        <div className="page-content">
          {activeAnnouncements.length > 0 && (
            <button type="button" className="app-announcement-ticker" onClick={() => navigate('/announcements')}>
              <span className="ticker-count">{activeAnnouncements.length}</span>
              <span className="ticker-label">Announcements</span>
              <span className="ticker-track">{activeAnnouncements.map(item => item.title).join(' • ')}</span>
            </button>
          )}
          {!isHomeRoute && (
            <button type="button" className="app-back-home" onClick={() => navigate('/')}>
              <span aria-hidden="true">←</span>
              <span>Back to Home</span>
            </button>
          )}
          <Outlet />
        </div>
      </main>
      
      {/* Sidebar / Drawer */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={`sidebar ${sidebarOpen ? 'open' : ''}`} 
        role="complementary"
        aria-label="Navigation menu"
      >
        <div className="sidebar-header">
          <div className="sidebar-user">
            {currentUser ? (
              <>
                <div className="user-avatar">{currentUser.firstName[0]}{currentUser.lastName[0]}</div>
                <div className="user-info">
                  <strong>{currentUser.firstName} {currentUser.lastName}</strong>
                  <span className="user-role">{currentUser.chapterName}</span>
                </div>
              </>
            ) : (
              <>
                <div className="user-avatar guest">👤</div>
                <div className="user-info">
                  <strong>Guest</strong>
                  <span className="user-role">Not signed in</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        <nav className="sidebar-nav" aria-label="Main navigation">
          <ul role="list">
            {navItems.map((item, index) => (
              <li key={item.path} role="none">
                <button
                  role="menuitem"
                  className={`sidebar-item ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => {
                    handleNavPress(index, item)
                    setSidebarOpen(false)
                  }}
                >
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                  {index === activeIndex && <span className="active-indicator" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button 
            className="sidebar-item role-switcher"
            onClick={handleRoleChange}
          >
            <NavIcon name="user-cog" />
            <span>Switch Role ({getRoleLabel(selectedRole)})</span>
          </button>
          
          {currentUser ? (
            <button 
              className="sidebar-item logout"
              onClick={() => { logout(); setSidebarOpen(false); }}
            >
              <NavIcon name="log-out" />
              <span>Sign Out</span>
            </button>
          ) : (
            <a href="/registration" className="sidebar-item register-link" onClick={() => setSidebarOpen(false)}>
              <NavIcon name="user-plus" />
              <span>Register for Convention</span>
            </a>
          )}
        </div>
      </aside>
      
      {/* Role Change Modal */}
      {showRoleChange && (
        <RoleChangeModal 
          onClose={() => setShowRoleChange(false)}
          onRoleSelect={(role) => { 
            // Role will be set by AppContext
            setShowRoleChange(false)
          }}
        />
      )}
    </div>
  )
}

// Simple nav icon component
const NavIcon = ({ name }) => {
  const icons = {
    home: '🏠',
    calendar: '📅',
    users: '👥',
    camera: '📸',
    heart: '❤️',
    book: '📖',
    megaphone: '📢',
    utensils: '🍽️',
    'map-pin': '📍',
    shield: '🛡️',
    'bar-chart': '📊',
    'user-cog': '⚙️',
    'log-out': '🚪',
    'user-plus': '📝',
  }
  return <span className="nav-icon" aria-hidden="true">{icons[name] || '📄'}</span>
}

const getRoleLabel = (role) => {
  const labels = {
    attendee: 'Rainbow Girl',
    grand_officer: 'Grand Officer',
    advisor: 'Advisor',
    administrator: 'Administrator',
  }
  return labels[role] || 'Select Role'
}

// Role Change Modal
const RoleChangeModal = ({ onClose, onRoleSelect }) => {
  const { selectRole } = useApp()
  
  const roles = [
    { id: 'attendee', label: 'Rainbow Girl', subtitle: 'Attendee / Delegate', icon: '👑', color: 'gold' },
    { id: 'grand_officer', label: 'Grand Officer', subtitle: 'Elected Leadership', icon: '⭐', color: 'red' },
    { id: 'advisor', label: 'Advisor', subtitle: 'Adult Mentor', icon: '🛡️', color: 'blue' },
    { id: 'administrator', label: 'Administrator', subtitle: 'Convention Staff', icon: '👥', color: 'purple' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" aria-hidden="true" />
        <div className="modal-header">
          <h2 id="modal-title">Switch Your Role</h2>
        </div>
        <div className="modal-body">
          <p>Choose how you'd like to experience the convention:</p>
          <div className="modal-roles">
            {roles.map((role, index) => (
              <button
                key={role.id}
                className={`modal-role-btn ${role.color}`}
                onClick={() => { selectRole(role.id); onRoleSelect(role.id); }}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <span className="modal-role-icon" aria-hidden="true">{role.icon}</span>
                <div className="modal-role-info">
                  <strong>{role.label}</strong>
                  <span>{role.subtitle}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <button className="modal-close-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}

export default Layout