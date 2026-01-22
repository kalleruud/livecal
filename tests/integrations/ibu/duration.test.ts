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

  test('uses 1st place time when results are available', () => {
    const results: IBUResult[] = [
      {
        ResultOrder: 1,
        IsTeam: false,
        Name: 'Test Athlete',
        ShortName: 'T. Athlete',
        Nat: 'FIN',
        Rank: '1',
        Shootings: '0+0',
        TotalTime: '20:00.0',
        Behind: '0.0',
      },
      {
        ResultOrder: 2,
        IsTeam: false,
        Name: 'Second Athlete',
        ShortName: 'S. Athlete',
        Nat: 'NOR',
        Rank: '2',
        Shootings: '0+1',
        TotalTime: '20:30.0',
        Behind: '30.0',
      },
    ]

    const duration = estimateDuration(baseCompetition, results)
    expect(duration).toBe(20 * 60 * 1000) // 20 minutes
  })

  test('uses historical data when no results available', () => {
    const duration = estimateDuration(baseCompetition)
    // Kontiolahti Women Sprint historical: 23 minutes
    expect(duration).toBe(23 * 60 * 1000)
  })

  test('uses historical data for known location', () => {
    const competition: IBUCompetition = {
      ...baseCompetition,
      Location: 'Hochfilzen',
    }

    const duration = estimateDuration(competition)
    // Hochfilzen Women Sprint historical: 22:30
    expect(duration).toBe(22 * 60 * 1000 + 30 * 1000)
  })

  test('uses default for unknown location', () => {
    const competition: IBUCompetition = {
      ...baseCompetition,
      Location: 'New Location',
    }

    const duration = estimateDuration(competition)
    // Default Women Sprint historical: 23 minutes
    expect(duration).toBe(23 * 60 * 1000)
  })

  test('handles relay events correctly', () => {
    const relayCompetition: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2526SWRLCP01SWRL',
      DisciplineId: 'RL',
      km: '4x6',
      Description: 'Women 4x6km Relay',
    }

    const teamResults: IBUResult[] = [
      {
        ResultOrder: 1,
        IsTeam: true,
        Name: 'NORWAY',
        ShortName: 'NORWAY',
        Nat: 'NOR',
        Rank: '1',
        Shootings: '0+2',
        TotalTime: '1:10:00.0',
        Behind: '0.0',
      },
      {
        ResultOrder: 2,
        IsTeam: false,
        Name: 'Individual Leg',
        ShortName: 'I. Leg',
        Nat: 'NOR',
        Rank: '1',
        Shootings: '0+0',
        TotalTime: '17:00.0',
        Behind: '0.0',
      },
    ]

    const duration = estimateDuration(relayCompetition, teamResults)
    // Should use team result (1:10:00), not individual leg time
    expect(duration).toBe((1 * 3600 + 10 * 60) * 1000)
  })

  test('falls back to historical data when no team results for relay', () => {
    const relayCompetition: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2526SWRLCP01SWRL',
      DisciplineId: 'RL',
      km: '4x6',
      Description: 'Women 4x6km Relay',
    }

    // Only individual leg results, no team result
    const individualResults: IBUResult[] = [
      {
        ResultOrder: 1,
        IsTeam: false,
        Name: 'Individual Leg',
        ShortName: 'I. Leg',
        Nat: 'NOR',
        Rank: '1',
        Shootings: '0+0',
        TotalTime: '17:00.0',
        Behind: '0.0',
      },
    ]

    const duration = estimateDuration(relayCompetition, individualResults)
    // Should fall back to historical data (Kontiolahti Women Relay: 75 min)
    expect(duration).toBe(75 * 60 * 1000)
  })

  test('handles men sprint', () => {
    const menSprint: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2526SWRLCP01SMSP',
      catId: 'SM',
      km: '10',
      Description: 'Men 10km Sprint',
    }

    const duration = estimateDuration(menSprint)
    // Kontiolahti Men Sprint historical: 25:30
    expect(duration).toBe(25 * 60 * 1000 + 30 * 1000)
  })

  test('handles pursuit', () => {
    const pursuit: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2526SWRLCP01SWPU',
      DisciplineId: 'PU',
      km: '10',
      Description: 'Women 10km Pursuit',
    }

    const duration = estimateDuration(pursuit)
    // Kontiolahti Women Pursuit historical: 33 minutes
    expect(duration).toBe(33 * 60 * 1000)
  })

  test('handles individual', () => {
    const individual: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2526SWRLCP01SWIN',
      DisciplineId: 'IN',
      km: '15',
      Description: 'Women 15km Individual',
    }

    const duration = estimateDuration(individual)
    // Kontiolahti Women Individual historical: 47 minutes
    expect(duration).toBe(47 * 60 * 1000)
  })

  test('handles mass start', () => {
    const massStart: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2526SWRLCP01SWMS',
      DisciplineId: 'MS',
      km: '12.5',
      Description: 'Women 12.5km Mass Start',
    }

    const duration = estimateDuration(massStart)
    // Kontiolahti Women Mass Start historical: 38 minutes
    expect(duration).toBe(38 * 60 * 1000)
  })

  test('handles single mixed relay', () => {
    const singleMixedRelay: IBUCompetition = {
      ...baseCompetition,
      RaceId: 'BT2526SWRLCP01MXSR',
      DisciplineId: 'SR',
      catId: 'MX',
      km: '2x6+2x7.5',
      Description: 'Single Mixed Relay',
    }

    const duration = estimateDuration(singleMixedRelay)
    // Kontiolahti Single Mixed Relay historical: 38 minutes
    expect(duration).toBe(38 * 60 * 1000)
  })

  test('falls back to 90 minutes for unknown discipline/category combo', () => {
    const unknownCompetition: IBUCompetition = {
      ...baseCompetition,
      DisciplineId: 'SI', // Short Individual - only has _default, not SM category
      catId: 'SM',
    }

    const duration = estimateDuration(unknownCompetition)
    // Should use SM default: 45 minutes
    expect(duration).toBe(45 * 60 * 1000)
  })
})
