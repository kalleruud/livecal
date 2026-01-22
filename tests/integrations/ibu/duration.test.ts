import { describe, expect, test } from 'bun:test'
import {
  estimateDuration,
  parseTotalTime,
} from '../../../src/integrations/ibu/duration.ts'
import type {
  IBUCompetition,
  IBUResult,
} from '../../../src/integrations/ibu/types.ts'

describe('parseTotalTime', () => {
  test('parses MM:SS.s format', () => {
    expect(parseTotalTime('20:00.0')).toBe(20 * 60 * 1000)
    expect(parseTotalTime('23:45.5')).toBe((23 * 60 + 45.5) * 1000)
    expect(parseTotalTime('30:23.9')).toBe((30 * 60 + 23.9) * 1000)
  })

  test('parses H:MM:SS.s format', () => {
    expect(parseTotalTime('1:07:06.2')).toBe((1 * 3600 + 7 * 60 + 6.2) * 1000)
    expect(parseTotalTime('1:20:00.0')).toBe((1 * 3600 + 20 * 60) * 1000)
    expect(parseTotalTime('2:15:30.5')).toBe((2 * 3600 + 15 * 60 + 30.5) * 1000)
  })

  test('returns 0 for invalid format', () => {
    expect(parseTotalTime('')).toBe(0)
    expect(parseTotalTime('invalid')).toBe(0)
    expect(parseTotalTime('Lapped')).toBe(0)
  })
})

