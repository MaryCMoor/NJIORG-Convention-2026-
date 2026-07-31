export const conventionSpeakers = [
  {
    id: 'madison-caldwell',
    name: 'Madison Rose Caldwell',
    title: 'Grand Worthy Advisor',
    detail: 'Leadership, service, and the future of Rainbow.',
    icon: 'crown',
    eventIds: ['evt-2', 'evt-16', 'evt-25', 'evt-26'],
  },
  {
    id: 'eleanor-whitmore',
    name: 'Mrs. Eleanor Whitmore',
    title: 'Supreme Inspector',
    detail: 'Guidance and inspiration for Grand Assembly.',
    icon: 'star',
    eventIds: ['evt-25'],
  },
  {
    id: 'victoria-chen',
    name: 'Victoria Chen',
    title: 'Grand Worthy Associate Advisor',
    detail: 'Sisterhood, mentorship, and convention memories.',
    icon: 'award',
    eventIds: ['evt-7'],
  },
  {
    id: 'patricia-montgomery',
    name: 'Mrs. Patricia Montgomery',
    title: 'Supreme Deputy',
    detail: 'Rainbow values and lifelong leadership.',
    icon: 'sparkles',
    eventIds: ['evt-25'],
  },
]

export const getSpeakerScheduleTags = (events, speakerId) => {
  const speaker = conventionSpeakers.find(item => item.id === speakerId)
  if (!speaker) return []

  return speaker.eventIds
    .map(eventId => events.find(event => event.id === eventId))
    .filter(Boolean)
}

export const getEventSpeakerTags = (event) => {
  return conventionSpeakers.filter(speaker => speaker.eventIds.includes(event.id))
}
