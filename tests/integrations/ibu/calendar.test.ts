import { describe, expect, test } from 'bun:test'
import { buildCalendar } from '../../../src/integrations/ibu/calendar.ts'
import type {
  IBUCompetition,
  IBUEvent,
} from '../../../src/integrations/ibu/types.ts'

const mockEvent: IBUEvent = {
  SeasonId: '2526',
  EventId: 'BT2526SWRLCP01',
  StartDate: '2025-11-30T12:00:00Z',
  EndDate: '2025-12-01T12:00:00Z',
  FirstCompetitionDate: '2025-11-30T10:00:00Z',
  Description: 'BMW IBU World Cup Biathlon',
  ShortDescription: 'Kontiolahti',
  Organizer: 'Kontiolahti',
  Nat: 'FIN',
  NatLong: 'Finland',
  EventClassificationId: 'BTSWRLCP',
  Level: 1,
  UTCOffset: 2,
  IsActual: true,
  IsCurrent: false,
}

const mockCompetition: IBUCompetition = {
  RaceId: 'BT2526SWRLCP01SWSP',
  km: '7.5',
  catId: 'SW',
  DisciplineId: 'SP',
  StatusId: 1,
  StatusText: 'Scheduled',
  StartTime: '2025-11-30T13:30:00Z',
  Description: 'Women 7.5km Sprint',
  ShortDescription: 'Women 7.5km Sprint',
  Location: 'Kontiolahti',
  LocalUTCOffset: 2,
}

