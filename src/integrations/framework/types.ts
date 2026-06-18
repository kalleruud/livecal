import type { IcsEvent } from 'ts-ics'
import type { ParamSchema } from './params.ts'

/**
 * Declarative definition for a calendar integration.
 *
 * @template TData - The shape of data returned by fetchData
 * @template TParams - The parsed parameter types (derived from schema)
 */
export interface CalendarIntegration<TData, TParams> {
  /** Unique identifier, used in URL path: /api/{id}/... */
  id: string

  /** Human-readable name for the integration */
  name: string

  /** Optional helper text displayed with the integration in the web UI */
  description?: string

  /** Calendar metadata for ICS output */
  calendar: {
    /** ICS PRODID field, e.g. '-//Livecal//My Service//EN' */
    prodId: string
    /** Calendar name - static string or function for dynamic naming */
    name: string | ((params: TParams) => string)
  }

  /** Endpoint filename, e.g. 'calendar.ics' → /api/{id}/calendar.ics */
  endpoint: string

  /** Parameter schema defining validation, parsing, and UI metadata */
  params: ParamSchema<TParams>

  /** Fetch data from external API(s) */
  fetchData: (params: TParams) => Promise<TData>

  /** Transform fetched data into ICS events */
  toEvents: (data: TData, params: TParams) => IcsEvent[]
}

/**
 * A registered integration with computed routes and metadata.
 * Created by the framework from a CalendarIntegration definition.
 */
export interface RegisteredIntegration {
  id: string
  name: string
  description?: string
  basePath: string
  routes: Route[]
  paramMetadata: ParamMetadata[]
}

export interface Route {
  path: string
  handler: (req: Request) => Response | Promise<Response>
}

export interface ParamMetadata {
  name: string
  label: string
  type: 'text' | 'select' | 'checkbox' | 'multi-select-dynamic'
  required?: boolean
  defaultValue?: string | boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  description?: string
  optionsEndpoint?: string
  dependsOn?: string
}
