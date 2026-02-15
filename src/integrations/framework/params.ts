/**
 * Parameter definition types for declarative integration schemas.
 * Each param type defines validation, parsing, and UI rendering behavior.
 */

/** Text input parameter */
export interface TextParam {
  type: 'text'
  label: string
  required?: boolean
  default?: string
  placeholder?: string
  description?: string
  /** Custom validation - return error message or null if valid */
  validate?: (value: string) => string | null
}

/** Single-select dropdown parameter */
export interface SelectParam {
  type: 'select'
  label: string
  required?: boolean
  default?: string
  description?: string
  options: Array<{ value: string; label: string }>
  /** Custom validation - return error message or null if valid */
  validate?: (value: string) => string | null
}

/** Checkbox/boolean parameter */
export interface CheckboxParam {
  type: 'checkbox'
  label: string
  default?: boolean
  description?: string
}

/** Dynamic multi-select with async options loading */
export interface DynamicSelectParam<TParams> {
  type: 'dynamic-select'
  label: string
  multiple?: boolean
  placeholder?: string
  description?: string
  /** Fields this param depends on (used to refresh options) */
  dependsOn?: Array<keyof TParams>
  /** Fetch available options based on current params */
  fetchOptions: (
    params: Partial<TParams>
  ) => Promise<Array<{ value: string; label: string }>>
}

/** Union of all parameter types */
export type ParamDef<TParams = Record<string, unknown>> =
  | TextParam
  | SelectParam
  | CheckboxParam
  | DynamicSelectParam<TParams>

/** Schema mapping param names to their definitions */
export type ParamSchema<TParams> = {
  [K in keyof TParams]: ParamDef<TParams>
}

/** Result of parsing and validating params */
export type ParseResult<TParams> =
  | { success: true; params: TParams }
  | { success: false; error: string }

/**
 * Parse and validate raw query params against a schema.
 */
export function parseParams<TParams>(
  raw: Record<string, string>,
  schema: ParamSchema<TParams>
): ParseResult<TParams> {
  const parsed: Record<string, unknown> = {}

  for (const [name, def] of Object.entries(schema) as Array<
    [string, ParamDef<TParams>]
  >) {
    const rawValue = raw[name]

    switch (def.type) {
      case 'text': {
        const value = rawValue || def.default || ''
        if (def.required && !value) {
          return {
            success: false,
            error: `Missing required parameter: ${name}`,
          }
        }
        if (value && def.validate) {
          const error = def.validate(value)
          if (error) return { success: false, error }
        }
        parsed[name] = value || undefined
        break
      }

      case 'select': {
        const value = rawValue || def.default || ''
        if (def.required && !value) {
          return {
            success: false,
            error: `Missing required parameter: ${name}`,
          }
        }
        if (value) {
          const validValues = def.options.map(o => o.value)
          if (!validValues.includes(value)) {
            return {
              success: false,
              error: `Invalid value for ${name}: must be one of ${validValues.join(', ')}`,
            }
          }
          if (def.validate) {
            const error = def.validate(value)
            if (error) return { success: false, error }
          }
        }
        parsed[name] = value || undefined
        break
      }

      case 'checkbox': {
        // Parse boolean: 'true', '1', or presence means true
        if (rawValue === undefined || rawValue === '') {
          parsed[name] = def.default ?? false
        } else {
          parsed[name] = rawValue === 'true' || rawValue === '1'
        }
        break
      }

      case 'dynamic-select': {
        // Parse comma-separated values into array
        if (rawValue) {
          const values = rawValue
            .split(',')
            .map(v => v.trim())
            .filter(Boolean)
          parsed[name] = values.length > 0 ? values : undefined
        } else {
          parsed[name] = undefined
        }
        break
      }
    }
  }

  return { success: true, params: parsed as TParams }
}

/**
 * Run custom validation logic after parsing.
 * Returns error message or null if valid.
 */
export type CustomValidator<TParams> = (params: TParams) => string | null
