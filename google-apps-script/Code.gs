const ADMIN_TOKEN = '2026RainboW_Convention-SerVice!';

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'getAppConfig') {
    return getAppConfig();
  }

  return jsonResponse({
    ok: true,
    success: true,
    message: 'Convention app Google Sheet writer is running'
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (body.token !== ADMIN_TOKEN) {
      return jsonResponse({ ok: false, success: false, error: 'Unauthorized' });
    }

    const action = body.action || 'createEvent';

    if (action === 'createEvent' || action === 'addEvent' || action === 'saveEvent') return createEvent(body);
    if (action === 'updateEvent') return updateEvent(body);
    if (action === 'createMember' || action === 'addMember' || action === 'saveMember') return createMember(body);
    if (action === 'updateMember') return updateMember(body);
    if (action === 'createSpeaker' || action === 'addSpeaker' || action === 'saveSpeaker') return createSpeaker(body);
    if (action === 'updateSpeaker') return updateSpeaker(body);
    if (action === 'createNotification' || action === 'addNotification' || action === 'saveNotification') return createNotification(body);
    if (action === 'updateNotification') return updateNotification(body);
    if (action === 'saveAppConfig') return saveAppConfig(body);

    return jsonResponse({ ok: false, success: false, error: 'Unknown action' });
  } catch (error) {
    return jsonResponse({ ok: false, success: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function getSheetByName(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(name + ' sheet not found');
  return sheet;
}

function getHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(header) {
    return String(header || '').trim();
  });
}

function ensureHeaders(sheet, desiredHeaders) {
  let headers = getHeaders(sheet);
  let changed = false;

  desiredHeaders.forEach(function(header) {
    if (headers.indexOf(header) === -1) {
      headers.push(header);
      changed = true;
    }
  });

  if (headers.length === 0) {
    headers = desiredHeaders;
    changed = true;
  }

  if (changed) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return headers;
}

function writeObjectRow(sheet, rowNumber, headers, data) {
  const values = headers.map(function(header) {
    return data[header] !== undefined ? data[header] : '';
  });
  sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
}

function findRowById(sheet, headers, idHeader, id) {
  const idIndex = headers.indexOf(idHeader);
  if (idIndex === -1) return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (let i = 0; i < values.length; i += 1) {
    if (String(values[i][idIndex]) === String(id)) return i + 2;
  }
  return -1;
}

function getEventsSheet() {
  return getSheetByName('Events');
}

function buildEventData(body, eventId, dateCreated) {
  return {
    eventId: eventId,
    title: body.title || '',
    day: body.day || '',
    time: body.time || '',
    timeEnd: body.timeEnd || '',
    location: body.location || '',
    description: body.description || '',
    type: body.type || '',
    speaker: body.speaker || '',
    requiredRole: body.requiredRole || body.required || '',
    dressCode: body.dressCode || '',
    mensDressCode: body.mensDressCode || body.mensDress || '',
    dateCreated: dateCreated || new Date().toISOString()
  };
}

function createEvent(body) {
  const sheet = getEventsSheet();
  const headers = ensureHeaders(sheet, ['eventId', 'title', 'day', 'time', 'timeEnd', 'location', 'description', 'type', 'speaker', 'requiredRole', 'dressCode', 'mensDressCode', 'dateCreated']);
  const eventId = body.eventId || 'event_' + Date.now();
  const dateCreated = new Date().toISOString();
  writeObjectRow(sheet, sheet.getLastRow() + 1, headers, buildEventData(body, eventId, dateCreated));
  return jsonResponse({ ok: true, success: true, action: 'createEvent', eventId: eventId, dateCreated: dateCreated });
}

function updateEvent(body) {
  const sheet = getEventsSheet();
  const headers = ensureHeaders(sheet, ['eventId', 'title', 'day', 'time', 'timeEnd', 'location', 'description', 'type', 'speaker', 'requiredRole', 'dressCode', 'mensDressCode', 'dateCreated']);
  const eventId = body.eventId || body.id;
  if (!eventId) return jsonResponse({ ok: false, success: false, error: 'Missing eventId' });
  const rowNumber = findRowById(sheet, headers, 'eventId', eventId);
  if (rowNumber === -1) return jsonResponse({ ok: false, success: false, error: 'Event not found' });
  const existing = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const dateCreatedIndex = headers.indexOf('dateCreated');
  const dateCreated = dateCreatedIndex >= 0 ? existing[dateCreatedIndex] : body.dateCreated;
  writeObjectRow(sheet, rowNumber, headers, buildEventData(body, eventId, dateCreated));
  return jsonResponse({ ok: true, success: true, action: 'updateEvent', eventId: eventId, updatedAt: new Date().toISOString() });
}

function getMembersSheet() {
  return getSheetByName('Members');
}

function buildMemberData(body, memberId) {
  return {
    memberId: memberId,
    name: body.name || '',
    station: body.station || body.position || '',
    assembly: body.assembly || '',
    photo: body.photo || '',
    bio: body.bio || '',
    category: body.category || '',
    videoUrl: body.videoUrl || '',
    isSpeaker: body.isSpeaker === true ? 'TRUE' : 'FALSE'
  };
}

function findMemberRow(sheet, headers, body) {
  const memberId = body.memberId || body.id;
  if (memberId) {
    const rowById = findRowById(sheet, headers, 'memberId', memberId);
    if (rowById !== -1) return rowById;
  }

  const nameIndex = headers.indexOf('name');
  const stationIndex = headers.indexOf('station');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2 || nameIndex === -1) return -1;

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (let i = 0; i < values.length; i += 1) {
    const row = values[i];
    const sameName = String(row[nameIndex] || '') === String(body.originalName || body.name || '');
    const sameStation = stationIndex === -1 || String(row[stationIndex] || '') === String(body.originalStation || body.station || '');
    if (sameName && sameStation) return i + 2;
  }
  return -1;
}

function createMember(body) {
  const sheet = getMembersSheet();
  const headers = ensureHeaders(sheet, ['memberId', 'name', 'station', 'assembly', 'photo', 'bio', 'category', 'videoUrl', 'isSpeaker']);
  const memberId = body.memberId || 'member_' + Date.now();
  writeObjectRow(sheet, sheet.getLastRow() + 1, headers, buildMemberData(body, memberId));
  syncSpeakerFromMember(body, memberId);
  return jsonResponse({ ok: true, success: true, action: 'createMember', memberId: memberId });
}

function updateMember(body) {
  const sheet = getMembersSheet();
  const headers = ensureHeaders(sheet, ['memberId', 'name', 'station', 'assembly', 'photo', 'bio', 'category', 'videoUrl', 'isSpeaker']);
  const memberId = body.memberId || body.id || 'member_' + Date.now();
  const rowNumber = findMemberRow(sheet, headers, body);
  if (rowNumber === -1) return jsonResponse({ ok: false, success: false, error: 'Member not found' });
  writeObjectRow(sheet, rowNumber, headers, buildMemberData(body, memberId));
  syncSpeakerFromMember(body, memberId);
  return jsonResponse({ ok: true, success: true, action: 'updateMember', memberId: memberId, updatedAt: new Date().toISOString() });
}

function getSpeakersSheet() {
  return getSheetByName('Speakers');
}

function buildSpeakerData(body, speakerId) {
  return {
    speakerId: speakerId,
    memberId: body.memberId || '',
    name: body.name || '',
    title: body.title || body.station || body.position || '',
    photo: body.photo || '',
    bio: body.bio || '',
    event: body.event || ''
  };
}

function findSpeakerRow(sheet, headers, body) {
  const speakerId = body.speakerId || body.id;
  if (speakerId) {
    const rowById = findRowById(sheet, headers, 'speakerId', speakerId);
    if (rowById !== -1) return rowById;
  }
  const memberId = body.memberId || '';
  if (memberId) {
    const rowByMember = findRowById(sheet, headers, 'memberId', memberId);
    if (rowByMember !== -1) return rowByMember;
  }
  const nameIndex = headers.indexOf('name');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2 || nameIndex === -1) return -1;
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (let i = 0; i < values.length; i += 1) {
    if (String(values[i][nameIndex] || '') === String(body.name || '')) return i + 2;
  }
  return -1;
}

