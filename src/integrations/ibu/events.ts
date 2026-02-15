import type { IcsEvent } from 'ts-ics'
import { estimateDuration } from './duration.ts'
import type {
  DisciplineId,
  IBUCompetition,
  IBUEvent,
  IBUResult,
  IBUResultsData,
  StartMode,
} from './types.ts'

const DISCIPLINE_EMOJI: Record<DisciplineId, string> = {
  SP: '🎿',
  PU: '🏃',
  IN: '🎯',
  SI: '🎯',
  MS: '👥',
  RL: '🔄',
  SR: '🔄',
}

const DISCIPLINE_NAME: Record<DisciplineId, string> = {
  SP: 'Sprint',
  PU: 'Pursuit',
  IN: 'Individual',
  SI: 'Short Individual',
  MS: 'Mass Start',
  RL: 'Relay',
  SR: 'Single Mixed Relay',
}

const START_MODE_NAME: Record<StartMode, string> = {
  M: 'Mass Start',
  I: 'Interval Start',
  P: 'Pursuit Start',
  H: 'Handicap Start',
}

function isRelayDiscipline(disciplineId: DisciplineId): boolean {
  return disciplineId === 'RL' || disciplineId === 'SR'
}

function formatShootingPositions(positions?: string): string {
  if (!positions) return ''
  return positions
    .split('')
    .map(p => (p === 'P' ? 'Prone' : 'Standing'))
    .join(' → ')
}

function formatCompetitionDetails(competition: IBUCompetition): string {
  const lines: string[] = []

  if (competition.km) {
    lines.push(`Distance: ${competition.km} km`)
  }

  const disciplineName = DISCIPLINE_NAME[competition.DisciplineId]
  if (disciplineName) {
    lines.push(`Type: ${disciplineName}`)
  }

  if (competition.StartMode) {
    const startModeName = START_MODE_NAME[competition.StartMode]
    if (startModeName) {
      lines.push(`Start: ${startModeName}`)
    }
  }

  if (competition.NrShootings) {
    let shootingInfo = `Shootings: ${competition.NrShootings}`
    const positions = formatShootingPositions(competition.ShootingPositions)
    if (positions) {
      shootingInfo += ` (${positions})`
    }
    lines.push(shootingInfo)
  }

  if (competition.PenaltySeconds && competition.PenaltySeconds > 0) {
    lines.push(`Penalty: ${competition.PenaltySeconds}s per miss`)
  } else if (isRelayDiscipline(competition.DisciplineId)) {
    lines.push('Penalty: 150m loop per miss')
  }

  if (competition.HasSpareRounds && competition.NrSpareRounds) {
    lines.push(`Spare rounds: ${competition.NrSpareRounds} per shooting`)
  }

  if (competition.NrLegs && competition.NrLegs > 1) {
    lines.push(`Legs: ${competition.NrLegs}`)
  }

  return lines.join('\n')
}

