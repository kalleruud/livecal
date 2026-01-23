import type { IcsCalendar } from 'ts-ics'
import { generateIcsCalendar } from 'ts-ics'
import * as cache from '../../server/cache.ts'
import type {
  IntegrationConfig,
  IntegrationService,
  QueryParams,
  Route,
} from '../interface.ts'
import { fetchPerformances, fetchStages } from './api.ts'
import { buildCalendar } from './calendar.ts'
import type { TomorrowlandQueryParams, Weekend } from './types.ts'

const config: IntegrationConfig = {
  id: 'tomorrowland',
  name: 'Tomorrowland',
  basePath: '/api/tomorrowland',
}

export class TomorrowlandIntegration implements IntegrationService {
  readonly config = config

  async getCalendar(params: QueryParams): Promise<IcsCalendar> {
    const tlParams = this.parseParams(params)
    const performances = await fetchPerformances(tlParams.weekend)
    const stages = await fetchStages()
    return buildCalendar(performances, tlParams, stages)
  }

  getRoutes(): Route[] {
    return [
      {
        path: `${this.config.basePath}/lineup.ics`,
        handler: async (req: Request) => {
          const url = new URL(req.url)
          const params = Object.fromEntries(url.searchParams)

          const error = this.validateParams(params)
          if (error) {
            return new Response(error, { status: 400 })
          }

          const cacheKey = this.getCacheKey(params)
          let icsContent = await cache.get(cacheKey)

          if (!icsContent) {
            console.log(`Cache miss for ${cacheKey}, fetching from API...`)
            const calendar = await this.getCalendar(params)
            icsContent = generateIcsCalendar(calendar)
            await cache.set(cacheKey, icsContent)
          } else {
            console.log(`Cache hit for ${cacheKey}`)
          }

          const contentType = req.headers.get('Content-Type')
          if (contentType?.includes('application/json')) {
            return Response.json({ cached: true, content: icsContent })
          }

          return new Response(icsContent, {
            headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
          })
        },
      },
    ]
  }

  validateParams(params: QueryParams): string | null {
    const weekend = params.weekend as string | undefined
    if (!weekend) {
      return "Missing required parameter: 'weekend' (W1 or W2)"
    }
    if (!['W1', 'W2'].includes(weekend)) {
      return "Invalid weekend parameter: must be 'W1' or 'W2'"
    }
    return null
  }

  getCacheKey(params: QueryParams): string {
    const parsed = this.parseParams(params)
    const parts = [`tomorrowland-${parsed.weekend}`]

    if (parsed.artists && parsed.artists.length > 0) {
      parts.push(`artists-${parsed.artists.join('-')}`)
    }

    if (parsed.stages && parsed.stages.length > 0) {
      parts.push(`stages-${parsed.stages.join('-')}`)
    }

    return `${parts.join('-')}.ics`
  }

  private parseParams(query: QueryParams): TomorrowlandQueryParams {
    const weekend = (query.weekend as Weekend) || 'W1'

    const artists = query.artist
      ? (query.artist as string).split(',').map((a) => a.trim())
      : undefined

    const stages = query.stage
      ? (query.stage as string).split(',').map((s) => s.trim())
      : undefined

    return {
      weekend,
      artists: artists && artists.length > 0 ? artists : undefined,
      stages: stages && stages.length > 0 ? stages : undefined,
    }
  }
}
