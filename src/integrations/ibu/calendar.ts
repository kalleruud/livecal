import type { IcsCalendar, IcsEvent } from 'ts-ics'
import { estimateDuration } from './duration.ts'
import type {
  DisciplineId,
  IBUCompetition,
  IBUEvent,
  IBUQueryParams,
  IBUResult,
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

function isRelayDiscipline(disciplineId: DisciplineId): boolean {
  return disciplineId === 'RL' || disciplineId === 'SR'
}

function formatResults(
  results: IBUResult[],
  disciplineId: DisciplineId,
): string {
  const isRelay = isRelayDiscipline(disciplineId)
  const filtered = results.filter((r) => r.IsTeam === isRelay)
  const top10 = filtered.slice(0, 10)
  return top10
    .map((r) => {
      const name = isRelay ? r.ShortName : `${r.ShortName} (${r.Nat})`
      return `${r.Rank}. ${name} - ${r.TotalTime}`
    })
    .join('\n')
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
    start: { date: new Date(event.StartDate) },
    end: { date: new Date(event.EndDate) },
    summary: `🏆 ${event.Description} - ${event.ShortDescription}`,
    location: `${event.Organizer}, ${event.NatLong}`,
    url: buildEventUrl(event),
  }
}

function competitionToIcsEvent(
  competition: IBUCompetition,
  event: IBUEvent,
  competitionResults: IBUResult[] | undefined,
  allCompetitions: IBUCompetition[],
  allResults: Map<string, IBUResult[]>,
): IcsEvent {
  const isCompleted = competition.StatusId >= 10
  const emoji = isCompleted
    ? '✅'
    : DISCIPLINE_EMOJI[competition.DisciplineId] || '📅'

  let description = competition.Description
  if (competitionResults && competitionResults.length > 0) {
    const formattedResults = formatResults(
      competitionResults,
      competition.DisciplineId,
    )
    if (formattedResults) {
      description += `\n\nTop 10 Results:\n${formattedResults}`
    }
  }

  const startTime = new Date(competition.StartTime)
  const duration = estimateDuration(
    competition,
    competitionResults,
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
  results: Map<string, IBUResult[]>,
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
        const competitionResults = results.get(competition.RaceId)
        icsEvents.push(
          competitionToIcsEvent(
            competition,
            event,
            competitionResults,
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
