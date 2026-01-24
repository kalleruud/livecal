import { describe, expect, test } from 'bun:test'
import { generateIcsCalendar } from 'ts-ics'
import { buildCalendar } from '../src/integrations/ibu/calendar.ts'
import type {
  IBUCompetition,
  IBUEvent,
  IBUResult,
  IBUResultsData,
} from '../src/integrations/ibu/types.ts'

// Helper to create results data
function resultsData(
  results: IBUResult[],
  isStartList = false,
): IBUResultsData {
  return { isStartList, results }
}

// Mock data representing realistic IBU API responses
const mockEvent: IBUEvent = {
  SeasonId: '2526',
  EventId: 'BT2526SWRLCP01',
  StartDate: '2025-11-30T12:00:00Z',
  EndDate: '2025-12-07T12:00:00Z',
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

const mockSprintCompetition: IBUCompetition = {
  RaceId: 'BT2526SWRLCP01SWSP',
  km: '7.5',
  catId: 'SW',
  DisciplineId: 'SP',
  StatusId: 11, // Final
  StatusText: 'Final',
  StartTime: '2025-11-30T13:30:00Z',
  Description: 'Women 7.5km Sprint',
  ShortDescription: 'Women 7.5km Sprint',
  Location: 'Kontiolahti',
  LocalUTCOffset: 2,
  NrShootings: 2,
  ShootingPositions: 'PS',
  StartMode: 'I',
  PenaltySeconds: 0,
}

const mockRelayCompetition: IBUCompetition = {
  RaceId: 'BT2526SWRLCP01SWRL',
  km: '4x6',
  catId: 'SW',
  DisciplineId: 'RL',
  StatusId: 11,
  StatusText: 'Final',
  StartTime: '2025-12-01T14:00:00Z',
  Description: 'Women 4x6km Relay',
  ShortDescription: 'Women 4x6km Relay',
  Location: 'Kontiolahti',
  LocalUTCOffset: 2,
  NrShootings: 2,
  ShootingPositions: 'PS',
  NrLegs: 4,
  HasSpareRounds: true,
  NrSpareRounds: 3,
}

const mockScheduledCompetition: IBUCompetition = {
  RaceId: 'BT2526SWRLCP01SWMS',
  km: '12.5',
  catId: 'SW',
  DisciplineId: 'MS',
  StatusId: 1,
  StatusText: 'Scheduled',
  StartTime: '2025-12-02T14:30:00Z',
  Description: 'Women 12.5km Mass Start',
  ShortDescription: 'Women 12.5km Mass Start',
  Location: 'Kontiolahti',
  LocalUTCOffset: 2,
  NrShootings: 4,
  ShootingPositions: 'PPSS',
  StartMode: 'M',
  PenaltySeconds: 0,
}

const mockSprintResults: IBUResult[] = [
  {
    StartOrder: 1,
    ResultOrder: 1,
    IBUId: 'BTNOR12345678901',
    IsTeam: false,
    Name: 'ECKHOFF Tiril',
    ShortName: 'ECKHOFF T.',
    Nat: 'NOR',
    Rank: '1',
    Bib: '1',
    Shootings: '0+0',
    TotalTime: '19:45.3',
    Behind: '0.0',
  },
  {
    StartOrder: 5,
    ResultOrder: 2,
    IBUId: 'BTFRA12345678901',
    IsTeam: false,
    Name: 'SIMON Julia',
    ShortName: 'SIMON J.',
    Nat: 'FRA',
    Rank: '2',
    Bib: '5',
    Shootings: '0+1',
    TotalTime: '20:02.1',
    Behind: '+16.8',
  },
  {
    StartOrder: 10,
    ResultOrder: 3,
    IBUId: 'BTSWE12345678901',
    IsTeam: false,
    Name: 'OEBERG Hanna',
    ShortName: 'OEBERG H.',
    Nat: 'SWE',
    Rank: '3',
    Bib: '10',
    Shootings: '1+0',
    TotalTime: '20:15.7',
    Behind: '+30.4',
  },
]

const mockRelayResults: IBUResult[] = [
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
    IBUId: 'BTFRA00000000001',
    IsTeam: true,
    Name: 'FRANCE',
    ShortName: 'FRANCE',
    Nat: 'FRA',
    Rank: '2',
    Bib: '2',
    Shootings: '0+4',
    TotalTime: '1:07:45.8',
    Behind: '+39.6',
  },
  // Individual leg result that should be filtered out
  {
    StartOrder: 1,
    ResultOrder: 1,
    IBUId: 'BTNOR12345678902',
    IsTeam: false,
    Name: 'ROEISELAND Marte Olsbu',
    ShortName: 'ROEISELAND M.',
    Nat: 'NOR',
    Rank: '1',
    Bib: '1',
    Shootings: '0+0',
    TotalTime: '17:06.9',
    Behind: '0.0',
  },
]

