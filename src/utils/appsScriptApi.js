const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbye_zowHdCbkVyIC2GUxvcXby6_qvVCU6qPR5CjMcqewlfaVXLVbornKXqmldV7NEv0/exec'
const ADMIN_TOKEN = '2026RainboW_Convention-SerVice!'

export const DEFAULT_APP_CONFIG = {
  appTitle: '2026 Rainbow Grand Assembly Convention',
  themeName: 'The Greatest Showman',
  textColor: '#1c1c1c',
  secondaryTextColor: '#6b6b6b',
  backgroundColor: '#fef9ef',
  surfaceColor: '#ffffff',
  surfaceElevatedColor: '#fffdf5',
  borderColor: '#D4AF37',
  buttonTextColor: '#ffffff',
  primaryColor: '#8B0000',
  accentColor: '#D4AF37',
  iconUrl: '',
  numberOfDays: 3,
  startDate: '2026-08-14',
  endDate: '2026-08-16',
  venueName: '',
  venueAddress: '',
  venueCity: '',
  venueState: '',
  venueZip: '',
  contactLine1: '',
  contactLine2: '',
  facebookUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  websiteUrl: '',
  hashtag: '',
}

const dayFromDate = (isoString, fallbackDay) => {
  const byAdminDay = {
    'Day 1': 'Friday',
    'Day 2': 'Saturday',
    'Day 3': 'Sunday',
  }

  if (byAdminDay[fallbackDay]) return byAdminDay[fallbackDay]

  if (!isoString) return fallbackDay || 'Friday'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return fallbackDay || 'Friday'
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

const timeFromIso = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const sendEventToGoogleSheet = async (event, action = 'createEvent') => {
  const payload = {
    action,
    token: ADMIN_TOKEN,
    eventId: event.eventId || event.id,
    title: event.title || event.name || '',
    day: dayFromDate(event.startTime, event.day),
    time: event.time || timeFromIso(event.startTime),
    timeEnd: event.timeEnd || timeFromIso(event.endTime),
    location: event.location || event.room || '',
    description: event.description || '',
    type: event.category || event.type || '',
    speaker: event.presenter || event.speaker || '',
    parentEventId: event.parentEventId || event.parentId || '',
    requiredRole: Array.isArray(event.requiredRoles) ? event.requiredRoles.join(', ') : (event.requiredRole || event.required || ''),
    dressCode: Array.isArray(event.dressCodes) ? event.dressCodes.join(', ') : (event.dressCode || ''),
    mensDressCode: event.mensDressCode || '',
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    // Keep this a simple request so Apps Script does not require CORS preflight.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    data = { ok: response.ok, raw: text }
  }

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Google Sheet save failed (${response.status})`)
  }

  return data
}

export const saveEventToGoogleSheet = async (event) => sendEventToGoogleSheet(event, 'createEvent')

export const updateEventInGoogleSheet = async (event) => sendEventToGoogleSheet(event, 'updateEvent')

const sendMemberToGoogleSheet = async (member, action = 'createMember') => {
  const payload = {
    action,
    token: ADMIN_TOKEN,
    memberId: member.memberId || member.id,
    name: member.name || '',
    station: member.station || member.position || '',
    assembly: member.assembly || '',
    photo: member.photo || '',
    bio: member.bio || '',
    category: member.category || '',
    videoUrl: member.videoUrl || '',
    isSpeaker: member.isSpeaker === true,
    originalName: member.originalName || '',
    originalStation: member.originalStation || '',
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  const text = await response.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    data = { ok: response.ok, raw: text }
  }
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Google Sheet save failed (${response.status})`)
  }
  return data
}

export const saveMemberToGoogleSheet = async (member) => sendMemberToGoogleSheet(member, 'createMember')

export const updateMemberInGoogleSheet = async (member) => sendMemberToGoogleSheet(member, 'updateMember')

