const SHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTcWlhv_bK1thPxqX8ZaWaswTyaam1poIRptaJe-18E7IQbK39_ffnKvTUPtfeB8CiL5avfPgCoflCl/pub'

const SHEETS = {
  events: '98461157',
  members: '2068852265',
  speakers: '491764642',
  notifications: '507952865',
  gallery: '1136543810',
}

const DAY_TO_DATE = {
  friday: '2026-08-14',
  saturday: '2026-08-15',
  sunday: '2026-08-16',
}

const parseCsv = (text) => {
  const rows = []
  let row = []
  let value = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"') {
      if (quoted && next === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(value)
      value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(value)
      if (row.some(cell => cell.trim())) rows.push(row)
      row = []
      value = ''
    } else {
      value += char
    }
  }

  if (value || row.length) {
    row.push(value)
    if (row.some(cell => cell.trim())) rows.push(row)
  }

  return rows
}

const rowsToObjects = (rows) => {
  const [headers, ...dataRows] = rows
  if (!headers) return []

  return dataRows.map(row => {
    return headers.reduce((record, header, index) => {
      if (!header) return record
      record[header.trim()] = (row[index] || '').trim()
      return record
    }, {})
  }).filter(record => Object.values(record).some(Boolean))
}

const fetchSheet = async (gid) => {
  const url = `${SHEET_BASE_URL}?gid=${gid}&single=true&output=csv&cacheBust=${Date.now()}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Sheet fetch failed (${response.status})`)
  const text = await response.text()
  return rowsToObjects(parseCsv(text))
}

export const loadPublishedEventRows = async () => fetchSheet(SHEETS.events)

export const loadPublishedMemberRows = async () => fetchSheet(SHEETS.members)

export const loadPublishedSpeakerRows = async () => fetchSheet(SHEETS.speakers)

export const loadPublishedNotificationRows = async () => fetchSheet(SHEETS.notifications)

const parseTime = (time) => {
  const clean = String(time || '').trim()
  if (!clean) return '00:00:00'

  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*([AP]M)?$/i)
  if (!match) return '00:00:00'

  let hours = Number(match[1])
  const minutes = Number(match[2] || 0)
  const ampm = match[3]?.toUpperCase()

  if (ampm === 'PM' && hours !== 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
}

const dateForDay = (day) => {
  const clean = String(day || '').toLowerCase().trim()
  return DAY_TO_DATE[clean] || clean || DAY_TO_DATE.friday
}

