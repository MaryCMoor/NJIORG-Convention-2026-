import { useState, useEffect } from 'react'
import { 
  Menu, X, Sun, Moon, Bell, User, LogOut, 
  Home, Calendar, UserCheck, Megaphone, Utensils, MapPin, Users, 
  Images, Award, BookOpen, TicketCheck, Settings, Star, Heart,
  ChevronDown, ChevronUp, Crown, Sparkles
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import './Header.css'

const Header = ({ onMenuPress, onRolePress, showRoleSelector }) => {
  const { 
    theme, toggleTheme, currentUser, logout, 
    notifications, markNotificationRead,
  } = useApp()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length)
  }, [notifications])

  const getRoleBadge = (role) => {
    const badges = {
      attendee: { label: 'Rainbow Girl', class: 'badge-gold' },
      grand_officer: { label: 'Grand Officer', class: 'badge-red' },
      advisor: { label: 'Advisor', class: 'badge-blue' },
      administrator: { label: 'Administrator', class: 'badge-purple' },
    }
    return badges[role] || badges.attendee
  }

  return (
    <header className="header" role="banner">
      <div className="header-top">
        <div className="header-top-left">
          <button 
            className="menu-toggle" 
            onClick={onMenuPress}
            aria-label="Open menu"
            aria-expanded="false"
          >
            <Menu size={24} />
          </button>
          
          <div className="logo-container">
            <div className="logo-icon">
              <Crown size={28} />
            </div>
            <div className="logo-text">
              <span className="logo-main">Rainbow Convention</span>
              <span className="logo-theme">The Greatest Showman</span>
            </div>
          </div>
        </div>

        <div className="header-top-right">
          {/* Theme Toggle */}
          <button 
            className="icon-btn" 
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Notifications */}
          <div className="dropdown">
            <button 
              className="icon-btn notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              aria-expanded={showNotifications}
              aria-haspopup="true"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            
            {showNotifications && (
              <div className="dropdown-menu notification-panel" role="menu">
                <div className="dropdown-header">
                  <h3>Announcements</h3>
                  <button className="mark-all-read" onClick={() => notifications.forEach(n => markNotificationRead(n.id))}>
                    Mark all read
                  </button>
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="empty-state">
                      <Bell size={32} />
                      <p>No announcements yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(notif => (
                      <div 
                        key={notif.id} 
                        className={`notification-item ${!notif.read ? 'unread' : ''}`}
                        role="menuitem"
                        onClick={() => markNotificationRead(notif.id)}
                      >
                        <div className="notification-icon">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="notification-content">
                          <h4>{notif.title}</h4>
                          <p>{notif.body}</p>
                          <span className="notification-time">
                            {formatTime(notif.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 10 && (
                  <div className="dropdown-footer">
                    <span>{notifications.length} total notifications</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          {currentUser ? (
            <div className="dropdown user-dropdown">
              <button 
                className="user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className="user-avatar">
                  {currentUser.firstName[0]}{currentUser.lastName[0]}
                </div>
                <div className="user-info">
                  <span className="user-name">{currentUser.firstName} {currentUser.lastName}</span>
                  <span className="user-role">
                    {getRoleBadge(currentUser.role).label}
                  </span>
                </div>
                <ChevronDown size={16} />
              </button>
              
              {showUserMenu && (
                <div className="dropdown-menu user-menu" role="menu">
                  <div className="user-menu-header">
                    <div className="user-avatar large">
                      {currentUser.firstName[0]}{currentUser.lastName[0]}
                    </div>
                    <div>
                      <h4>{currentUser.firstName} {currentUser.lastName}</h4>
                      <p>{currentUser.chapterName}</p>
                      <span className={`role-badge ${getRoleBadge(currentUser.role).class}`}>
                        {getRoleBadge(currentUser.role).label}
                      </span>
                    </div>
                  </div>
                  <div className="divider"></div>
                  <div className="user-menu-actions">
                    {showRoleSelector && (
                      <button 
                        className="user-action-btn"
                        onClick={onRolePress}
                        role="menuitem"
                      >
                        <span className="user-action-icon" aria-hidden="true">🎭</span>
                        <span>Switch Role</span>
                      </button>
                    )}
                    <button 
                      className="user-action-btn danger"
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      role="menuitem"
                    >
                      <span className="user-action-icon" aria-hidden="true">🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-gold" onClick={() => window.location.href = '/registration'}>
              <TicketCheck size={18} />
              <span>Check In</span>
            </button>
          )}
          
          {/* Role Switcher Button (only on mobile) */}
          {showRoleSelector && (
            <button 
              className="icon-btn role-switcher-btn"
              onClick={onRolePress}
              aria-label="Switch role"
              title="Switch Role"
            >
              <span aria-hidden="true">🎭</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

const CountdownWidget = () => {
  const { getConventionCountdown } = useApp()
  const [countdown, setCountdown] = useState(getConventionCountdown())

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getConventionCountdown())
    }, 1000)
    return () => clearInterval(interval)
  }, [getConventionCountdown])

  if (countdown.started) {
    return (
      <div className="countdown-active animate-pulse">
        <Sparkles size={16} />
        <span>The Show Has Begun!</span>
        <Sparkles size={16} />
      </div>
    )
  }

  return (
    <div className="countdown-widget-inner marquee-lights">
      <span className="countdown-label">🎪</span>
      <span className="countdown-value">
        {countdown.days} DAYS {countdown.hours}H {countdown.minutes}M {countdown.seconds}S
      </span>
      <span className="countdown-label">🦁</span>
      <span className="countdown-until">UNTIL CONVENTION</span>
    </div>
  )
}

const getNotificationIcon = (type) => {
  const icons = {
    general: <Megaphone size={16} />,
    schedule_change: <Calendar size={16} />,
    emergency: <span className="emergency-icon">🚨</span>,
    meal_reminder: <Utensils size={16} />,
    officer_update: <User size={16} />,
    transportation: <MapPin size={16} />,
    success: <span>✅</span>,
    achievement: <span>🏆</span>,
  }
  return icons[type] || icons.general
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString()
}

export default Header