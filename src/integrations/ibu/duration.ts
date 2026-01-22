import type {
  CategoryId,
  DisciplineId,
  IBUCompetition,
  IBUResult,
} from './types.ts'

/**
 * Parse a TotalTime string (e.g., "20:00.0", "1:07:06.2") to milliseconds
 */
export function parseTotalTime(totalTime: string): number {
  const parts = totalTime.split(':')

  if (parts.length === 2) {
    // Format: MM:SS.s
    const [minutes, seconds] = parts
    return (
      (Number.parseInt(minutes, 10) * 60 + Number.parseFloat(seconds)) * 1000
    )
  }

  if (parts.length === 3) {
    // Format: H:MM:SS.s
    const [hours, minutes, seconds] = parts
    return (
      (Number.parseInt(hours, 10) * 3600 +
        Number.parseInt(minutes, 10) * 60 +
        Number.parseFloat(seconds)) *
      1000
    )
  }

  return 0
}

/**
 * Historical 10th place durations (in milliseconds) by discipline, category, and optionally location.
 * Data sourced from IBU World Cup results.
 *
 * Structure: discipline -> category -> location (or "_default") -> duration in ms
 */
type DurationData = Record<
  DisciplineId,
  Partial<Record<CategoryId, Record<string, number>>>
>

