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

export type ParamInputType = 'text' | 'select' | 'checkbox' | 'comma-separated'

export interface ParamOption {
  value: string
  label: string
}

export interface ParamMetadata {
  name: string
  label: string
  type: ParamInputType
  required?: boolean
  defaultValue?: string | boolean
  placeholder?: string
  options?: ParamOption[]
  description?: string
}

export interface IntegrationService {
  readonly config: IntegrationConfig
  getCalendar(params: QueryParams): Promise<IcsCalendar>
  getRoutes(): Route[]
  getParamMetadata(): ParamMetadata[]
  validateParams(params: QueryParams): string | null
}