const normalizeEvent = (row, index) => {
  const id = row.eventId || row.id || `sheet-event-${index + 1}`
  const date = dateForDay(row.day)

  return {
    id,
    day: row.day || '',
    name: row.title || row.name || 'Untitled Event',
    description: row.description || '',
    startTime: `${date}T${parseTime(row.time)}`,
    endTime: `${date}T${parseTime(row.timeEnd || row.endTime || row.time)}`,
    room: row.location || '',
    roomId: (row.location || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    dressCode: row.dressCode || '',
    requiredRole: row.requiredRole || row.required || '',
    mensDressCode: row.mensDressCode || row.mensDress || '',
    presenter: row.speaker || row.presenter || '',
    category: row.type || 'event',
    notes: row.notes || '',
    isFavorite: false,
    capacity: Number(row.capacity) || 0,
    attended: [],
    source: 'google-sheet',
  }
}

export const normalizeSheetRowForAdminSchedule = (row, index) => ({
  id: row.eventId || row.id || `sheet-event-${index + 1}`,
  eventId: row.eventId || row.id || `sheet-event-${index + 1}`,
  title: row.title || row.name || 'Untitled Event',
  day: row.day || 'Friday',
  time: row.time || '',
  timeEnd: row.timeEnd || row.endTime || '',
  location: row.location || '',
  description: row.description || '',
  type: row.type || '',
  speaker: row.speaker || '',
  requiredRole: row.requiredRole || row.required || (Array.isArray(row.requiredRoles) ? row.requiredRoles.join(', ') : ''),
  dressCode: row.dressCode || (Array.isArray(row.dressCodes) ? row.dressCodes.join(', ') : ''),
  mensDressCode: row.mensDressCode || row.mensDress || '',
  dateCreated: row.dateCreated || '',
})

export const normalizeAdminEventForSchedule = (event) => ({
  id: event.id || `admin-event-${Date.now()}`,
  name: event.name || event.title || 'Untitled Event',
  description: event.description || '',
  startTime: event.startTime || '',
  endTime: event.endTime || event.startTime || '',
  room: event.room || event.location || '',
  roomId: (event.room || event.location || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  dressCode: event.dressCode || '',
  presenter: event.presenter || event.speaker || '',
  category: event.category || event.type || 'event',
  notes: event.notes || '',
  isFavorite: false,
  capacity: Number(event.capacity) || 0,
  attended: [],
  source: event.source || 'admin-local',
})

const normalizeSpeaker = (row, index) => ({
  id: row.speakerId || row.id || `sheet-speaker-${index + 1}`,
  speakerId: row.speakerId || row.id || `sheet-speaker-${index + 1}`,
  memberId: row.memberId || '',
  name: row.name || '',
  title: row.title || '',
  detail: row.bio || row.detail || '',
  bio: row.bio || row.detail || '',
  photo: row.photo || '',
  icon: 'mic',
  eventIds: String(row.event || row.eventIds || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean),
  event: row.event || row.eventIds || '',
  source: 'google-sheet',
})

export const normalizeSheetRowForAdminSpeaker = (row, index) => ({
  id: row.speakerId || row.id || `sheet-speaker-${index + 1}`,
  speakerId: row.speakerId || row.id || '',
  memberId: row.memberId || '',
  name: row.name || '',
  title: row.title || '',
  photo: row.photo || '',
  bio: row.bio || row.detail || '',
  event: row.event || row.eventIds || '',
})

const inferMemberCategory = (station = '') => {
  const value = station.toLowerCase()
  if (value.includes('mother advisor')) return 'Mother Advisors'
  if (value.includes('executive') || value.includes('secretary') || value.includes('treasurer') || value.includes('inspector')) return 'Adult Grand Executive Committee'
  if (value.includes('majority')) return 'Majority Committee'
  return 'Grand Officers'
}

const normalizeMember = (row, index) => ({
  id: row.memberId || row.id || `sheet-member-${index + 1}`,
  memberId: row.memberId || row.id || `sheet-member-${index + 1}`,
  name: row.name || '',
  position: row.station || row.position || '',
  station: row.station || row.position || '',
  assembly: row.assembly || '',
  photo: row.photo || '',
  bio: row.bio || '',
  videoUrl: row.videoUrl || row.video || row.videoLink || '',
  isSpeaker: String(row.isSpeaker || row.speaker || '').toLowerCase() === 'true',
  category: row.category || inferMemberCategory(row.station),
  source: 'google-sheet',
})

export const normalizeSheetRowForAdminMember = (row, index) => ({
  id: row.memberId || row.id || `sheet-member-${index + 1}`,
  memberId: row.memberId || row.id || '',
  name: row.name || '',
  station: row.station || row.position || '',
  assembly: row.assembly || '',
  photo: row.photo || '',
  bio: row.bio || '',
  category: row.category || inferMemberCategory(row.station || row.position),
  videoUrl: row.videoUrl || row.video || row.videoLink || '',
  isSpeaker: String(row.isSpeaker || row.speaker || '').toLowerCase() === 'true',
})

export const normalizeNotificationRow = (row, index) => ({
  id: row.id || `sheet-notification-${index + 1}`,
  title: row.title || 'Convention Update',
  body: row.message || row.body || '',
  message: row.message || row.body || '',
  timestamp: row.date || row.timestamp || new Date().toISOString(),
  date: row.date || row.timestamp || new Date().toISOString(),
  type: (row.type || row.priority || 'info').toLowerCase(),
  status: (row.status || 'active').toLowerCase(),
  displayUntil: row.displayUntil || row.expiresAt || row.endDate || '',
  ticker: String(row.ticker || 'true').toLowerCase() !== 'false',
  read: false,
  source: 'google-sheet',
})

const normalizeGalleryPhoto = (row, index) => ({
  id: row.id || `sheet-photo-${index + 1}`,
  url: row.url || '',
  title: row.title || row.caption || 'Photo',
  description: row.description || row.caption || '',
  caption: row.caption || row.description || '',
  category: row.category || 'Convention',
  day: row.day || '',
  photographer: row.photographer || row.uploadedBy || 'Convention Team',
  tags: String(row.tags || row.tag || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean),
  thumbnail: row.thumbnail || row.thumbnailUrl || '',
  featured: String(row.featured || '').toLowerCase() === 'true',
  likes: 0,
  comments: 0,
  liked: false,
  uploadedBy: row.uploadedBy || 'Convention Team',
  uploadDate: row.date || new Date().toISOString(),
  source: 'google-sheet',
})

export const loadPublishedSheetData = async () => {
  const [eventRows, memberRows, speakerRows, notificationRows, galleryRows] = await Promise.all([
    fetchSheet(SHEETS.events),
    fetchSheet(SHEETS.members),
    fetchSheet(SHEETS.speakers),
    fetchSheet(SHEETS.notifications),
    fetchSheet(SHEETS.gallery),
  ])

  return {
    events: eventRows.map(normalizeEvent),
    members: memberRows.map(normalizeMember),
    speakers: speakerRows.map(normalizeSpeaker),
    notifications: notificationRows.map(normalizeNotificationRow),
    gallery: galleryRows.map(normalizeGalleryPhoto).filter(photo => photo.url),
  }
}