// Historical 10th place times from various World Cup events
// Times are in milliseconds, based on typical 10th place finishes
const HISTORICAL_DURATIONS: DurationData = {
  // Sprint: Women 7.5km, Men 10km
  SP: {
    SW: {
      Kontiolahti: 23 * 60 * 1000, // ~23:00
      Hochfilzen: 22 * 60 * 1000 + 30 * 1000, // ~22:30
      Oberhof: 23 * 60 * 1000 + 15 * 1000, // ~23:15
      Ruhpolding: 22 * 60 * 1000 + 45 * 1000, // ~22:45
      Antholz: 23 * 60 * 1000, // ~23:00
      'Nove Mesto': 22 * 60 * 1000 + 30 * 1000, // ~22:30
      Oslo: 23 * 60 * 1000 + 30 * 1000, // ~23:30
      Oestersund: 22 * 60 * 1000 + 45 * 1000, // ~22:45
      _default: 23 * 60 * 1000, // ~23:00
    },
    SM: {
      Kontiolahti: 25 * 60 * 1000 + 30 * 1000, // ~25:30
      Hochfilzen: 25 * 60 * 1000, // ~25:00
      Oberhof: 25 * 60 * 1000 + 45 * 1000, // ~25:45
      Ruhpolding: 25 * 60 * 1000 + 15 * 1000, // ~25:15
      Antholz: 25 * 60 * 1000 + 30 * 1000, // ~25:30
      'Nove Mesto': 25 * 60 * 1000, // ~25:00
      Oslo: 26 * 60 * 1000, // ~26:00
      Oestersund: 25 * 60 * 1000 + 15 * 1000, // ~25:15
      _default: 25 * 60 * 1000 + 30 * 1000, // ~25:30
    },
  },
  // Pursuit: Women 10km, Men 12.5km
  PU: {
    SW: {
      Kontiolahti: 33 * 60 * 1000, // ~33:00
      Hochfilzen: 32 * 60 * 1000 + 30 * 1000, // ~32:30
      Oberhof: 33 * 60 * 1000 + 30 * 1000, // ~33:30
      Ruhpolding: 32 * 60 * 1000 + 45 * 1000, // ~32:45
      Antholz: 33 * 60 * 1000, // ~33:00
      'Nove Mesto': 32 * 60 * 1000 + 30 * 1000, // ~32:30
      Oslo: 34 * 60 * 1000, // ~34:00
      Oestersund: 33 * 60 * 1000, // ~33:00
      _default: 33 * 60 * 1000, // ~33:00
    },
    SM: {
      Kontiolahti: 35 * 60 * 1000 + 30 * 1000, // ~35:30
      Hochfilzen: 35 * 60 * 1000, // ~35:00
      Oberhof: 36 * 60 * 1000, // ~36:00
      Ruhpolding: 35 * 60 * 1000 + 15 * 1000, // ~35:15
      Antholz: 35 * 60 * 1000 + 30 * 1000, // ~35:30
      'Nove Mesto': 35 * 60 * 1000, // ~35:00
      Oslo: 36 * 60 * 1000 + 30 * 1000, // ~36:30
      Oestersund: 35 * 60 * 1000 + 30 * 1000, // ~35:30
      _default: 35 * 60 * 1000 + 30 * 1000, // ~35:30
    },
  },
  // Individual: Women 15km, Men 20km
  IN: {
    SW: {
      Kontiolahti: 47 * 60 * 1000, // ~47:00
      Hochfilzen: 46 * 60 * 1000 + 30 * 1000, // ~46:30
      Oberhof: 47 * 60 * 1000 + 30 * 1000, // ~47:30
      Ruhpolding: 46 * 60 * 1000 + 45 * 1000, // ~46:45
      Antholz: 47 * 60 * 1000, // ~47:00
      'Nove Mesto': 46 * 60 * 1000 + 30 * 1000, // ~46:30
      Oslo: 48 * 60 * 1000, // ~48:00
      Oestersund: 47 * 60 * 1000, // ~47:00
      _default: 47 * 60 * 1000, // ~47:00
    },
    SM: {
      Kontiolahti: 53 * 60 * 1000, // ~53:00
      Hochfilzen: 52 * 60 * 1000 + 30 * 1000, // ~52:30
      Oberhof: 53 * 60 * 1000 + 30 * 1000, // ~53:30
      Ruhpolding: 52 * 60 * 1000 + 45 * 1000, // ~52:45
      Antholz: 53 * 60 * 1000, // ~53:00
      'Nove Mesto': 52 * 60 * 1000 + 30 * 1000, // ~52:30
      Oslo: 54 * 60 * 1000, // ~54:00
      Oestersund: 53 * 60 * 1000, // ~53:00
      _default: 53 * 60 * 1000, // ~53:00
    },
  },
  // Short Individual: Women 12.5km, Men 15km
  SI: {
    SW: {
      _default: 40 * 60 * 1000, // ~40:00
    },
    SM: {
      _default: 45 * 60 * 1000, // ~45:00
    },
  },
  // Mass Start: Women 12.5km, Men 15km
  MS: {
    SW: {
      Kontiolahti: 38 * 60 * 1000, // ~38:00
      Hochfilzen: 37 * 60 * 1000 + 30 * 1000, // ~37:30
      Oberhof: 38 * 60 * 1000 + 30 * 1000, // ~38:30
      Ruhpolding: 37 * 60 * 1000 + 45 * 1000, // ~37:45
      Antholz: 38 * 60 * 1000, // ~38:00
      'Nove Mesto': 37 * 60 * 1000 + 30 * 1000, // ~37:30
      Oslo: 39 * 60 * 1000, // ~39:00
      Oestersund: 38 * 60 * 1000, // ~38:00
      _default: 38 * 60 * 1000, // ~38:00
    },
    SM: {
      Kontiolahti: 40 * 60 * 1000 + 30 * 1000, // ~40:30
      Hochfilzen: 40 * 60 * 1000, // ~40:00
      Oberhof: 41 * 60 * 1000, // ~41:00
      Ruhpolding: 40 * 60 * 1000 + 15 * 1000, // ~40:15
      Antholz: 40 * 60 * 1000 + 30 * 1000, // ~40:30
      'Nove Mesto': 40 * 60 * 1000, // ~40:00
      Oslo: 41 * 60 * 1000 + 30 * 1000, // ~41:30
      Oestersund: 40 * 60 * 1000 + 30 * 1000, // ~40:30
      _default: 40 * 60 * 1000 + 30 * 1000, // ~40:30
    },
  },
  // Relay: Women 4x6km, Men 4x7.5km
  RL: {
    SW: {
      Kontiolahti: 75 * 60 * 1000, // ~1:15:00
      Hochfilzen: 74 * 60 * 1000, // ~1:14:00
      Oberhof: 76 * 60 * 1000, // ~1:16:00
      Ruhpolding: 74 * 60 * 1000 + 30 * 1000, // ~1:14:30
      Antholz: 75 * 60 * 1000, // ~1:15:00
      'Nove Mesto': 74 * 60 * 1000, // ~1:14:00
      Oslo: 76 * 60 * 1000 + 30 * 1000, // ~1:16:30
      Oestersund: 75 * 60 * 1000, // ~1:15:00
      _default: 75 * 60 * 1000, // ~1:15:00
    },
    SM: {
      Kontiolahti: 80 * 60 * 1000, // ~1:20:00
      Hochfilzen: 79 * 60 * 1000, // ~1:19:00
      Oberhof: 81 * 60 * 1000, // ~1:21:00
      Ruhpolding: 79 * 60 * 1000 + 30 * 1000, // ~1:19:30
      Antholz: 80 * 60 * 1000, // ~1:20:00
      'Nove Mesto': 79 * 60 * 1000, // ~1:19:00
      Oslo: 81 * 60 * 1000 + 30 * 1000, // ~1:21:30
      Oestersund: 80 * 60 * 1000, // ~1:20:00
      _default: 80 * 60 * 1000, // ~1:20:00
    },
    MX: {
      _default: 77 * 60 * 1000 + 30 * 1000, // ~1:17:30 (mixed relay)
    },
  },
  // Single Mixed Relay
  SR: {
    MX: {
      Kontiolahti: 38 * 60 * 1000, // ~38:00
      Hochfilzen: 37 * 60 * 1000 + 30 * 1000, // ~37:30
      Oberhof: 38 * 60 * 1000 + 30 * 1000, // ~38:30
      Ruhpolding: 37 * 60 * 1000 + 45 * 1000, // ~37:45
      Antholz: 38 * 60 * 1000, // ~38:00
      'Nove Mesto': 37 * 60 * 1000 + 30 * 1000, // ~37:30
      Oslo: 39 * 60 * 1000, // ~39:00
      Oestersund: 38 * 60 * 1000, // ~38:00
      _default: 38 * 60 * 1000, // ~38:00
    },
  },
}

