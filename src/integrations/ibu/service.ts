import type { IcsCalendar } from 'ts-ics'
import { generateIcsCalendar } from 'ts-ics'
import type {
  IntegrationConfig,
  IntegrationService,
  QueryParams,
  Route,
} from '../interface.ts'
import { fetchCompetitions, fetchEvents, fetchResults } from './api.ts'
import { buildCalendar } from './calendar.ts'
import type { IBUQueryParams } from './types.ts'

const config: IntegrationConfig = {
  id: 'ibu',
  name: 'IBU Biathlon World Cup',
  basePath: '/api/ibu',
}

export class IBUIntegration implements IntegrationService {
  readonly config = config

  async getCalendar(params: QueryParams): Promise<IcsCalendar> {
    const ibuParams = this.parseParams(params)
    const seasons = ibuParams.season
      ? [ibuParams.season]
      : this.getAvailableSeasons()

    const events = await fetchEvents(seasons)
    const competitions = await fetchCompetitions(events, ibuParams.gender)
    const results = await fetchResults(competitions)

    return buildCalendar(events, competitions, results, ibuParams)
  }

  getRoutes(): Route[] {
    return [
      {
        path: `${this.config.basePath}/wc.ics`,
        handler: async (req: Request) => {
          const url = new URL(req.url)
          const params = Object.fromEntries(url.searchParams)

          const error = this.validateParams(params)
          if (error) {
            return new Response(error, { status: 400 })
          }

          const calendar = await this.getCalendar(params)
          const contentType = req.headers.get('Content-Type')

          if (contentType?.includes('application/json')) {
            return Response.json(calendar)
          }

          return new Response(generateIcsCalendar(calendar), {
            headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
          })
        },
      },
    ]
  }

  validateParams(params: QueryParams): string | null {
    const parsed = this.parseParams(params)

    if (!parsed.includeEvents && !parsed.includeComps) {
      return 'At least one of includeEvents or includeComps must be true'
    }

    if (parsed.gender && !['M', 'W'].includes(parsed.gender)) {
      return "Gender must be 'M' or 'W'"
    }

    return null
  }

  getCacheKey(params: QueryParams): string {
    const parsed = this.parseParams(params)
    const season = parsed.season || 'all'
    const gender = parsed.gender || 'both'
    return `ibu-wc-${season}-${gender}.ics`
  }

  private parseParams(query: QueryParams): IBUQueryParams {
    return {
      season: query.season as string | undefined,
      gender: query.gender as string | undefined,
      includeEvents:
        query.includeEvents === 'true' || query.includeEvents === true,
      includeComps:
        query.includeComps !== 'false' && query.includeComps !== false,
    }
  }

  private getAvailableSeasons(): string[] {
    const now = new Date()
    const year = now.getFullYear() % 100
    const month = now.getMonth()
    const currentSeason =
      month >= 9 ? `${year}${year + 1}` : `${year - 1}${year}`
    const prevSeason =
      month >= 9 ? `${year - 1}${year}` : `${year - 2}${year - 1}`
    return [prevSeason, currentSeason]
  }
}
