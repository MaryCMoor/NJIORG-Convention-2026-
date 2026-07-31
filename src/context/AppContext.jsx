import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import mockConvention from '../data/mockData'
import { loadPublishedSheetData } from '../utils/googleSheetData'
import { DEFAULT_APP_CONFIG, loadAppConfigFromGoogleSheet, loadAssembliesFromGoogleSheet, loadSocialPostsFromGoogleSheet } from '../utils/appsScriptApi'

const AppContext = createContext(null)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

const STORAGE_KEY = 'rainbow-convention-2026'
const ADMIN_PASSWORD = '2026RainboW_Convention-SerVice!'

const getInitialState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with mock data to ensure all data is available
      return {
        ...mockConvention,
        ...parsed,
        // Ensure arrays are merged properly
        events: parsed.events || mockConvention.events,
        announcements: parsed.announcements || mockConvention.announcements,
        attendees: parsed.attendees || mockConvention.attendees,
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored data:', e)
  }
  return mockConvention
}

export const AppProvider = ({ children }) => {
  const [state, setState] = useState(getInitialState)
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState(() => {
    try {
      // Always show the role gate when the app first opens. The selected role
      // lives only in React state after the user chooses it, so a fresh page
      // load starts at the role selector before the home dashboard opens.
      localStorage.removeItem('selectedRole')
      sessionStorage.removeItem('selectedRole')
      sessionStorage.removeItem('adminUnlocked')
      return null
    } catch {
      return null
    }
  })
  const [adminUnlocked, setAdminUnlocked] = useState(() => {
    return false
  })
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light'
    } catch {
      return 'light'
    }
  })
  const [notifications, setNotifications] = useState([])
  const [sheetData, setSheetData] = useState({ events: [], members: [], speakers: [], notifications: [], gallery: [], assemblies: [], socialPosts: [] })
  const [sheetStatus, setSheetStatus] = useState('idle')
  const [appConfig, setAppConfig] = useState(DEFAULT_APP_CONFIG)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePage, setActivePage] = useState('home')

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      console.warn('Failed to persist state:', e)
    }
  }, [state])

  // Persist theme
  useEffect(() => {
    try {
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    } catch (e) {
      console.warn('Failed to persist theme:', e)
    }
  }, [theme])

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadSheetData = async () => {
      setSheetStatus('loading')
      try {
        const data = await loadPublishedSheetData()
        let assemblies = []
        let socialPosts = []
        try {
          assemblies = await loadAssembliesFromGoogleSheet()
        } catch (assemblyError) {
          console.warn('Failed to load Assemblies from Apps Script:', assemblyError)
        }
        try {
          socialPosts = await loadSocialPostsFromGoogleSheet()
        } catch (socialError) {
          console.warn('Failed to load SocialPosts from Apps Script:', socialError)
        }
        if (cancelled) return
        setSheetData({ ...data, assemblies, socialPosts })
        setSheetStatus('loaded')
        setNotifications(prev => {
          const existingIds = new Set(prev.map(item => item.id))
          return [...data.notifications.filter(item => !existingIds.has(item.id)), ...prev].slice(0, 50)
        })
      } catch (error) {
        console.warn('Failed to load Google Sheet data:', error)
        if (!cancelled) setSheetStatus('error')
      }
    }

    loadSheetData()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadAppConfig = async () => {
      try {
        const config = await loadAppConfigFromGoogleSheet()
        if (!cancelled) setAppConfig(config)
      } catch (error) {
        console.warn('Failed to load app config from Google Sheet:', error)
      }
    }

    loadAppConfig()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const setCssVar = (name, value) => document.documentElement.style.setProperty(name, value)
    const hexToRgb = (hex) => {
      const clean = String(hex || '').replace('#', '').trim()
      if (!/^[0-9a-f]{6}$/i.test(clean)) return '212, 175, 55'
      return [clean.slice(0, 2), clean.slice(2, 4), clean.slice(4, 6)]
        .map(value => parseInt(value, 16))
        .join(', ')
    }

    const primaryColor = appConfig.primaryColor || DEFAULT_APP_CONFIG.primaryColor
    const accentColor = appConfig.accentColor || DEFAULT_APP_CONFIG.accentColor
    const backgroundColor = appConfig.backgroundColor || DEFAULT_APP_CONFIG.backgroundColor
    const surfaceColor = appConfig.surfaceColor || DEFAULT_APP_CONFIG.surfaceColor
    const surfaceElevatedColor = appConfig.surfaceElevatedColor || DEFAULT_APP_CONFIG.surfaceElevatedColor
    const textColor = appConfig.textColor || DEFAULT_APP_CONFIG.textColor
    const secondaryTextColor = appConfig.secondaryTextColor || DEFAULT_APP_CONFIG.secondaryTextColor
    const borderColor = appConfig.borderColor || accentColor
    const buttonTextColor = appConfig.buttonTextColor || DEFAULT_APP_CONFIG.buttonTextColor
    const accentRgb = hexToRgb(accentColor)

    document.title = appConfig.appTitle || DEFAULT_APP_CONFIG.appTitle
    setCssVar('--color-background', backgroundColor)
    setCssVar('--color-surface', surfaceColor)
    setCssVar('--color-surface-elevated', surfaceElevatedColor)
    setCssVar('--color-text', textColor)
    setCssVar('--color-text-light', secondaryTextColor)
    setCssVar('--color-primary', primaryColor)
    setCssVar('--color-text-on-primary', buttonTextColor)
    setCssVar('--color-white', buttonTextColor)

    // The original theme used fixed gold/amber design tokens in many places.
    // Replace the entire gold scale with the configured accent color so no
    // leftover amber tint remains anywhere in the app.
    setCssVar('--color-gold-50', accentColor)
    setCssVar('--color-gold-100', accentColor)
    setCssVar('--color-gold-200', accentColor)
    setCssVar('--color-gold-300', accentColor)
    setCssVar('--color-gold-400', accentColor)
    setCssVar('--color-gold-500', accentColor)
    setCssVar('--color-gold-600', accentColor)
    setCssVar('--color-gold-700', accentColor)
    setCssVar('--color-gold-800', accentColor)
    setCssVar('--color-gold-900', accentColor)

    setCssVar('--color-secondary', accentColor)
    setCssVar('--theme-accent-exact', accentColor)
    setCssVar('--gold', accentColor)
    setCssVar('--gold-light', accentColor)
    setCssVar('--accent', accentColor)
    setCssVar('--accent-bg', accentColor)
    setCssVar('--accent-border', accentColor)
    setCssVar('--social-bg', accentColor)
    setCssVar('--color-border', borderColor)
    setCssVar('--color-border-strong', borderColor)
    setCssVar('--border', borderColor)
    setCssVar('--border-color', borderColor)
    setCssVar('--border-subtle', borderColor)
    setCssVar('--bg-primary', backgroundColor)
    setCssVar('--bg-secondary', surfaceColor)
    setCssVar('--bg-tertiary', surfaceElevatedColor)
    setCssVar('--surface', surfaceColor)
    setCssVar('--text-primary', textColor)
    setCssVar('--text-secondary', secondaryTextColor)
    setCssVar('--shadow-gold', `0 8px 32px rgba(${accentRgb}, 0.3)`)
    setCssVar('--shadow-gold-sm', `0 2px 8px rgba(${accentRgb}, 0.2)`)
    setCssVar('--shadow-gold-hover', `0 14px 38px rgba(${accentRgb}, 0.38)`)

    const setHeadLink = (rel, href, attrs = {}) => {
      let link = document.querySelector(`link[rel="${rel}"]`)
      if (!link) {
        link = document.createElement('link')
        link.rel = rel
        document.head.appendChild(link)
      }
      link.href = href
      Object.entries(attrs).forEach(([key, value]) => link.setAttribute(key, value))
    }

    const setMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = name
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    const iconUrl = appConfig.iconUrl?.trim()
    const appTitle = appConfig.appTitle || DEFAULT_APP_CONFIG.appTitle
    if (iconUrl) {
      setHeadLink('icon', iconUrl)
      setHeadLink('apple-touch-icon', iconUrl)

      const manifest = {
        name: appTitle,
        short_name: appTitle.length > 24 ? 'Rainbow Convention' : appTitle,
        description: '2026 Rainbow Grand Assembly Convention',
        start_url: './',
        scope: './',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        background_color: backgroundColor,
        theme_color: primaryColor,
        orientation: 'portrait-primary',
        icons: [
          { src: iconUrl, sizes: 'any', type: 'image/png', purpose: 'any' },
          { src: iconUrl, sizes: 'any', type: 'image/png', purpose: 'maskable' },
        ],
      }
      const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' })
      const manifestUrl = URL.createObjectURL(manifestBlob)
      setHeadLink('manifest', manifestUrl)
      setMeta('apple-mobile-web-app-title', appTitle)
      setMeta('theme-color', primaryColor)
      return () => URL.revokeObjectURL(manifestUrl)
    }
  }, [appConfig])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  const updateState = useCallback((updater) => {
    setState(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater
      return { ...prev, ...newState }
    })
  }, [])

  const login = useCallback((userId) => {
    const user = state.attendees.find(a => a.id === userId)
    if (user) {
      setCurrentUser(user)
      return true
    }
    return false
  }, [state.attendees])

  const logout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  const selectRole = useCallback((role, options = {}) => {
    if (role === 'administrator') {
      if (options.password !== ADMIN_PASSWORD) {
        setAdminUnlocked(false)
        try {
          sessionStorage.removeItem('adminUnlocked')
        } catch (e) {
          console.warn('Failed to clear admin access:', e)
        }
        return { ok: false, error: 'Incorrect administrator password.' }
      }
      setAdminUnlocked(true)
    } else {
      setAdminUnlocked(false)
    }

    setSelectedRole(role)
    try {
      sessionStorage.removeItem('selectedRole')
      sessionStorage.removeItem('adminUnlocked')
      localStorage.removeItem('selectedRole')
    } catch (e) {
      console.warn('Failed to persist selected role:', e)
    }
    return { ok: true }
  }, [])

  const clearRole = useCallback(() => {
    setSelectedRole(null)
    setAdminUnlocked(false)
    try {
      sessionStorage.removeItem('selectedRole')
      sessionStorage.removeItem('adminUnlocked')
      localStorage.removeItem('selectedRole')
    } catch (e) {
      console.warn('Failed to clear selected role:', e)
    }
  }, [])

  const registerAttendee = useCallback((attendeeData) => {
    const newAttendee = {
      ...attendeeData,
      id: `att-${Date.now()}`,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'confirmed',
      badgeNumber: `GA2026-${String(state.attendees.length + 1).padStart(4, '0')}`,
      qrCode: `GA2026-${String(state.attendees.length + 1).padStart(4, '0')}-${attendeeData.firstName.toUpperCase()}-${attendeeData.lastName.toUpperCase()}`,
      checkedIn: false,
      favorites: [],
      bingoProgress: [],
      scavengerProgress: [],
      badgesEarned: [],
    }
    updateState(prev => ({
      ...prev,
      attendees: [...prev.attendees, newAttendee]
    }))
    return newAttendee
  }, [state.attendees.length, updateState])

  const updateAttendee = useCallback((attendeeId, updates) => {
    updateState(prev => ({
      ...prev,
      attendees: prev.attendees.map(a => 
        a.id === attendeeId ? { ...a, ...updates } : a
      )
    }))
    if (currentUser?.id === attendeeId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null)
    }
  }, [updateState, currentUser])

  const toggleFavorite = useCallback((eventId) => {
    if (!currentUser) return
    const event = state.events.find(e => e.id === eventId)
    if (!event) return

    const isFav = currentUser.favorites.includes(eventId)
    const newFavorites = isFav
      ? currentUser.favorites.filter(id => id !== eventId)
      : [...currentUser.favorites, eventId]

    updateAttendee(currentUser.id, { favorites: newFavorites })
    
    // Also update event's attended array
    updateState(prev => ({
      ...prev,
      events: prev.events.map(e => 
        e.id === eventId 
          ? { ...e, attended: isFav 
              ? e.attended.filter(id => id !== currentUser.id)
              : [...e.attended, currentUser.id]
            }
          : e
      )
    }))
  }, [currentUser, state.events, updateAttendee, updateState])

  const addNotification = useCallback((notification) => {
    const newNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 50))
  }, [])

  const markNotificationRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }, [])

  const checkInAttendee = useCallback((attendeeId) => {
    updateAttendee(attendeeId, { checkedIn: true })
    addNotification({
      title: 'Check-In Successful',
      body: 'Welcome to the 2026 Rainbow Grand Assembly Convention!',
      type: 'success',
    })
  }, [updateAttendee, addNotification])

  const completeBingo = useCallback((bingoId) => {
    if (!currentUser) return
    const newProgress = [...(currentUser.bingoProgress || []), bingoId]
    updateAttendee(currentUser.id, { bingoProgress: newProgress })
    
    // Check for bingo completion
    if (newProgress.length >= 5) {
      addNotification({
        title: 'BINGO!',
        body: 'You\'ve completed a row! Claim your prize at the Registration Desk.',
        type: 'success',
      })
    }
  }, [currentUser, updateAttendee, addNotification])

  const completeScavenger = useCallback((itemId) => {
    if (!currentUser) return
    const newProgress = [...(currentUser.scavengerProgress || []), itemId]
    updateAttendee(currentUser.id, { scavengerProgress: newProgress })
    addNotification({
      title: 'Found It!',
      body: 'Scavenger hunt item completed!',
      type: 'success',
    })
  }, [currentUser, updateAttendee, addNotification])

  const earnBadge = useCallback((badgeId) => {
    if (!currentUser) return
    const badge = state.badges.find(b => b.id === badgeId)
    if (!badge || currentUser.badgesEarned?.includes(badgeId)) return

    const newBadges = [...(currentUser.badgesEarned || []), badgeId]
    updateAttendee(currentUser.id, { badgesEarned: newBadges })
    addNotification({
      title: 'Badge Earned!',
      body: `You earned the "${badge.name}" badge!`,
      type: 'achievement',
    })
  }, [currentUser, state.badges, updateAttendee, addNotification])

  const submitSurvey = useCallback((surveyId, responses) => {
    updateState(prev => ({
      ...prev,
      surveys: prev.surveys.map(s => 
        s.id === surveyId 
          ? { ...s, responses: s.responses + 1, isOpen: false }
          : s
      )
    }))
    addNotification({
      title: 'Survey Submitted',
      body: 'Thank you for your feedback!',
      type: 'success',
    })
  }, [updateState, addNotification])

  const createAnnouncement = useCallback((announcement) => {
    const newAnnouncement = {
      ...announcement,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
      readBy: [],
    }
    updateState(prev => ({
      ...prev,
      announcements: [newAnnouncement, ...prev.announcements]
    }))
    // Add as notification for relevant users
    addNotification({
      title: newAnnouncement.title,
      body: newAnnouncement.body,
      type: newAnnouncement.type,
    })
  }, [updateState, addNotification])

  const getEventsForDay = useCallback((date) => {
    const requestedDay = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
    return sheetData.events.filter(event =>
      event.startTime.startsWith(date) || event.day === requestedDay
    ).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  }, [sheetData.events])

  const getUpcomingEvents = useCallback((limit = 5) => {
    const now = new Date()
    return sheetData.events
      .filter(e => new Date(e.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, limit)
  }, [sheetData.events])

  const getTodaysEvents = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return getEventsForDay(today)
  }, [getEventsForDay])

  const getConventionCountdown = useCallback(() => {
    const start = new Date(state.startDate)
    const now = new Date()
    const diff = start - now
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, started: true }
    
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      started: false,
    }
  }, [state.startDate])

  const getStats = useCallback(() => {
    const confirmedAttendees = state.attendees.filter(a => a.status === 'confirmed').length
    const checkedIn = state.attendees.filter(a => a.checkedIn).length
    const todaysEvents = getTodaysEvents().length
    const activeAnnouncements = state.announcements.filter(a => 
      new Date(a.expiresAt) > new Date()
    ).length
    const totalMeals = state.meals.length
    const upcomingSessions = getUpcomingEvents(10).length

    return {
      registeredAttendees: confirmedAttendees,
      checkedInAttendees: checkedIn,
      todaysEvents,
      activeAnnouncements,
      totalMeals,
      upcomingSessions,
      countdown: getConventionCountdown(),
    }
  }, [state.attendees, state.announcements, state.meals, getTodaysEvents, getUpcomingEvents, getConventionCountdown])

  const exportData = useCallback((format = 'json') => {
    const data = {
      attendees: state.attendees,
      events: state.events,
      announcements: state.announcements,
      surveys: state.surveys,
      exportedAt: new Date().toISOString(),
    }
    
    if (format === 'csv') {
      // Simple CSV export for attendees
      const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Chapter', 'Role', 'Status', 'Checked In']
      const rows = state.attendees.map(a => [
        a.id, a.firstName, a.lastName, a.email, a.chapterName, a.role, a.status, a.checkedIn ? 'Yes' : 'No'
      ])
      return [headers, ...rows].map(r => r.join(',')).join('\n')
    }
    
    return JSON.stringify(data, null, 2)
  }, [state])

  const value = {
    state,
    currentUser,
    selectedRole,
    adminUnlocked,
    sheetData,
    sheetStatus,
    appConfig,
    setAppConfig,
    theme,
    notifications,
    sidebarOpen,
    activePage,
    setSidebarOpen,
    setActivePage,
    toggleTheme,
    login,
    logout,
    selectRole,
    clearRole,
    registerAttendee,
    updateAttendee,
    toggleFavorite,
    addNotification,
    markNotificationRead,
    checkInAttendee,
    completeBingo,
    completeScavenger,
    earnBadge,
    submitSurvey,
    createAnnouncement,
    getEventsForDay,
    getUpcomingEvents,
    getTodaysEvents,
    getConventionCountdown,
    getStats,
    exportData,
    updateState,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppProvider