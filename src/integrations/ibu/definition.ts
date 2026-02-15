import type { IcsEvent } from 'ts-ics'
import { createIntegration } from '../framework/index.ts'
import { fetchCompetitions, fetchEvents, fetchResults } from './api.ts'
import { competitionToIcsEvent, eventToIcsEvent } from './events.ts'
import type { IBUCompetition, IBUEvent, IBUResultsData } from './types.ts'

/** Data returned by fetchData */
interface IBUData {
  events: IBUEvent[]
  competitions: Map<string, IBUCompetition[]>
  results: Map<string, IBUResultsData>
}

/** Parsed parameters */
interface IBUParams {
  season?: string
  gender?: string
  includeEvents: boolean
  includeComps: boolean
}

/** Calculate available seasons (current and previous) */
function getAvailableSeasons(): string[] {
  const now = new Date()
  const year = now.getFullYear() % 100
  const month = now.getMonth()
  const currentSeason = month >= 9 ? `${year}${year + 1}` : `${year - 1}${year}`
  const prevSeason =
    month >= 9 ? `${year - 1}${year}` : `${year - 2}${year - 1}`
  return [prevSeason, currentSeason]
}

export default createIntegration<IBUData, IBUParams>(
  {
    id: 'ibu',
    name: 'IBU Biathlon World Cup',

    calendar: {
      prodId: '-//Livecal//IBU Biathlon World Cup//EN',
      name: 'IBU Biathlon World Cup',
    },

    endpoint: 'wc.ics',

    params: {
      season: {
        type: 'text',
        label: 'Season',
        placeholder: 'e.g. 2526',
        description: 'Biathlon season (YXYY format)',
      },
      gender: {
        type: 'select',
        label: 'Gender',
        options: [
          { value: '', label: 'All' },
          { value: 'M', label: 'Men' },
          { value: 'W', label: 'Women' },
        ],
        validate: value => {
          if (value && !['', 'M', 'W'].includes(value)) {
            return "Gender must be 'M' or 'W'"
          }
          return null
        },
      },
      includeEvents: {
        type: 'checkbox',
        label: 'Include Events',
        default: false,
      },
      includeComps: {
        type: 'checkbox',
        label: 'Include Competitions',
        default: true,
      },
    },

    fetchData: async params => {
      const seasons = params.season ? [params.season] : getAvailableSeasons()
      const events = await fetchEvents(seasons)
      const competitions = await fetchCompetitions(events, params.gender)
      const results = await fetchResults(competitions)
      return { events, competitions, results }
    },

    toEvents: (data, params) => {
      const icsEvents: IcsEvent[] = []
      const wcEvents = data.events.filter(e => e.Level === 1)
      const allCompetitions = [...data.competitions.values()].flat()

      for (const event of wcEvents) {
        if (params.includeEvents) {
          icsEvents.push(eventToIcsEvent(event))
        }

        if (params.includeComps) {
          const eventCompetitions = data.competitions.get(event.EventId) || []
          for (const competition of eventCompetitions) {
            const resultsData = data.results.get(competition.RaceId)
            icsEvents.push(
              competitionToIcsEvent(
                competition,
                event,
                resultsData,
                allCompetitions,
                data.results
              )
            )
          }
        }
      }

      return icsEvents
    },
  },
  {
    // Custom validation
    validate: params => {
      if (!params.includeEvents && !params.includeComps) {
        return 'At least one of includeEvents or includeComps must be true'
      }
      return null
    },
  }
)
