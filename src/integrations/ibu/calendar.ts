import type { IcsCalendar, IcsEvent } from 'ts-ics'
import { estimateDuration } from './duration.ts'
import type {
  DisciplineId,
  IBUCompetition,
  IBUEvent,
  IBUQueryParams,
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
    .map((p) => (p === 'P' ? 'Prone' : 'Standing'))
    .join(' → ')
}

function formatCompetitionDetails(competition: IBUCompetition): string {
  const lines: string[] = []

  // Distance (skip if empty)
  if (competition.km) {
    lines.push(`Distance: ${competition.km} km`)
  }

  // Discipline type
  const disciplineName = DISCIPLINE_NAME[competition.DisciplineId]
  if (disciplineName) {
    lines.push(`Type: ${disciplineName}`)
  }

  // Start mode
  if (competition.StartMode) {
    const startModeName = START_MODE_NAME[competition.StartMode]
    if (startModeName) {
      lines.push(`Start: ${startModeName}`)
    }
  }

  // Shooting details
  if (competition.NrShootings) {
    let shootingInfo = `Shootings: ${competition.NrShootings}`
    const positions = formatShootingPositions(competition.ShootingPositions)
    if (positions) {
      shootingInfo += ` (${positions})`
    }
    lines.push(shootingInfo)
  }

  // Penalty info
  if (competition.PenaltySeconds && competition.PenaltySeconds > 0) {
    lines.push(`Penalty: ${competition.PenaltySeconds}s per miss`)
  } else if (isRelayDiscipline(competition.DisciplineId)) {
    lines.push('Penalty: 150m loop per miss')
  }

  // Spare rounds for relays
  if (competition.HasSpareRounds && competition.NrSpareRounds) {
    lines.push(`Spare rounds: ${competition.NrSpareRounds} per shooting`)
  }

  // Relay legs
  if (competition.NrLegs && competition.NrLegs > 1) {
    lines.push(`Legs: ${competition.NrLegs}`)
  }

  return lines.join('\n')
}

function formatStartListOrResults(
  results: IBUResult[],
  disciplineId: DisciplineId,
  isStartList: boolean,
): { title: string; content: string } | null {
  const isRelay = isRelayDiscipline(disciplineId)
  const filtered = results.filter((r) => r.IsTeam === isRelay)

  if (filtered.length === 0) {
    return null
  }

  if (isStartList) {
    // Filter out athletes without valid bib numbers (reserves/withdrawn)
    const withBib = filtered.filter(
      (r) =>
        r.Bib && r.Bib !== 'null' && !Number.isNaN(Number.parseInt(r.Bib, 10)),
    )

    if (withBib.length === 0) {
      return null
    }

    // Format as start list - sort by Bib number
    const sorted = [...withBib].sort(
      (a, b) => Number.parseInt(a.Bib, 10) - Number.parseInt(b.Bib, 10),
    )

    const content = sorted
      .map((r) => {
        const name = isRelay ? r.ShortName : `${r.ShortName} (${r.Nat})`
        return `${r.Bib}. ${name}`
      })
      .join('\n')
    return { title: 'Start List', content }
  }

  // Format as results - sort by ResultOrder, then StartOrder
  const sorted = [...filtered].sort((a, b) => {
    if (a.ResultOrder !== b.ResultOrder) {
      return a.ResultOrder - b.ResultOrder
    }
    return a.StartOrder - b.StartOrder
  })

  const content = sorted
    .map((r) => {
      const name = isRelay ? r.ShortName : `${r.ShortName} (${r.Nat})`
      const time = r.TotalTime || 'DNF'
      // Skip rank number for DNF (no valid rank)
      if (!r.Rank || r.Rank === 'null') {
        return `${name} - ${time}`
      }
      return `${r.Rank}. ${name} - ${time}`
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

function eventToIcsEvent(event: IBUEvent): IcsEvent {
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

function competitionToIcsEvent(
  competition: IBUCompetition,
  event: IBUEvent,
  resultsData: IBUResultsData | undefined,
  allCompetitions: IBUCompetition[],
  allResults: Map<string, IBUResultsData>,
): IcsEvent {
  const isCompleted = competition.StatusId >= 10
  const emoji = isCompleted
    ? '✅'
    : DISCIPLINE_EMOJI[competition.DisciplineId] || '📅'

  // Build description with competition details
  const descriptionParts: string[] = []

  // Add race format details
  const details = formatCompetitionDetails(competition)
  if (details) {
    descriptionParts.push(details)
  }

  // Add start list or results if available
  if (resultsData && resultsData.results.length > 0) {
    const formatted = formatStartListOrResults(
      resultsData.results,
      competition.DisciplineId,
      resultsData.isStartList,
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
    allResults,
  )
  const endTime = new Date(startTime.getTime() + duration)

  return {
    uid: competition.RaceId,
    stamp: { date: new Date() },
    start: { date: startTime },
    end: { date: endTime },
    summary: `${emoji} ${competition.ShortDescription}`,
    description,
    location: `${competition.Location}, ${event.ShortDescription}`,
    url: buildCompetitionUrl(competition),
  }
}

export function buildCalendar(
  events: IBUEvent[],
  competitions: Map<string, IBUCompetition[]>,
  results: Map<string, IBUResultsData>,
  params: IBUQueryParams,
): IcsCalendar {
  const icsEvents: IcsEvent[] = []

  const wcEvents = events.filter((e) => e.Level === 1)

  // Flatten all competitions for historical duration lookup
  const allCompetitions = [...competitions.values()].flat()

  for (const event of wcEvents) {
    if (params.includeEvents) {
      icsEvents.push(eventToIcsEvent(event))
    }

    if (params.includeComps) {
      const eventCompetitions = competitions.get(event.EventId) || []
      for (const competition of eventCompetitions) {
        const resultsData = results.get(competition.RaceId)
        icsEvents.push(
          competitionToIcsEvent(
            competition,
            event,
            resultsData,
            allCompetitions,
            results,
          ),
        )
      }
    }
  }

  return {
    version: '2.0',
    prodId: '-//Livecal//IBU Biathlon World Cup//EN',
    name: 'IBU Biathlon World Cup',
    events: icsEvents,
  }
}
