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

// Fallback duration if nothing matches (90 minutes)
const FALLBACK_DURATION_MS = 90 * 60 * 1000

/**
 * Get the average duration of the last 5 finishers from results
 */
function getLast5FinishersAverage(
  results: IBUResult[],
  isRelay: boolean,
): number | null {
  const filtered = results.filter((r) => r.IsTeam === isRelay && r.TotalTime)

  if (filtered.length === 0) {
    return null
  }

  // Sort by ResultOrder descending to get last finishers
  const sorted = [...filtered].sort((a, b) => b.ResultOrder - a.ResultOrder)

  // Take last 5 (or fewer if not enough finishers)
  const last5 = sorted.slice(0, Math.min(5, sorted.length))

  // Calculate average duration
  let totalDuration = 0
  let validCount = 0

  for (const result of last5) {
    const duration = parseTotalTime(result.TotalTime)
    if (duration > 0) {
      totalDuration += duration
      validCount++
    }
  }

  if (validCount === 0) {
    return null
  }

  return totalDuration / validCount
}

/**
 * Parse the km field to get total distance in km.
 * Handles formats like "7.5", "10", "4x6", "4x7.5", "2x6+2x7.5"
 */
function parseDistance(km: string): number {
  // Handle relay formats like "4x6", "4x7.5", "2x6+2x7.5"
  if (km.includes('x')) {
    let total = 0
    const parts = km.split('+')
    for (const part of parts) {
      const match = part.match(/(\d+)x([\d.]+)/)
      if (match) {
        total += Number.parseInt(match[1], 10) * Number.parseFloat(match[2])
      }
    }
    return total
  }

  // Simple distance like "7.5" or "10"
  return Number.parseFloat(km) || 0
}

/**
 * Calculate average duration from a list of competitions
 */
function calculateAverageDuration(
  competitions: IBUCompetition[],
  allResults: Map<string, IBUResult[]>,
  isRelay: boolean,
): number | null {
  const durations: number[] = []

  for (const comp of competitions) {
    const results = allResults.get(comp.RaceId)
    if (results) {
      const avg = getLast5FinishersAverage(results, isRelay)
      if (avg && avg > 0) {
        durations.push(avg)
      }
    }
  }

  if (durations.length === 0) {
    return null
  }

  return durations.reduce((a, b) => a + b, 0) / durations.length
}

/**
 * Calculate historical duration from all available results for the same discipline + category
 */
function getHistoricalDuration(
  disciplineId: DisciplineId,
  catId: CategoryId,
  allCompetitions: IBUCompetition[],
  allResults: Map<string, IBUResult[]>,
): number | null {
  const isRelay = disciplineId === 'RL' || disciplineId === 'SR'

  // Find all competitions with the same discipline and category that have results
  const matchingCompetitions = allCompetitions.filter(
    (c) =>
      c.DisciplineId === disciplineId &&
      c.catId === catId &&
      allResults.has(c.RaceId),
  )

  if (matchingCompetitions.length === 0) {
    return null
  }

  return calculateAverageDuration(matchingCompetitions, allResults, isRelay)
}

/**
 * Find competitions with same discipline type and similar distance
 */
function getSimilarEventDuration(
  disciplineId: DisciplineId,
  km: string,
  allCompetitions: IBUCompetition[],
  allResults: Map<string, IBUResult[]>,
): number | null {
  const isRelay = disciplineId === 'RL' || disciplineId === 'SR'
  const targetDistance = parseDistance(km)

  if (targetDistance === 0) {
    return null
  }

  // Find competitions with same discipline (any category) and similar distance
  const similarCompetitions = allCompetitions.filter((c) => {
    if (c.DisciplineId !== disciplineId || !allResults.has(c.RaceId)) {
      return false
    }
    const compDistance = parseDistance(c.km)
    // Consider similar if within 20% of target distance
    return (
      compDistance > 0 &&
      Math.abs(compDistance - targetDistance) / targetDistance <= 0.2
    )
  })

  if (similarCompetitions.length === 0) {
    return null
  }

  return calculateAverageDuration(similarCompetitions, allResults, isRelay)
}

/**
 * Estimate the duration of a competition in milliseconds.
 *
 * Priority:
 * 1. If results are available for this competition, use average time of last 5 finishers
 * 2. Use historical data from other competitions with same discipline + category
 * 3. Use data from similar events (same discipline type, similar distance)
 * 4. Fall back to 90 minutes
 */
export function estimateDuration(
  competition: IBUCompetition,
  competitionResults?: IBUResult[],
  allCompetitions?: IBUCompetition[],
  allResults?: Map<string, IBUResult[]>,
): number {
  const isRelay =
    competition.DisciplineId === 'RL' || competition.DisciplineId === 'SR'

  // Priority 1: Use average of last 5 finishers if results are available
  if (competitionResults && competitionResults.length > 0) {
    const last5Average = getLast5FinishersAverage(competitionResults, isRelay)
    if (last5Average && last5Average > 0) {
      return last5Average
    }
  }

  // Priority 2: Use historical data from other competitions with same discipline + category
  if (allCompetitions && allResults) {
    const historicalDuration = getHistoricalDuration(
      competition.DisciplineId,
      competition.catId,
      allCompetitions,
      allResults,
    )

    if (historicalDuration) {
      return historicalDuration
    }

    // Priority 3: Use similar events (same discipline, similar distance)
    const similarDuration = getSimilarEventDuration(
      competition.DisciplineId,
      competition.km,
      allCompetitions,
      allResults,
    )

    if (similarDuration) {
      return similarDuration
    }
  }

  // Priority 4: Fallback
  return FALLBACK_DURATION_MS
}