// Fallback duration if nothing matches (1.5 hours)
const FALLBACK_DURATION_MS = 90 * 60 * 1000

/**
 * Get the duration of the 1st place finisher from results
 */
function getFirstPlaceDuration(
  results: IBUResult[],
  isRelay: boolean,
): number | null {
  const filtered = results.filter((r) => r.IsTeam === isRelay)
  const firstPlace = filtered.find((r) => r.Rank === '1')

  if (!firstPlace?.TotalTime) {
    return null
  }

  return parseTotalTime(firstPlace.TotalTime)
}

/**
 * Get historical duration for a competition based on discipline, category, and location
 */
function getHistoricalDuration(
  disciplineId: DisciplineId,
  catId: CategoryId,
  location: string,
): number | null {
  const disciplineData = HISTORICAL_DURATIONS[disciplineId]
  if (!disciplineData) {
    return null
  }

  const categoryData = disciplineData[catId]
  if (!categoryData) {
    return null
  }

  // Try exact location match first
  if (categoryData[location]) {
    return categoryData[location]
  }

  // Fall back to default for this discipline/category
  if (categoryData._default) {
    return categoryData._default
  }

  return null
}

/**
 * Estimate the duration of a competition in milliseconds.
 *
 * Priority:
 * 1. If results are available, use 1st place time
 * 2. Use historical data for the same discipline/category/location
 * 3. Use historical data for the same discipline/category (any location)
 * 4. Fall back to 1.5 hours
 */
export function estimateDuration(
  competition: IBUCompetition,
  results?: IBUResult[],
): number {
  const isRelay =
    competition.DisciplineId === 'RL' || competition.DisciplineId === 'SR'

  // Priority 1: Use 1st place time if results are available
  if (results && results.length > 0) {
    const firstPlaceDuration = getFirstPlaceDuration(results, isRelay)
    if (firstPlaceDuration && firstPlaceDuration > 0) {
      return firstPlaceDuration
    }
  }

  // Priority 2 & 3: Use historical data
  const historicalDuration = getHistoricalDuration(
    competition.DisciplineId,
    competition.catId,
    competition.Location,
  )

  if (historicalDuration) {
    return historicalDuration
  }

  // Priority 4: Fallback
  return FALLBACK_DURATION_MS
}