const mockStartList: IBUResult[] = [
  {
    StartOrder: 2,
    ResultOrder: 2,
    IBUId: 'BTFRA12345678901',
    IsTeam: false,
    Name: 'SIMON Julia',
    ShortName: 'SIMON J.',
    Nat: 'FRA',
    Rank: null,
    Bib: '5',
    Shootings: '',
    TotalTime: null,
    Behind: null,
  },
  {
    StartOrder: 1,
    ResultOrder: 1,
    IBUId: 'BTNOR12345678901',
    IsTeam: false,
    Name: 'ECKHOFF Tiril',
    ShortName: 'ECKHOFF T.',
    Nat: 'NOR',
    Rank: null,
    Bib: '1',
    Shootings: '',
    TotalTime: null,
    Behind: null,
  },
]

describe('IBU Calendar Output', () => {
  test('generates valid ICS calendar with events and competitions', () => {
    const events = [mockEvent]
    const competitions = new Map([
      [mockEvent.EventId, [mockSprintCompetition, mockRelayCompetition]],
    ])
    const results = new Map([
      [mockSprintCompetition.RaceId, resultsData(mockSprintResults)],
      [mockRelayCompetition.RaceId, resultsData(mockRelayResults)],
    ])

    const calendar = buildCalendar(events, competitions, results, {
      includeEvents: true,
      includeComps: true,
    })

    const ics = generateIcsCalendar(calendar)

    // Verify ICS structure
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('PRODID:-//Livecal//IBU Biathlon World Cup//EN')

    // Verify event (full-day)
    expect(ics).toContain('UID:BT2526SWRLCP01')
    expect(ics).toContain('SUMMARY:🏆 BMW IBU World Cup Biathlon - Kontiolahti')

    // Verify completed sprint competition
    expect(ics).toContain('UID:BT2526SWRLCP01SWSP')
    expect(ics).toContain('SUMMARY:✅ Women 7.5km Sprint')
    expect(ics).toContain(String.raw`LOCATION:Kontiolahti\, Kontiolahti`)

    // Verify completed relay competition
    expect(ics).toContain('UID:BT2526SWRLCP01SWRL')
    expect(ics).toContain('SUMMARY:✅ Women 4x6km Relay')
  })

  test('includes competition details in description', () => {
    const events = [mockEvent]
    const competitions = new Map([[mockEvent.EventId, [mockSprintCompetition]]])
    const results = new Map([
      [mockSprintCompetition.RaceId, resultsData(mockSprintResults)],
    ])

    const calendar = buildCalendar(events, competitions, results, {
      includeEvents: false,
      includeComps: true,
    })

    // Check calendar object directly to avoid ICS line-folding issues
    const event = calendar.events?.[0]
    expect(event?.description).toContain('Distance: 7.5 km')
    expect(event?.description).toContain('Type: Sprint')
    expect(event?.description).toContain('Start: Interval Start')
    expect(event?.description).toContain('Shootings: 2')
    expect(event?.description).toContain('Prone')
    expect(event?.description).toContain('Standing')
  })

  test('shows results for completed competitions', () => {
    const events = [mockEvent]
    const competitions = new Map([[mockEvent.EventId, [mockSprintCompetition]]])
    const results = new Map([
      [mockSprintCompetition.RaceId, resultsData(mockSprintResults)],
    ])

    const calendar = buildCalendar(events, competitions, results, {
      includeEvents: false,
      includeComps: true,
    })

    // Check calendar object directly to avoid ICS line-folding issues
    const event = calendar.events?.[0]
    expect(event?.description).toContain('Results:')
    expect(event?.description).toContain('1. ECKHOFF T. (NOR) - 19:45.3')
    expect(event?.description).toContain('2. SIMON J. (FRA) - 20:02.1')
    expect(event?.description).toContain('3. OEBERG H. (SWE) - 20:15.7')
  })

  test('shows start list when no results available', () => {
    const scheduledCompWithStartList = {
      ...mockScheduledCompetition,
      StatusId: 3,
    }
    const events = [mockEvent]
    const competitions = new Map([
      [mockEvent.EventId, [scheduledCompWithStartList]],
    ])
    const results = new Map([
      [scheduledCompWithStartList.RaceId, resultsData(mockStartList, true)],
    ])

    const calendar = buildCalendar(events, competitions, results, {
      includeEvents: false,
      includeComps: true,
    })

    // Check calendar object directly to avoid ICS line-folding issues
    const event = calendar.events?.[0]
    expect(event?.description).toContain('Start List:')
    // Should be sorted by Bib number
    expect(event?.description).toContain('1. ECKHOFF T. (NOR)')
    expect(event?.description).toContain('5. SIMON J. (FRA)')
    // Verify order: Bib 1 should come before Bib 5
    const desc = event?.description || ''
    expect(desc.indexOf('1. ECKHOFF')).toBeLessThan(desc.indexOf('5. SIMON'))
  })

  test('uses API isStartList flag to format correctly', () => {
    // The API provides an IsStartList flag that we use directly
    const mockStartListEntries: IBUResult[] = [
      {
        StartOrder: 1,
        ResultOrder: 1,
        IBUId: 'BTITA12345678901',
        IsTeam: false,
        Name: 'GIACOMEL Tommaso',
        ShortName: 'GIACOMEL T.',
        Nat: 'ITA',
        Rank: null,
        Bib: '1',
        Shootings: '',
        TotalTime: null,
        Behind: null,
      },
      {
        StartOrder: 2,
        ResultOrder: 2,
        IBUId: 'BTFRA12345678902',
        IsTeam: false,
        Name: 'PERROT Eric',
        ShortName: 'PERROT E.',
        Nat: 'FRA',
        Rank: null,
        Bib: '2',
        Shootings: '',
        TotalTime: null,
        Behind: null,
      },
    ]

    const scheduledComp = { ...mockScheduledCompetition, StatusId: 3 }
    const events = [mockEvent]
    const competitions = new Map([[mockEvent.EventId, [scheduledComp]]])
    const results = new Map([
      [scheduledComp.RaceId, resultsData(mockStartListEntries, true)],
    ])

    const calendar = buildCalendar(events, competitions, results, {
      includeEvents: false,
      includeComps: true,
    })

    const event = calendar.events?.[0]
    // Should be treated as start list based on API flag
    expect(event?.description).toContain('Start List:')
    expect(event?.description).not.toContain('Results:')
    // Should show bib numbers
    expect(event?.description).toContain('1. GIACOMEL T. (ITA)')
    expect(event?.description).toContain('2. PERROT E. (FRA)')
  })

  test('filters relay results to show only team results', () => {
    const events = [mockEvent]
    const competitions = new Map([[mockEvent.EventId, [mockRelayCompetition]]])
    const results = new Map([
      [mockRelayCompetition.RaceId, resultsData(mockRelayResults)],
    ])

    const calendar = buildCalendar(events, competitions, results, {
      includeEvents: false,
      includeComps: true,
    })

    const ics = generateIcsCalendar(calendar)

    // Team results should be shown
    expect(ics).toContain('1. NORWAY - 1:07:06.2')
    expect(ics).toContain('2. FRANCE - 1:07:45.8')

    // Individual leg results should NOT be shown
    expect(ics).not.toContain('ROEISELAND M.')
  })

  test('uses discipline emoji for scheduled competitions', () => {
    const events = [mockEvent]
    const competitions = new Map([
      [mockEvent.EventId, [mockScheduledCompetition]],
    ])

    const calendar = buildCalendar(events, competitions, new Map(), {
      includeEvents: false,
      includeComps: true,
    })

    const ics = generateIcsCalendar(calendar)

    // Mass start uses people emoji
    expect(ics).toContain('SUMMARY:👥 Women 12.5km Mass Start')
    expect(ics).not.toContain('✅ Women 12.5km Mass Start')
  })

  test('includes relay penalty info', () => {
    const events = [mockEvent]
    const competitions = new Map([[mockEvent.EventId, [mockRelayCompetition]]])

    const calendar = buildCalendar(events, competitions, new Map(), {
      includeEvents: false,
      includeComps: true,
    })

    const ics = generateIcsCalendar(calendar)

    expect(ics).toContain('Penalty: 150m loop per miss')
    expect(ics).toContain('Spare rounds: 3 per shooting')
    expect(ics).toContain('Legs: 4')
  })

  test('excludes non-World Cup events', () => {
    const ibucupEvent = { ...mockEvent, Level: 2, EventId: 'BT2526IBCUP01' }
    const events = [mockEvent, ibucupEvent]
    const competitions = new Map([
      [mockEvent.EventId, [mockSprintCompetition]],
      [
        ibucupEvent.EventId,
        [{ ...mockSprintCompetition, RaceId: 'BT2526IBCUP01SWSP' }],
      ],
    ])

    const calendar = buildCalendar(events, competitions, new Map(), {
      includeEvents: true,
      includeComps: true,
    })

    const ics = generateIcsCalendar(calendar)

    // World Cup event should be included
    expect(ics).toContain('UID:BT2526SWRLCP01')

    // IBU Cup event should NOT be included
    expect(ics).not.toContain('BT2526IBCUP01')
  })

  test('includes URL for event and competition', () => {
    const events = [mockEvent]
    const competitions = new Map([[mockEvent.EventId, [mockSprintCompetition]]])

    const calendar = buildCalendar(events, competitions, new Map(), {
      includeEvents: true,
      includeComps: true,
    })

    const ics = generateIcsCalendar(calendar)

    // Event URL
    expect(ics).toContain('URL:https://www.biathlonworld.com/calendar')

    // Competition URL
    expect(ics).toContain(
      'URL:https://www.biathlonworld.com/results/BT2526SWRLCP01SWSP',
    )
  })
})
