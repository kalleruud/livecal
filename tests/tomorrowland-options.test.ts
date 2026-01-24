import { describe, expect, test } from 'bun:test'
import type { ParamOption } from '../src/integrations/interface.ts'
import { TomorrowlandIntegration } from '../src/integrations/tomorrowland/service.ts'

describe('Tomorrowland Integration - Options Endpoint', () => {
  test('returns artist options for W1', async () => {
    const integration = new TomorrowlandIntegration()
    const routes = integration.getRoutes()
    const optionsRoute = routes.find((r) => r.path.endsWith('/options'))

    if (!optionsRoute) {
      throw new Error('Options route not found')
    }

    const req = new Request(
      'http://localhost/api/tomorrowland/options?type=artists&weekend=W1',
    )
    const response = await optionsRoute.handler(req)

    expect(response.status).toBe(200)

    const data = (await response.json()) as { options: ParamOption[] }
    expect(data.options).toBeDefined()
    expect(data.options.length).toBeGreaterThan(0)

    // Should be sorted alphabetically
    for (let i = 1; i < data.options.length; i++) {
      const isOrdered =
        data.options[i - 1].value.localeCompare(data.options[i].value) <= 0
      expect(isOrdered).toBe(true)
    }

    // Each option should have value and label that match
    data.options.forEach((opt) => {
      expect(opt.value).toBeDefined()
      expect(opt.label).toBeDefined()
      expect(opt.value).toBe(opt.label)
    })
  })

  test('returns stage options', async () => {
    const integration = new TomorrowlandIntegration()
    const routes = integration.getRoutes()
    const optionsRoute = routes.find((r) => r.path.endsWith('/options'))

    if (!optionsRoute) {
      throw new Error('Options route not found')
    }

    const req = new Request(
      'http://localhost/api/tomorrowland/options?type=stages&weekend=W1',
    )
    const response = await optionsRoute.handler(req)

    expect(response.status).toBe(200)

    const data = (await response.json()) as { options: ParamOption[] }
    expect(data.options).toBeDefined()
    expect(data.options.length).toBeGreaterThan(0)

    // Should be sorted alphabetically
    for (let i = 1; i < data.options.length; i++) {
      const isOrdered =
        data.options[i - 1].value.localeCompare(data.options[i].value) <= 0
      expect(isOrdered).toBe(true)
    }

    // Each option should have value and label that match
    data.options.forEach((opt) => {
      expect(opt.value).toBeDefined()
      expect(opt.label).toBeDefined()
      expect(opt.value).toBe(opt.label)
    })
  })

  test('returns error for missing type parameter', async () => {
    const integration = new TomorrowlandIntegration()
    const routes = integration.getRoutes()
    const optionsRoute = routes.find((r) => r.path.endsWith('/options'))

    if (!optionsRoute) {
      throw new Error('Options route not found')
    }

    const req = new Request(
      'http://localhost/api/tomorrowland/options?weekend=W1',
    )
    const response = await optionsRoute.handler(req)

    expect(response.status).toBe(400)
    expect(await response.text()).toContain('type')
  })

  test('returns error for missing weekend parameter', async () => {
    const integration = new TomorrowlandIntegration()
    const routes = integration.getRoutes()
    const optionsRoute = routes.find((r) => r.path.endsWith('/options'))

    if (!optionsRoute) {
      throw new Error('Options route not found')
    }

    const req = new Request(
      'http://localhost/api/tomorrowland/options?type=artists',
    )
    const response = await optionsRoute.handler(req)

    expect(response.status).toBe(400)
    expect(await response.text()).toContain('weekend')
  })

  test('returns error for invalid weekend parameter', async () => {
    const integration = new TomorrowlandIntegration()
    const routes = integration.getRoutes()
    const optionsRoute = routes.find((r) => r.path.endsWith('/options'))

    if (!optionsRoute) {
      throw new Error('Options route not found')
    }

    const req = new Request(
      'http://localhost/api/tomorrowland/options?type=artists&weekend=W3',
    )
    const response = await optionsRoute.handler(req)

    expect(response.status).toBe(400)
    expect(await response.text()).toContain('Invalid weekend')
  })

  test('param metadata includes multi-select-dynamic type', () => {
    const integration = new TomorrowlandIntegration()
    const metadata = integration.getParamMetadata()

    const artistParam = metadata.find((p) => p.name === 'artist')
    const stageParam = metadata.find((p) => p.name === 'stage')

    expect(artistParam).toBeDefined()
    expect(artistParam?.type).toBe('multi-select-dynamic')
    expect(artistParam?.optionsEndpoint).toBe(
      '/api/tomorrowland/options?type=artists',
    )
    expect(artistParam?.dependsOn).toBe('weekend')

    expect(stageParam).toBeDefined()
    expect(stageParam?.type).toBe('multi-select-dynamic')
    expect(stageParam?.optionsEndpoint).toBe(
      '/api/tomorrowland/options?type=stages',
    )
    expect(stageParam?.dependsOn).toBe('weekend')
  })

  test('artist options should be unique', async () => {
    const integration = new TomorrowlandIntegration()
    const routes = integration.getRoutes()
    const optionsRoute = routes.find((r) => r.path.endsWith('/options'))

    if (!optionsRoute) {
      throw new Error('Options route not found')
    }

    const req = new Request(
      'http://localhost/api/tomorrowland/options?type=artists&weekend=W1',
    )
    const response = await optionsRoute.handler(req)

    const data = (await response.json()) as { options: ParamOption[] }
    const values = data.options.map((o) => o.value)
    const uniqueValues = new Set(values)

    // All values should be unique
    expect(values.length).toBe(uniqueValues.size)
  })
})
