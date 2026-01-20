import type { IcsCalendar, IcsEvent } from 'ts-ics'
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

const GENDER_EMOJI: Record<string, string> = {
  SM: '♂️',
  SW: '♀️',
  MX: '👫',
}

function formatResults(results: IBUResult[]): string {
  const top10 = results.slice(0, 10)
  return top10
    .map((r) => `${r.Rank}. ${r.Name} (${r.Nat}) - ${r.TotalTime}`)
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
  results?: IBUResult[],
): IcsEvent {
  const isCompleted = competition.StatusId >= 10
  const disciplineEmoji = DISCIPLINE_EMOJI[competition.DisciplineId] || ''
  const genderEmoji = GENDER_EMOJI[competition.catId] || ''
  const completedEmoji = isCompleted ? '✅ ' : ''

  let description = `${competition.Description}\n\nLocation: ${competition.Location}`
  if (results && results.length > 0) {
    description += `\n\nTop 10 Results:\n${formatResults(results)}`
  }

  const startTime = new Date(competition.StartTime)
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000)

  return {
    uid: competition.RaceId,
    stamp: { date: new Date() },
    start: { date: startTime },
    end: { date: endTime },
    summary: `${completedEmoji}${disciplineEmoji}${genderEmoji} ${competition.ShortDescription}`,
    description,
    location: `${event.ShortDescription}, ${event.Organizer}`,
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

  for (const event of wcEvents) {
    if (params.includeEvents) {
      icsEvents.push(eventToIcsEvent(event))
    }

    if (params.includeComps) {
      const eventCompetitions = competitions.get(event.EventId) || []
      for (const competition of eventCompetitions) {
        const competitionResults = results.get(competition.RaceId)
        icsEvents.push(
          competitionToIcsEvent(competition, event, competitionResults),
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