function formatStartListOrResults(
  results: IBUResult[],
  disciplineId: DisciplineId,
  isStartList: boolean
): { title: string; content: string } | null {
  const isRelay = isRelayDiscipline(disciplineId)
  const filtered = results.filter(r => r.IsTeam === isRelay)

  if (filtered.length === 0) {
    return null
  }

  if (isStartList) {
    const withBib = filtered.filter(
      r =>
        r.Bib && r.Bib !== 'null' && !Number.isNaN(Number.parseInt(r.Bib, 10))
    )

    if (withBib.length === 0) {
      return null
    }

    const sorted = [...withBib].sort(
      (a, b) => Number.parseInt(a.Bib, 10) - Number.parseInt(b.Bib, 10)
    )

    const content = sorted
      .map(r => {
        if (isRelay) {
          const athletes = results
            .filter(athlete => !athlete.IsTeam && athlete.Bib === r.Bib)
            .sort((a, b) => (a.Leg || 0) - (b.Leg || 0))
            .map(athlete => athlete.ShortName)

          if (athletes.length > 0) {
            return `${r.Bib}. ${r.ShortName}\n   ${athletes.join(', ')}`
          }
          return `${r.Bib}. ${r.ShortName}`
        }
        return `${r.Bib}. ${r.ShortName} (${r.Nat})`
      })
      .join('\n')
    return { title: 'Start List', content }
  }

  const sorted = [...filtered].sort((a, b) => {
    if (a.ResultOrder !== b.ResultOrder) {
      return a.ResultOrder - b.ResultOrder
    }
    return a.StartOrder - b.StartOrder
  })

  const content = sorted
    .map(r => {
      const time = r.TotalTime || 'DNF'
      const rankPrefix = r.Rank && r.Rank !== 'null' ? `${r.Rank}. ` : ''

      if (isRelay) {
        const athletes = results
          .filter(athlete => !athlete.IsTeam && athlete.Bib === r.Bib)
          .sort((a, b) => (a.Leg || 0) - (b.Leg || 0))
          .map(athlete => athlete.ShortName)

        if (athletes.length > 0) {
          return `${rankPrefix}${r.ShortName} - ${time}\n   ${athletes.join(', ')}`
        }
        return `${rankPrefix}${r.ShortName} - ${time}`
      }

      return `${rankPrefix}${r.ShortName} (${r.Nat}) - ${time}`
    })
    .join('\n')
  return { title: 'Results', content }
}

function buildEventUrl(event: IBUEvent): string {
  return `https://www.biathlonworld.com/calendar?CupLevel=${event.Level}&SeasonId=${event.SeasonId}&EventId=${event.EventId}`
}

function buildCompetitionUrl(competition: IBUCompetition): string {
  return `https://www.biathlonworld.com/results/${competition.RaceId}`
}

function buildStartListUrl(competition: IBUCompetition): string {
  return `https://www.biathlonworld.com/startlist/${competition.RaceId}`
}

/**
 * Transform an IBU event (multi-day) into an ICS event.
 */
export function eventToIcsEvent(event: IBUEvent): IcsEvent {
  return {
    uid: event.EventId,
    stamp: { date: new Date() },
    start: { date: new Date(event.StartDate), type: 'DATE' },
    end: { date: new Date(event.EndDate), type: 'DATE' },
    summary: `🏆 ${event.Description} - ${event.ShortDescription}`,
    location: `${event.Organizer}, ${event.NatLong}`,
    url: buildEventUrl(event),
  }
}

/**
 * Transform an IBU competition (single race) into an ICS event.
 */
export function competitionToIcsEvent(
  competition: IBUCompetition,
  event: IBUEvent,
  resultsData: IBUResultsData | undefined,
  allCompetitions: IBUCompetition[],
  allResults: Map<string, IBUResultsData>
): IcsEvent {
  const isCompleted = competition.StatusId >= 10
  const emoji = isCompleted
    ? '✅'
    : DISCIPLINE_EMOJI[competition.DisciplineId] || '📅'

  const descriptionParts: string[] = []

  const details = formatCompetitionDetails(competition)
  if (details) {
    descriptionParts.push(details)
  }

  if (resultsData && resultsData.results.length > 0) {
    const formatted = formatStartListOrResults(
      resultsData.results,
      competition.DisciplineId,
      resultsData.isStartList
    )
    if (formatted) {
      descriptionParts.push(`${formatted.title}:\n${formatted.content}`)
    }
  }

  const description = descriptionParts.join('\n\n')

  const startTime = new Date(competition.StartTime)
  const duration = estimateDuration(
    competition,
    resultsData?.results,
    allCompetitions,
    allResults
  )
  const endTime = new Date(startTime.getTime() + duration)

  const url = isCompleted
    ? buildCompetitionUrl(competition)
    : buildStartListUrl(competition)

  return {
    uid: competition.RaceId,
    stamp: { date: new Date() },
    start: { date: startTime },
    end: { date: endTime },
    summary: `${emoji} ${competition.ShortDescription}`,
    description,
    location: `${competition.Location}, ${event.ShortDescription}`,
    url,
  }
}
