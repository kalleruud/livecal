import request from '../../server/cache.ts'
import {
  type IBUCompetition,
  IBUCompetitionStatus,
  type IBUEvent,
  type IBUResultsData,
  type IBUResultsResponse,
} from './types.ts'

const INTEGRATION_ID = 'ibu'
const BASE_URL = 'https://bw.biathlonresults.com/modules/sportapi/api'

export async function fetchEvents(seasonIds: string[]): Promise<IBUEvent[]> {
  const results = await Promise.all(
    seasonIds.map(async seasonId => {
      try {
        return await request<IBUEvent[]>(
          `${BASE_URL}/Events?SeasonId=${seasonId}`,
          INTEGRATION_ID
        )
      } catch {
        return []
      }
    })
  )
  return results.flat()
}

export async function fetchCompetitions(
  events: IBUEvent[],
  gender?: string
): Promise<Map<string, IBUCompetition[]>> {
  const map = new Map<string, IBUCompetition[]>()

  await Promise.all(
    events.map(async event => {
      try {
        let competitions = await request<IBUCompetition[]>(
          `${BASE_URL}/Competitions?EventId=${event.EventId}&Language=EN`,
          INTEGRATION_ID
        )
        if (gender) {
          const catId = gender === 'M' ? 'SM' : 'SW'
          competitions = competitions.filter(
            c => c.catId === catId || c.catId === 'MX'
          )
        }

        map.set(event.EventId, competitions)
      } catch {}
    })
  )

  return map
}

export async function fetchResults(
  competitions: Map<string, IBUCompetition[]>
): Promise<Map<string, IBUResultsData>> {
  const map = new Map<string, IBUResultsData>()
  const allCompetitions = [...competitions.values()].flat()

  // Fetch for competitions with start list or results (StatusId >= 2)
  const competitionsWithData = allCompetitions.filter(
    c => c.StatusId >= IBUCompetitionStatus.ProvStartList
  )

  await Promise.all(
    competitionsWithData.map(async competition => {
      try {
        const data = await request<IBUResultsResponse>(
          `${BASE_URL}/Results?RaceId=${competition.RaceId}&Language=en`,
          INTEGRATION_ID
        )
        if (data.Results && data.Results.length > 0) {
          map.set(competition.RaceId, {
            isStartList: data.IsStartList,
            results: data.Results,
          })
        }
      } catch {}
    })
  )

  return map
}