const sendSpeakerToGoogleSheet = async (speaker, action = 'createSpeaker') => {
  const payload = {
    action,
    token: ADMIN_TOKEN,
    speakerId: speaker.speakerId || speaker.id,
    memberId: speaker.memberId || '',
    name: speaker.name || '',
    title: speaker.title || '',
    photo: speaker.photo || '',
    bio: speaker.bio || speaker.detail || '',
    event: speaker.event || speaker.eventIds || '',
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  const text = await response.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    data = { ok: response.ok, raw: text }
  }
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Google Sheet save failed (${response.status})`)
  }
  return data
}

export const saveSpeakerToGoogleSheet = async (speaker) => sendSpeakerToGoogleSheet(speaker, 'createSpeaker')

export const updateSpeakerInGoogleSheet = async (speaker) => sendSpeakerToGoogleSheet(speaker, 'updateSpeaker')

export const loadAssembliesFromGoogleSheet = async () => {
  const response = await fetch(`${APPS_SCRIPT_URL}?action=getAssemblies&cacheBust=${Date.now()}`)
  const text = await response.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Assemblies endpoint did not return JSON')
  }
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Assemblies fetch failed (${response.status})`)
  }
  return data.assemblies || []
}

const sendAssemblyToGoogleSheet = async (assembly, action = 'createAssembly') => {
  const payload = {
    action,
    token: ADMIN_TOKEN,
    assemblyId: assembly.assemblyId || assembly.id,
    assemblyName: assembly.assemblyName || assembly.name || '',
    motherAdvisor: assembly.motherAdvisor || '',
    termTheme: assembly.termTheme || '',
    galleryMediaUrls: assembly.galleryMediaUrls || assembly.galleryImageUrls || '',
    galleryImageUrls: assembly.galleryImageUrls || assembly.galleryMediaUrls || '',
    notes: assembly.notes || '',
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  const text = await response.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    data = { ok: response.ok, raw: text }
  }
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Google Sheet save failed (${response.status})`)
  }
  return data
}

export const saveAssemblyToGoogleSheet = async (assembly) => sendAssemblyToGoogleSheet(assembly, 'createAssembly')

export const updateAssemblyInGoogleSheet = async (assembly) => sendAssemblyToGoogleSheet(assembly, 'updateAssembly')

const sendNotificationToGoogleSheet = async (notification, action = 'createNotification') => {
  const payload = {
    action,
    token: ADMIN_TOKEN,
    id: notification.id,
    title: notification.title || '',
    message: notification.message || notification.body || notification.description || '',
    date: notification.date || notification.timestamp || new Date().toISOString(),
    type: notification.type || notification.priority || 'info',
    status: notification.status || 'active',
    displayUntil: notification.displayUntil || '',
    ticker: notification.ticker !== false,
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    data = { ok: response.ok, raw: text }
  }

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Google Sheet save failed (${response.status})`)
  }

  return data
}

export const saveNotificationToGoogleSheet = async (notification) => sendNotificationToGoogleSheet(notification, 'createNotification')

export const updateNotificationInGoogleSheet = async (notification) => sendNotificationToGoogleSheet(notification, 'updateNotification')

export const loadAppConfigFromGoogleSheet = async () => {
  const response = await fetch(`${APPS_SCRIPT_URL}?action=getAppConfig&cacheBust=${Date.now()}`)
  const text = await response.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('App config endpoint did not return JSON')
  }
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `App config fetch failed (${response.status})`)
  }
  const config = { ...DEFAULT_APP_CONFIG, ...(data.config || {}) }
  const normalizeDate = (value, fallback) => {
    if (!value) return fallback
    const text = String(value)
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
    const date = new Date(text)
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString().slice(0, 10)
  }

  return {
    ...config,
    numberOfDays: Number(config.numberOfDays) || DEFAULT_APP_CONFIG.numberOfDays,
    startDate: normalizeDate(config.startDate, DEFAULT_APP_CONFIG.startDate),
    endDate: normalizeDate(config.endDate, DEFAULT_APP_CONFIG.endDate),
  }
}

export const saveAppConfigToGoogleSheet = async (config) => {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'saveAppConfig', token: ADMIN_TOKEN, config }),
  })
  const text = await response.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    data = { ok: response.ok, raw: text }
  }
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `App config save failed (${response.status})`)
  }
  return data
}