describe('buildCalendar', () => {
  test('creates calendar with correct prodId', () => {
    const calendar = buildCalendar([], new Map(), new Map(), {
      includeEvents: true,
      includeComps: true,
    })

    expect(calendar.prodId).toBe('-//Livecal//IBU Biathlon World Cup//EN')
    expect(calendar.version).toBe('2.0')
  })

  test('includes events when includeEvents is true', () => {
    const calendar = buildCalendar([mockEvent], new Map(), new Map(), {
      includeEvents: true,
      includeComps: false,
    })

    expect(calendar.events).toHaveLength(1)
    expect(calendar.events?.[0].uid).toBe(mockEvent.EventId)
    expect(calendar.events?.[0].summary).toContain('🏆')
  })

  test('excludes events when includeEvents is false', () => {
    const calendar = buildCalendar([mockEvent], new Map(), new Map(), {
      includeEvents: false,
      includeComps: false,
    })

    expect(calendar.events).toHaveLength(0)
  })

  test('includes competitions when includeComps is true', () => {
    const competitions = new Map([[mockEvent.EventId, [mockCompetition]]])

    const calendar = buildCalendar([mockEvent], competitions, new Map(), {
      includeEvents: false,
      includeComps: true,
    })

    expect(calendar.events).toHaveLength(1)
    expect(calendar.events?.[0].uid).toBe(mockCompetition.RaceId)
  })

  test('adds discipline emoji to scheduled competition', () => {
    const competitions = new Map([[mockEvent.EventId, [mockCompetition]]])

    const calendar = buildCalendar([mockEvent], competitions, new Map(), {
      includeEvents: false,
      includeComps: true,
    })

    expect(calendar.events?.[0].summary).toContain('🎿')
    expect(calendar.events?.[0].summary).not.toContain('✅')
  })

  test('adds completed emoji instead of discipline emoji when completed', () => {
    const completedCompetition = { ...mockCompetition, StatusId: 11 }
    const competitions = new Map([[mockEvent.EventId, [completedCompetition]]])
    const results = new Map([
      [
        completedCompetition.RaceId,
        [
          {
            StartOrder: 1,
            ResultOrder: 1,
            IBUId: 'BTFIN12345678901',
            IsTeam: false,
            Name: 'Test Athlete',
            ShortName: 'T. Athlete',
            Nat: 'FIN',
            Rank: '1',
            Bib: '1',
            Shootings: '0+0+0+0',
            TotalTime: '20:00.0',
            Behind: '0.0',
          },
        ],
      ],
    ])

    const calendar = buildCalendar([mockEvent], competitions, results, {
      includeEvents: false,
      includeComps: true,
    })

    expect(calendar.events?.[0].summary).toContain('✅')
    expect(calendar.events?.[0].summary).not.toContain('🎿')
  })

  test('filters out non-World Cup events', () => {
    const ibucupEvent = { ...mockEvent, Level: 2 }
    const calendar = buildCalendar([ibucupEvent], new Map(), new Map(), {
      includeEvents: true,
      includeComps: true,
    })

    expect(calendar.events).toHaveLength(0)
  })

  test('results use ShortName instead of full Name', () => {
    const completedCompetition = { ...mockCompetition, StatusId: 11 }
    const competitions = new Map([[mockEvent.EventId, [completedCompetition]]])
    const results = new Map([
      [
        completedCompetition.RaceId,
        [
          {
            StartOrder: 1,
            ResultOrder: 1,
            IBUId: 'BTNOR12345678901',
            IsTeam: false,
            Name: 'DALE-SKJEVDAL Johannes',
            ShortName: 'DALE-SKJEVDAL J.',
            Nat: 'NOR',
            Rank: '1',
            Bib: '1',
            Shootings: '0+0+1+0',
            TotalTime: '30:23.9',
            Behind: '0.0',
          },
        ],
      ],
    ])

    const calendar = buildCalendar([mockEvent], competitions, results, {
      includeEvents: false,
      includeComps: true,
    })

    expect(calendar.events?.[0].description).toContain('DALE-SKJEVDAL J.')
    expect(calendar.events?.[0].description).not.toContain(
      'DALE-SKJEVDAL Johannes',
    )
  })

  test('individual events only show non-team results', () => {
    const sprintCompetition = { ...mockCompetition, StatusId: 11 }
    const competitions = new Map([[mockEvent.EventId, [sprintCompetition]]])
    const results = new Map([
      [
        sprintCompetition.RaceId,
        [
          {
            StartOrder: 1,
            ResultOrder: 1,
            IBUId: 'BTNOR12345678901',
            IsTeam: false,
            Name: 'Individual Athlete',
            ShortName: 'INDIVIDUAL A.',
            Nat: 'NOR',
            Rank: '1',
            Bib: '1',
            Shootings: '0+0',
            TotalTime: '20:00.0',
            Behind: '0.0',
          },
          {
            StartOrder: 2,
            ResultOrder: 2,
            IBUId: 'BTNOR00000000001',
            IsTeam: true,
            Name: 'Team Result',
            ShortName: 'TEAM',
            Nat: 'NOR',
            Rank: '1',
            Bib: '2',
            Shootings: '0+0',
            TotalTime: '20:00.0',
            Behind: '0.0',
          },
        ],
      ],
    ])

    const calendar = buildCalendar([mockEvent], competitions, results, {
      includeEvents: false,
      includeComps: true,
    })

    expect(calendar.events?.[0].description).toContain('INDIVIDUAL A.')
    expect(calendar.events?.[0].description).not.toContain('TEAM')
  })

  test('relay events only show team results', () => {
    const relayCompetition = {
      ...mockCompetition,
      RaceId: 'BT2526SWRLCP01SWRL',
      DisciplineId: 'RL' as const,
      StatusId: 11,
    }
    const competitions = new Map([[mockEvent.EventId, [relayCompetition]]])
    const results = new Map([
      [
        relayCompetition.RaceId,
        [
          {
            StartOrder: 1,
            ResultOrder: 1,
            IBUId: 'BTNOR00000000001',
            IsTeam: true,
            Name: 'NORWAY',
            ShortName: 'NORWAY',
            Nat: 'NOR',
            Rank: '1',
            Bib: '1',
            Shootings: '0+2',
            TotalTime: '1:07:06.2',
            Behind: '0.0',
          },
          {
            StartOrder: 2,
            ResultOrder: 2,
            IBUId: 'BTSWE12345678901',
            IsTeam: false,
            Name: 'JOHANSEN Marthe Krakstad',
            ShortName: 'JOHANSEN M.',
            Nat: 'SWE',
            Rank: '1',
            Bib: '2',
            Shootings: '0+0',
            TotalTime: '17:06.9',
            Behind: '0.0',
          },
        ],
      ],
    ])

    const calendar = buildCalendar([mockEvent], competitions, results, {
      includeEvents: false,
      includeComps: true,
    })

    expect(calendar.events?.[0].description).toContain('NORWAY')
    expect(calendar.events?.[0].description).not.toContain('(NOR)')
    expect(calendar.events?.[0].description).not.toContain('JOHANSEN M.')
  })
})
