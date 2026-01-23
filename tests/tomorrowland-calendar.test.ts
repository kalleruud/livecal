import { describe, expect, test } from 'bun:test'
import { generateIcsCalendar } from 'ts-ics'
import { buildCalendar } from '../src/integrations/tomorrowland/calendar.ts'
import type {
  TomorrowlandPerformance,
  TomorrowlandStageInfo,
} from '../src/integrations/tomorrowland/types.ts'

// Mock data
const mockPerformances: TomorrowlandPerformance[] = [
  {
    id: '2658072650',
    name: 'DVBBS',
    artists: [
      {
        id: '1358428583',
        name: 'DVBBS',
        image:
          'https://artist-lineup-cdn.tomorrowland.com/53776026-BREATHE9490.jpg',
      },
    ],
    stage: {
      id: '2643140614',
      name: 'PLANAXIS',
    },
    date: '2026-07-18',
    day: 'SATURDAY',
    startTime: '2026-07-18 12:00:00+02:00',
    endTime: '2026-07-18 12:45:00+02:00',
  },
  {
    id: '2658072651',
    name: 'TIËSTO',
    artists: [
      {
        id: '1358428584',
        name: 'TIËSTO',
        image: 'https://artist-lineup-cdn.tomorrowland.com/tiesto-image.jpg',
      },
    ],
    stage: {
      id: '2643200378',
      name: 'MAINSTAGE',
    },
    date: '2026-07-18',
    day: 'SATURDAY',
    startTime: '2026-07-18 19:00:00+02:00',
    endTime: '2026-07-18 20:30:00+02:00',
  },
  {
    id: '2658072652',
    name: 'Charlotte de Witte',
    artists: [
      {
        id: '1358428585',
        name: 'Charlotte de Witte',
        image: 'https://artist-lineup-cdn.tomorrowland.com/charlotte-image.jpg',
      },
    ],
    stage: {
      id: '2643140614',
      name: 'PLANAXIS',
    },
    date: '2026-07-19',
    day: 'SUNDAY',
    startTime: '2026-07-19 01:00:00+02:00',
    endTime: '2026-07-19 02:30:00+02:00',
  },
  {
    id: '2658072653',
    name: 'SvdS & Vinne',
    artists: [
      {
        id: '1358428586',
        name: 'SvdS',
        image: 'https://artist-lineup-cdn.tomorrowland.com/svds-image.jpg',
      },
      {
        id: '1358428587',
        name: 'Vinne',
        image: 'https://artist-lineup-cdn.tomorrowland.com/vinne-image.jpg',
      },
    ],
    stage: {
      id: '2643140430',
      name: 'THE ROSE GARDEN',
    },
    date: '2026-07-17',
    day: 'FRIDAY',
    startTime: '2026-07-17 15:00:00+02:00',
    endTime: '2026-07-17 16:00:00+02:00',
  },
]

const mockStages: TomorrowlandStageInfo[] = [
  {
    id: '2643200378',
    name: 'MAINSTAGE',
    hosts: {},
    mtba: false,
    more_to_be_announced: {},
  },
  {
    id: '2643140614',
    name: 'PLANAXIS',
    hosts: {
      '2026-07-18': 'HOSTED BY 2010 - 2012 PRESENTS 30 YEARS DIM MAK',
      '2026-07-19': 'HOSTED BY MONSTERCAT',
    },
    mtba: false,
    more_to_be_announced: {},
  },
  {
    id: '2643140430',
    name: 'THE ROSE GARDEN',
    hosts: {
      '2026-07-17': 'HOSTED BY RAMPAGE',
    },
    mtba: false,
    more_to_be_announced: {},
  },
]

