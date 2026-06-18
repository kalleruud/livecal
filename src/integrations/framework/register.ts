import { createCalendarHandler, createOptionsHandler } from './handlers.ts'
import type { CustomValidator, ParamDef, ParamSchema } from './params.ts'
import type {
  CalendarIntegration,
  ParamMetadata,
  RegisteredIntegration,
  Route,
} from './types.ts'

/**
 * Convert a param schema to UI metadata for the frontend.
 */
function schemaToMetadata<TParams>(
  schema: ParamSchema<TParams>,
  basePath: string
): ParamMetadata[] {
  const metadata: ParamMetadata[] = []

  for (const [name, def] of Object.entries(schema) as Array<
    [string, ParamDef<TParams>]
  >) {
    switch (def.type) {
      case 'text':
        metadata.push({
          name,
          label: def.label,
          type: 'text',
          required: def.required,
          defaultValue: def.default,
          placeholder: def.placeholder,
          description: def.description,
        })
        break

      case 'select':
        metadata.push({
          name,
          label: def.label,
          type: 'select',
          required: def.required,
          defaultValue: def.default,
          options: def.options,
          description: def.description,
        })
        break

      case 'checkbox':
        metadata.push({
          name,
          label: def.label,
          type: 'checkbox',
          defaultValue: def.default,
          description: def.description,
        })
        break

      case 'dynamic-select':
        metadata.push({
          name,
          label: def.label,
          type: 'multi-select-dynamic',
          placeholder: def.placeholder,
          description: def.description,
          optionsEndpoint: `${basePath}/options?field=${name}`,
          dependsOn: def.dependsOn?.[0] as string | undefined,
        })
        break
    }
  }

  return metadata
}

/**
 * Check if schema has any dynamic-select params that need an options endpoint.
 */
function hasDynamicParams<TParams>(schema: ParamSchema<TParams>): boolean {
  for (const def of Object.values(schema) as ParamDef<TParams>[]) {
    if (def.type === 'dynamic-select') return true
  }
  return false
}

export interface IntegrationOptions<TParams> {
  /** Custom validation that runs after schema validation */
  validate?: CustomValidator<TParams>
}

/**
 * Create a registered integration from a declarative definition.
 * This is the main factory function for defining integrations.
 *
 * @example
 * ```ts
 * export default createIntegration({
 *   id: 'myservice',
 *   name: 'My Service',
 *   description: 'Choose filters to customize this calendar.',
 *   calendar: {
 *     prodId: '-//Livecal//My Service//EN',
 *     name: 'My Calendar',
 *   },
 *   endpoint: 'calendar.ics',
 *   params: {
 *     filter: { type: 'text', label: 'Filter' },
 *   },
 *   fetchData: async (params) => fetchFromAPI(params),
 *   toEvents: (data, params) => data.map(item => toIcsEvent(item)),
 * })
 * ```
 */
export function createIntegration<TData, TParams>(
  definition: CalendarIntegration<TData, TParams>,
  options?: IntegrationOptions<TParams>
): RegisteredIntegration {
  const basePath = `/api/${definition.id}`

  const routes: Route[] = [
    // Main calendar endpoint
    {
      path: `${basePath}/${definition.endpoint}`,
      handler: createCalendarHandler(definition, options?.validate),
    },
  ]

  // Add options endpoint only if there are dynamic-select params
  if (hasDynamicParams(definition.params)) {
    routes.push({
      path: `${basePath}/options`,
      handler: createOptionsHandler(definition),
    })
  }

  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    basePath,
    routes,
    paramMetadata: schemaToMetadata(definition.params, basePath),
  }
}
