import { useRef, useEffect } from 'react'
import './BottomNav.css'

const BottomNav = ({ items, activeIndex, onPress, keyboardOpen }) => {
  const navRef = useRef(null)

  // Hide bottom nav when keyboard is open
  useEffect(() => {
    if (navRef.current) {
      navRef.current.style.transform = keyboardOpen ? 'translateY(100%)' : 'translateY(0)'
    }
  }, [keyboardOpen])

  if (items.length === 0) return null

  return (
    <nav 
      ref={navRef}
      className="bottom-nav" 
      role="navigation" 
      aria-label="Primary navigation"
      style={{ '--nav-item-count': items.length }}
    >
      {items.map((item, index) => (
        <button
          key={item.path}
          role="tab"
          aria-selected={index === activeIndex}
          aria-label={item.label}
          className={`bottom-nav-item ${index === activeIndex ? 'active' : ''}`}
          onClick={() => onPress(index, item)}
        >
          <span className="nav-item-icon" aria-hidden="true">
            <NavIcon name={item.icon} />
            {index === activeIndex && <span className="active-ring" aria-hidden="true" />}
          </span>
          <span className="nav-item-label">{item.label}</span>
        </button>
      ))}
      
      {/* Active indicator bar */}
      <div 
        className="nav-indicator" 
        aria-hidden="true"
        style={{ 
          '--active-index': activeIndex,
          '--item-count': items.length 
        }}
      />
    </nav>
  )
}

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
  return icons[name] || '📄'
}

export default BottomNav