function createSpeaker(body) {
  const sheet = getSpeakersSheet();
  const headers = ensureHeaders(sheet, ['speakerId', 'memberId', 'name', 'title', 'photo', 'bio', 'event']);
  const speakerId = body.speakerId || 'speaker_' + Date.now();
  writeObjectRow(sheet, sheet.getLastRow() + 1, headers, buildSpeakerData(body, speakerId));
  return jsonResponse({ ok: true, success: true, action: 'createSpeaker', speakerId: speakerId });
}

function updateSpeaker(body) {
  const sheet = getSpeakersSheet();
  const headers = ensureHeaders(sheet, ['speakerId', 'memberId', 'name', 'title', 'photo', 'bio', 'event']);
  const speakerId = body.speakerId || body.id || 'speaker_' + Date.now();
  const rowNumber = findSpeakerRow(sheet, headers, body);
  if (rowNumber === -1) return createSpeaker(Object.assign({}, body, { speakerId: speakerId }));
  writeObjectRow(sheet, rowNumber, headers, buildSpeakerData(body, speakerId));
  return jsonResponse({ ok: true, success: true, action: 'updateSpeaker', speakerId: speakerId, updatedAt: new Date().toISOString() });
}

function deleteSpeakerForMember(memberId, name) {
  const sheet = getSpeakersSheet();
  const headers = ensureHeaders(sheet, ['speakerId', 'memberId', 'name', 'title', 'photo', 'bio', 'event']);
  const rowNumber = findSpeakerRow(sheet, headers, { memberId: memberId, name: name });
  if (rowNumber !== -1) sheet.deleteRow(rowNumber);
}

