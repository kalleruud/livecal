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

  // Calculate the average of last 5 finishers for each matching competition
  const durations: number[] = []

  for (const comp of matchingCompetitions) {
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

  // Return the average of all the averages
  return durations.reduce((a, b) => a + b, 0) / durations.length
}

/**
 * Estimate the duration of a competition in milliseconds.
 *
 * Priority:
 * 1. If results are available for this competition, use average time of last 5 finishers
 * 2. Use historical data from other competitions with same discipline + category
 * 3. Fall back to 90 minutes
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

  // Priority 2: Use historical data from other competitions
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
  }

  // Priority 3: Fallback
  return FALLBACK_DURATION_MS
}
