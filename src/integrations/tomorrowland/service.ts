import type { IcsCalendar } from 'ts-ics'
import { generateIcsCalendar } from 'ts-ics'
import type {
  IntegrationConfig,
  IntegrationService,
  ParamMetadata,
  ParamOption,
  QueryParams,
  Route,
} from '../interface.ts'
import { fetchPerformances, fetchStages } from './api.ts'
import { buildCalendar } from './calendar.ts'
import type { TomorrowlandQueryParams, Weekend } from './types.ts'

export const TL_CONFIG: IntegrationConfig = {
  id: 'tomorrowland',
  name: 'Tomorrowland',
  basePath: '/api/tomorrowland',
}

export class TomorrowlandIntegration implements IntegrationService {
  readonly config = TL_CONFIG

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

          const calendar = await this.getCalendar(params)
          const icsContent = generateIcsCalendar(calendar)

          const contentType = req.headers.get('Content-Type')
          if (contentType?.includes('application/json')) {
            return Response.json({ cached: true, content: icsContent })
          }

          return new Response(icsContent, {
            headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
          })
        },
      },
      {
        path: `${this.config.basePath}/options`,
        handler: async (req: Request) => {
          const url = new URL(req.url)
          const type = url.searchParams.get('type') as
            | 'artists'
            | 'stages'
            | null
          const weekend = url.searchParams.get('weekend') as Weekend | null

          if (!type) {
            return new Response('Missing required parameter: type', {
              status: 400,
            })
          }

          if (!weekend) {
            return new Response('Missing required parameter: weekend', {
              status: 400,
            })
          }

          if (!['W1', 'W2'].includes(weekend)) {
            return new Response(
              "Invalid weekend parameter: must be 'W1' or 'W2'",
              { status: 400 },
            )
          }

          const options =
            type === 'artists'
              ? await this.extractArtistOptions(weekend)
              : await this.extractStageOptions()

          return Response.json({ options })
        },
      },
    ]
  }

  getParamMetadata(): ParamMetadata[] {
    return [
      {
        name: 'weekend',
        label: 'Weekend',
        type: 'select',
        required: true,
        options: [
          { value: 'W1', label: 'Weekend 1' },
          { value: 'W2', label: 'Weekend 2' },
        ],
      },
      {
        name: 'artist',
        label: 'Artists',
        type: 'multi-select-dynamic',
        optionsEndpoint: '/api/tomorrowland/options?type=artists',
        dependsOn: 'weekend',
        placeholder: 'Search and select artists...',
        description: 'Filter by artist names',
      },
      {
        name: 'stage',
        label: 'Stages',
        type: 'multi-select-dynamic',
        optionsEndpoint: '/api/tomorrowland/options?type=stages',
        dependsOn: 'weekend',
        placeholder: 'Search and select stages...',
        description: 'Filter by stage names',
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

  private async extractArtistOptions(weekend: Weekend): Promise<ParamOption[]> {
    const performances = await fetchPerformances(weekend)
    const artistNames = new Set<string>()

    performances.forEach((perf) => {
      perf.artists.forEach((artist) => {
        artistNames.add(artist.name)
      })
    })

    return Array.from(artistNames)
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
      )
      .map((name) => ({ value: name, label: name }))
  }

  private async extractStageOptions(): Promise<ParamOption[]> {
    const stages = await fetchStages()

    return stages
      .map((stage) => ({ value: stage.name, label: stage.name }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, {
          numeric: true,
          sensitivity: 'base',
        }),
      )
  }
}