function syncSpeakerFromMember(body, memberId) {
  if (body.isSpeaker === true) {
    updateSpeaker({
      speakerId: 'speaker_' + memberId,
      memberId: memberId,
      name: body.name || '',
      title: body.station || body.position || '',
      photo: body.photo || '',
      bio: body.bio || '',
      event: body.event || ''
    });
  } else {
    deleteSpeakerForMember(memberId, body.name || '');
  }
}

function getNotificationsSheet() {
  return getSheetByName('Notifications');
}

function buildNotificationData(body, id) {
  return {
    id: id,
    title: body.title || '',
    message: body.message || '',
    date: body.date || new Date().toISOString(),
    type: body.type || 'info',
    status: body.status || 'active',
    displayUntil: body.displayUntil || '',
    ticker: body.ticker === false ? 'FALSE' : 'TRUE'
  };
}

function createNotification(body) {
  const sheet = getNotificationsSheet();
  const headers = ensureHeaders(sheet, ['id', 'title', 'message', 'date', 'type', 'status', 'displayUntil', 'ticker']);
  const id = body.id || 'notification_' + Date.now();
  writeObjectRow(sheet, sheet.getLastRow() + 1, headers, buildNotificationData(body, id));
  return jsonResponse({ ok: true, success: true, action: 'createNotification', id: id });
}

function updateNotification(body) {
  const sheet = getNotificationsSheet();
  const headers = ensureHeaders(sheet, ['id', 'title', 'message', 'date', 'type', 'status', 'displayUntil', 'ticker']);
  const id = body.id;
  if (!id) return jsonResponse({ ok: false, success: false, error: 'Missing id' });
  const rowNumber = findRowById(sheet, headers, 'id', id);
  if (rowNumber === -1) return jsonResponse({ ok: false, success: false, error: 'Notification not found' });
  writeObjectRow(sheet, rowNumber, headers, buildNotificationData(body, id));
  return jsonResponse({ ok: true, success: true, action: 'updateNotification', id: id, updatedAt: new Date().toISOString() });
}

function defaultAppConfig() {
  return {
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
    numberOfDays: '3',
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
    hashtag: ''
  };
}

function getAppConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('AppConfig');

  if (!sheet) {
    sheet = ss.insertSheet('AppConfig');
  }

  const headers = ensureHeaders(sheet, ['key', 'value']);
  if (sheet.getLastRow() < 2) {
    const defaults = defaultAppConfig();
    Object.keys(defaults).forEach(function(key) {
      sheet.appendRow([key, defaults[key]]);
    });
  }

  return sheet;
}

function getAppConfig() {
  const sheet = getAppConfigSheet();
  const config = defaultAppConfig();
  const lastRow = sheet.getLastRow();

  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    values.forEach(function(row) {
      const key = String(row[0] || '').trim();
      if (key) config[key] = row[1];
    });
  }

  config.numberOfDays = Number(config.numberOfDays) || 3;

  return jsonResponse({
    ok: true,
    success: true,
    action: 'getAppConfig',
    config: config
  });
}

function saveAppConfig(body) {
  const sheet = getAppConfigSheet();
  const config = Object.assign(defaultAppConfig(), body.config || {});
  const lastRow = sheet.getLastRow();
  const existing = {};

  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    values.forEach(function(row, index) {
      const key = String(row[0] || '').trim();
      if (key) existing[key] = index + 2;
    });
  }

  Object.keys(config).forEach(function(key) {
    const rowNumber = existing[key];
    if (rowNumber) {
      sheet.getRange(rowNumber, 2).setValue(config[key]);
    } else {
      sheet.appendRow([key, config[key]]);
    }
  });

  return jsonResponse({
    ok: true,
    success: true,
    action: 'saveAppConfig',
    config: config,
    updatedAt: new Date().toISOString()
  });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
