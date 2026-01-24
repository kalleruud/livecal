import type { IcsCalendar } from 'ts-ics'

export interface IntegrationConfig {
  id: string
  name: string
  basePath: string
  cacheCron?: string
}

export interface QueryParams {
  [key: string]: string | boolean | undefined
}

export type RouteHandler = (req: Request) => Response | Promise<Response>

export interface Route {
  path: string
  handler: RouteHandler
}

export interface IntegrationService {
  readonly config: IntegrationConfig
  getCalendar(params: QueryParams): Promise<IcsCalendar>
  getRoutes(): Route[]
  validateParams(params: QueryParams): string | null
}