describe('estimateDuration', () => {
  const baseCompetition: IBUCompetition = {
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

  function makeResult(order: number, time: string): IBUResult {
    return {
      ResultOrder: order,
      IsTeam: false,
      Name: `Athlete ${order}`,
      ShortName: `A. ${order}`,
      Nat: 'FIN',
      Rank: String(order),
      Shootings: '0+0',
      TotalTime: time,
      Behind: '0.0',
    }
  }

  function makeTeamResult(order: number, time: string): IBUResult {
    return {
      ResultOrder: order,
      IsTeam: true,
      Name: `Team ${order}`,
      ShortName: `TEAM${order}`,
      Nat: 'FIN',
      Rank: String(order),
      Shootings: '0+0',
      TotalTime: time,
      Behind: '0.0',
    }
  }

  test('uses average of last 5 finishers when results are available', () => {
    // 10 results, last 5 have times: 28:00, 29:00, 30:00, 31:00, 32:00
    // Average = (28+29+30+31+32)/5 = 30 minutes
    const results: IBUResult[] = [
      makeResult(1, '20:00.0'),
      makeResult(2, '21:00.0'),
      makeResult(3, '22:00.0'),
      makeResult(4, '23:00.0'),
      makeResult(5, '24:00.0'),
      makeResult(6, '28:00.0'),
      makeResult(7, '29:00.0'),
      makeResult(8, '30:00.0'),
      makeResult(9, '31:00.0'),
      makeResult(10, '32:00.0'),
    ]

    const duration = estimateDuration(baseCompetition, results)
    expect(duration).toBe(30 * 60 * 1000) // 30 minutes average
  })

  test('uses all results if fewer than 5 finishers', () => {
    // Only 3 results: 20:00, 21:00, 22:00
    // Average = (20+21+22)/3 = 21 minutes
    const results: IBUResult[] = [
      makeResult(1, '20:00.0'),
      makeResult(2, '21:00.0'),
      makeResult(3, '22:00.0'),
    ]

    const duration = estimateDuration(baseCompetition, results)
    expect(duration).toBe(21 * 60 * 1000)
  })

  test('falls back to 90 minutes when no results and no historical data', () => {
    const duration = estimateDuration(baseCompetition)
    expect(duration).toBe(90 * 60 * 1000)
  })

  test('uses historical data from other competitions when no results', () => {
    // Create a historical competition with results
    const historicalCompetition: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2425SWRLCP01SWSP',
    }

    const historicalResults: IBUResult[] = [
      makeResult(1, '20:00.0'),
      makeResult(2, '21:00.0'),
      makeResult(3, '22:00.0'),
      makeResult(4, '23:00.0'),
      makeResult(5, '24:00.0'),
    ]

    const allCompetitions = [baseCompetition, historicalCompetition]
    const allResults = new Map([
      [historicalCompetition.RaceId, historicalResults],
    ])

    // Current competition has no results, should use historical average
    const duration = estimateDuration(
      baseCompetition,
      undefined,
      allCompetitions,
      allResults,
    )

    // Average of last 5 from historical: (20+21+22+23+24)/5 = 22 minutes
    expect(duration).toBe(22 * 60 * 1000)
  })

  test('averages historical data from multiple competitions', () => {
    // Two historical competitions with different averages
    const historical1: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2425SWRLCP01SWSP',
    }
    const historical2: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2425SWRLCP02SWSP',
    }

    // First competition: avg of 22 min
    const results1: IBUResult[] = [
      makeResult(1, '20:00.0'),
      makeResult(2, '21:00.0'),
      makeResult(3, '22:00.0'),
      makeResult(4, '23:00.0'),
      makeResult(5, '24:00.0'),
    ]

    // Second competition: avg of 32 min
    const results2: IBUResult[] = [
      makeResult(1, '30:00.0'),
      makeResult(2, '31:00.0'),
      makeResult(3, '32:00.0'),
      makeResult(4, '33:00.0'),
      makeResult(5, '34:00.0'),
    ]

    const allCompetitions = [baseCompetition, historical1, historical2]
    const allResults = new Map([
      [historical1.RaceId, results1],
      [historical2.RaceId, results2],
    ])

    const duration = estimateDuration(
      baseCompetition,
      undefined,
      allCompetitions,
      allResults,
    )

    // Average of both: (22 + 32) / 2 = 27 minutes
    expect(duration).toBe(27 * 60 * 1000)
  })

  test('only uses matching discipline and category for historical data', () => {
    // Different discipline - should not be used
    const differentDiscipline: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2425SWRLCP01SWPU',
      DisciplineId: 'PU',
    }

    // Different category - should not be used
    const differentCategory: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2425SWRLCP01SMSP',
      catId: 'SM',
    }

    // Same discipline and category - should be used
    const matching: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2425SWRLCP01SWSP',
    }

    const matchingResults: IBUResult[] = [
      makeResult(1, '25:00.0'),
      makeResult(2, '25:00.0'),
      makeResult(3, '25:00.0'),
    ]

    const allCompetitions = [
      baseCompetition,
      differentDiscipline,
      differentCategory,
      matching,
    ]
    const allResults = new Map([
      [differentDiscipline.RaceId, [makeResult(1, '50:00.0')]],
      [differentCategory.RaceId, [makeResult(1, '50:00.0')]],
      [matching.RaceId, matchingResults],
    ])

    const duration = estimateDuration(
      baseCompetition,
      undefined,
      allCompetitions,
      allResults,
    )

    // Should only use matching competition's average: 25 min
    expect(duration).toBe(25 * 60 * 1000)
  })

  test('handles relay events correctly - uses team results only', () => {
    const relayCompetition: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2526SWRLCP01SWRL',
      DisciplineId: 'RL',
      km: '4x6',
      Description: 'Women 4x6km Relay',
    }

    // 5 team results plus individual leg results that should be ignored
    const results: IBUResult[] = [
      makeTeamResult(1, '1:10:00.0'),
      makeTeamResult(2, '1:12:00.0'),
      makeTeamResult(3, '1:14:00.0'),
      makeTeamResult(4, '1:16:00.0'),
      makeTeamResult(5, '1:18:00.0'),
      // Individual leg results should be ignored
      { ...makeResult(6, '17:00.0'), IsTeam: false },
      { ...makeResult(7, '18:00.0'), IsTeam: false },
    ]

    const duration = estimateDuration(relayCompetition, results)
    // Average of 5 teams: (70+72+74+76+78)/5 = 74 minutes
    expect(duration).toBe(74 * 60 * 1000)
  })

  test('falls back to historical when no team results for relay', () => {
    const relayCompetition: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2526SWRLCP01SWRL',
      DisciplineId: 'RL',
      km: '4x6',
      Description: 'Women 4x6km Relay',
    }

    // Historical relay with team results
    const historicalRelay: IBUCompetition = {
      ...relayCompetition,
      RaceId: 'BT2425SWRLCP01SWRL',
    }

    const historicalResults: IBUResult[] = [
      makeTeamResult(1, '1:15:00.0'),
      makeTeamResult(2, '1:16:00.0'),
      makeTeamResult(3, '1:17:00.0'),
      makeTeamResult(4, '1:18:00.0'),
      makeTeamResult(5, '1:19:00.0'),
    ]

    // Only individual leg results for current competition, no team results
    const individualResults: IBUResult[] = [makeResult(1, '17:00.0')]

    const allCompetitions = [relayCompetition, historicalRelay]
    const allResults = new Map([[historicalRelay.RaceId, historicalResults]])

    const duration = estimateDuration(
      relayCompetition,
      individualResults,
      allCompetitions,
      allResults,
    )

    // Should use historical: (75+76+77+78+79)/5 = 77 minutes
    expect(duration).toBe(77 * 60 * 1000)
  })

  test('ignores Lapped results in average', () => {
    const results: IBUResult[] = [
      makeResult(1, '20:00.0'),
      makeResult(2, '21:00.0'),
      makeResult(3, '22:00.0'),
      makeResult(4, 'Lapped'),
      makeResult(5, 'Lapped'),
    ]

    const duration = estimateDuration(baseCompetition, results)
    // Only 3 valid results: (20+21+22)/3 = 21 minutes
    expect(duration).toBe(21 * 60 * 1000)
  })

  test('prefers current results over historical data', () => {
    const historicalCompetition: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2425SWRLCP01SWSP',
    }

    const currentResults: IBUResult[] = [
      makeResult(1, '25:00.0'),
      makeResult(2, '25:00.0'),
      makeResult(3, '25:00.0'),
    ]

    const historicalResults: IBUResult[] = [
      makeResult(1, '30:00.0'),
      makeResult(2, '30:00.0'),
      makeResult(3, '30:00.0'),
    ]

    const allCompetitions = [baseCompetition, historicalCompetition]
    const allResults = new Map([
      [baseCompetition.RaceId, currentResults],
      [historicalCompetition.RaceId, historicalResults],
    ])

    const duration = estimateDuration(
      baseCompetition,
      currentResults,
      allCompetitions,
      allResults,
    )

    // Should use current results (25 min), not historical (30 min)
    expect(duration).toBe(25 * 60 * 1000)
  })
})