describe('Tomorrowland Calendar Output', () => {
  test('generates valid ICS calendar with all performances', () => {
    const calendar = buildCalendar(
      mockPerformances,
      { weekend: 'W1' },
      mockStages,
    )
    const ics = generateIcsCalendar(calendar)

    // Verify ICS structure
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('PRODID:-//Livecal//Tomorrowland//EN')

    // Verify calendar name
    expect(ics).toContain('X-WR-CALNAME:Tomorrowland 2026 Weekend 1')

    // Verify all performances are included
    expect(ics).toContain('DVBBS')
    expect(ics).toContain('TIËSTO')
    expect(ics).toContain('Charlotte de Witte')
    expect(ics).toContain('SvdS & Vinne')
  })

  test('includes music emoji in performance summary', () => {
    const calendar = buildCalendar(
      mockPerformances,
      { weekend: 'W1' },
      mockStages,
    )
    const ics = generateIcsCalendar(calendar)

    expect(ics).toContain('SUMMARY:🎵 DVBBS')
    expect(ics).toContain('SUMMARY:🎵 TIËSTO')
  })

  test('includes correct location (stage name)', () => {
    const calendar = buildCalendar(
      mockPerformances,
      { weekend: 'W1' },
      mockStages,
    )
    const ics = generateIcsCalendar(calendar)

    expect(ics).toContain('LOCATION:PLANAXIS')
    expect(ics).toContain('LOCATION:MAINSTAGE')
    expect(ics).toContain('LOCATION:THE ROSE GARDEN')
  })

  test('includes artist names in description', () => {
    const calendar = buildCalendar(
      mockPerformances,
      { weekend: 'W1' },
      mockStages,
    )

    const dvbbsEvent = calendar.events?.find((e) => e.uid === '2658072650')
    expect(dvbbsEvent?.description).toContain('Artists: DVBBS')

    const multiArtistEvent = calendar.events?.find(
      (e) => e.uid === '2658072653',
    )
    expect(multiArtistEvent?.description).toContain('Artists: SvdS, Vinne')
  })

  test('includes stage host information in description', () => {
    const calendar = buildCalendar(
      mockPerformances,
      { weekend: 'W1' },
      mockStages,
    )

    const planaxisEvent = calendar.events?.find((e) => e.uid === '2658072652')
    expect(planaxisEvent?.description).toContain('Stage: HOSTED BY MONSTERCAT')

    const roseGardenEvent = calendar.events?.find((e) => e.uid === '2658072653')
    expect(roseGardenEvent?.description).toContain('Stage: HOSTED BY RAMPAGE')
  })

  test('parses start and end times correctly', () => {
    const calendar = buildCalendar(
      mockPerformances,
      { weekend: 'W1' },
      mockStages,
    )

    const dvbbsEvent = calendar.events?.find((e) => e.uid === '2658072650')
    expect(dvbbsEvent?.start).toBeDefined()
    expect(dvbbsEvent?.end).toBeDefined()

    // Verify the dates are parsed as Date objects
    const startDate = dvbbsEvent?.start
    const endDate = dvbbsEvent?.end
    expect(startDate?.date instanceof Date).toBe(true)
    expect(endDate?.date instanceof Date).toBe(true)
  })

  test('filters performances by artist name (case-insensitive)', () => {
    const calendar = buildCalendar(
      mockPerformances,
      {
        weekend: 'W1',
        artists: ['tiësto'],
      },
      mockStages,
    )

    expect(calendar.events).toHaveLength(1)
    expect(calendar.events?.[0]?.summary).toContain('TIËSTO')
  })

  test('filters performances by partial artist name', () => {
    const calendar = buildCalendar(
      mockPerformances,
      {
        weekend: 'W1',
        artists: ['charlotte'],
      },
      mockStages,
    )

    expect(calendar.events).toHaveLength(1)
    expect(calendar.events?.[0]?.summary).toContain('Charlotte de Witte')
  })

  test('filters performances by stage name (case-insensitive)', () => {
    const calendar = buildCalendar(
      mockPerformances,
      {
        weekend: 'W1',
        stages: ['mainstage'],
      },
      mockStages,
    )

    expect(calendar.events).toHaveLength(1)
    expect(calendar.events?.[0]?.location).toBe('MAINSTAGE')
  })

  test('filters performances by stage name (partial match)', () => {
    const calendar = buildCalendar(
      mockPerformances,
      {
        weekend: 'W1',
        stages: ['rose'],
      },
      mockStages,
    )

    expect(calendar.events).toHaveLength(1)
    expect(calendar.events?.[0]?.location).toBe('THE ROSE GARDEN')
  })

  test('combines artist and stage filters (AND logic)', () => {
    const calendar = buildCalendar(
      mockPerformances,
      {
        weekend: 'W1',
        artists: ['dvbbs'],
        stages: ['planaxis'],
      },
      mockStages,
    )

    expect(calendar.events).toHaveLength(1)
    expect(calendar.events?.[0]?.summary).toContain('DVBBS')
    expect(calendar.events?.[0]?.location).toBe('PLANAXIS')
  })

  test('returns empty calendar when no performances match filters', () => {
    const calendar = buildCalendar(
      mockPerformances,
      {
        weekend: 'W1',
        artists: ['nonexistent'],
      },
      mockStages,
    )

    expect(calendar.events).toHaveLength(0)
  })

  test('handles multiple artist filters (OR logic within category)', () => {
    const calendar = buildCalendar(
      mockPerformances,
      {
        weekend: 'W1',
        artists: ['dvbbs', 'tiësto'],
      },
      mockStages,
    )

    expect(calendar.events).toHaveLength(2)
    const names = calendar.events?.map((e) => e.summary) || []
    expect(names.some((n) => n.includes('DVBBS'))).toBe(true)
    expect(names.some((n) => n.includes('TIËSTO'))).toBe(true)
  })

  test('sets correct weekend in calendar name', () => {
    const w1Calendar = buildCalendar(
      mockPerformances,
      { weekend: 'W1' },
      mockStages,
    )
    expect(w1Calendar.name).toContain('Weekend 1')

    const w2Calendar = buildCalendar(
      mockPerformances,
      { weekend: 'W2' },
      mockStages,
    )
    expect(w2Calendar.name).toContain('Weekend 2')
  })

  test('works without stage information', () => {
    const calendar = buildCalendar(mockPerformances, { weekend: 'W1' })
    const ics = generateIcsCalendar(calendar)

    // Should still include all performances
    expect(ics).toContain('DVBBS')
    expect(ics).toContain('TIËSTO')

    // But descriptions won't have host info
    const dvbbsEvent = calendar.events?.find((e) => e.uid === '2658072650')
    expect(dvbbsEvent?.description).not.toContain('HOSTED BY')
  })

  test('includes unique UIDs for each performance', () => {
    const calendar = buildCalendar(
      mockPerformances,
      { weekend: 'W1' },
      mockStages,
    )
    const uids = calendar.events?.map((e) => e.uid) || []

    const uniqueUids = new Set(uids)
    expect(uniqueUids.size).toBe(uids.length)
  })
})
