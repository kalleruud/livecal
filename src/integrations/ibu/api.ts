import type {
  IBUCompetition,
  IBUEvent,
  IBUResult,
  IBUResultsResponse,
} from './types.ts'

const BASE_URL = 'https://bw.biathlonresults.com/modules/sportapi/api'

export async function fetchEvents(seasonIds: string[]): Promise<IBUEvent[]> {
  const results = await Promise.all(
    seasonIds.map(async (seasonId) => {
      const response = await fetch(`${BASE_URL}/Events?SeasonId=${seasonId}`)
      if (!response.ok) {
        console.error(`Failed to fetch events for season ${seasonId}`)
        return []
      }
      return response.json() as Promise<IBUEvent[]>
    }),
  )
  return results.flat()
}

export async function fetchCompetitions(
  events: IBUEvent[],
  gender?: string,
): Promise<Map<string, IBUCompetition[]>> {
  const map = new Map<string, IBUCompetition[]>()

  await Promise.all(
    events.map(async (event) => {
      const response = await fetch(
        `${BASE_URL}/Competitions?EventId=${event.EventId}&Language=EN`,
      )
      if (!response.ok) {
        console.error(`Failed to fetch competitions for event ${event.EventId}`)
        map.set(event.EventId, [])
        return
      }
      let competitions = (await response.json()) as IBUCompetition[]

      if (gender) {
        const catId = gender === 'M' ? 'SM' : 'SW'
        competitions = competitions.filter(
          (c) => c.catId === catId || c.catId === 'MX',
        )
      }

      map.set(event.EventId, competitions)
    }),
  )

  return map
}

export async function fetchResults(
  competitions: Map<string, IBUCompetition[]>,
): Promise<Map<string, IBUResult[]>> {
  const map = new Map<string, IBUResult[]>()
  const allCompetitions = [...competitions.values()].flat()

  const completedCompetitions = allCompetitions.filter((c) => c.StatusId >= 10)

  await Promise.all(
    completedCompetitions.map(async (competition) => {
      const response = await fetch(
        `${BASE_URL}/Results?RaceId=${competition.RaceId}&Language=en`,
      )
      if (!response.ok) {
        console.error(`Failed to fetch results for ${competition.RaceId}`)
        return
      }
      const data = (await response.json()) as IBUResultsResponse
      if (data.IsResult && data.Results) {
        map.set(competition.RaceId, data.Results)
      }
    }),
  )

  return map
}
