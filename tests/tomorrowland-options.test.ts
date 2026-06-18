import { describe, expect, test } from 'bun:test'
import tomorrowlandIntegration from '../src/integrations/tomorrowland/definition.ts'

describe('Tomorrowland Integration - Options Endpoint', () => {
  test('returns artist options for W1', async () => {
    const optionsRoute = tomorrowlandIntegration.routes.find(r =>
      r.path.endsWith('/options')
    )

    if (!optionsRoute) {
      throw new Error('Options route not found')
    }

    const req = new Request(
      'http://localhost/api/tomorrowland/options?field=artists&weekend=W1'
    )
    const response = await optionsRoute.handler(req)

    expect(response.status).toBe(200)

    const data = (await response.json()) as {
      options: Array<{ value: string; label: string }>
    }
    expect(data.options).toBeDefined()
    expect(data.options.length).toBeGreaterThan(0)

    // Should be sorted alphabetically
    for (let i = 1; i < data.options.length; i++) {
      const isOrdered =
        data.options[i - 1].value.localeCompare(data.options[i].value) <= 0
      expect(isOrdered).toBe(true)
    }

    // Each option should have value and label that match
    for (const opt of data.options) {
      expect(opt.value).toBeDefined()
      expect(opt.label).toBeDefined()
      expect(opt.value).toBe(opt.label)
    }
  })

  test('returns stage options', async () => {
    const optionsRoute = tomorrowlandIntegration.routes.find(r =>
      r.path.endsWith('/options')
    )

    if (!optionsRoute) {
      throw new Error('Options route not found')
    }

    const req = new Request(
      'http://localhost/api/tomorrowland/options?field=stages&weekend=W1'
    )
    const response = await optionsRoute.handler(req)

    expect(response.status).toBe(200)

    const data = (await response.json()) as {
      options: Array<{ value: string; label: string }>
    }
    expect(data.options).toBeDefined()
    expect(data.options.length).toBeGreaterThan(0)

    // Should be sorted alphabetically
    for (let i = 1; i < data.options.length; i++) {
      const isOrdered =
        data.options[i - 1].value.localeCompare(data.options[i].value) <= 0
      expect(isOrdered).toBe(true)
    }

    // Each option should have value and label that match
    for (const opt of data.options) {
      expect(opt.value).toBeDefined()
      expect(opt.label).toBeDefined()
      expect(opt.value).toBe(opt.label)
    }
  })

  test('returns error for missing field parameter', async () => {
    const optionsRoute = tomorrowlandIntegration.routes.find(r =>
      r.path.endsWith('/options')
    )

    if (!optionsRoute) {
      throw new Error('Options route not found')
    }

    const req = new Request(
      'http://localhost/api/tomorrowland/options?weekend=W1'
    )
    const response = await optionsRoute.handler(req)

    expect(response.status).toBe(400)
    expect(await response.text()).toContain('field')
  })

  test('param metadata includes multi-select-dynamic type', () => {
    const metadata = tomorrowlandIntegration.paramMetadata

    const artistParam = metadata.find(p => p.name === 'artists')
    const stageParam = metadata.find(p => p.name === 'stages')

    expect(artistParam).toBeDefined()
    expect(artistParam?.type).toBe('multi-select-dynamic')
    expect(artistParam?.optionsEndpoint).toBe(
      '/api/tomorrowland/options?field=artists'
    )
    expect(artistParam?.dependsOn).toBe('weekend')

    expect(stageParam).toBeDefined()
    expect(stageParam?.type).toBe('multi-select-dynamic')
    expect(stageParam?.optionsEndpoint).toBe(
      '/api/tomorrowland/options?field=stages'
    )
    expect(stageParam?.dependsOn).toBe('weekend')
  })

  test('describes how artist and stage filters combine', () => {
    expect(tomorrowlandIntegration.description).toBe(
      'Selecting both artists and stages includes only performances matching at least one selected artist and at least one selected stage.'
    )
  })

  test('artist options should be unique', async () => {
    const optionsRoute = tomorrowlandIntegration.routes.find(r =>
      r.path.endsWith('/options')
    )

    if (!optionsRoute) {
      throw new Error('Options route not found')
    }

    const req = new Request(
      'http://localhost/api/tomorrowland/options?field=artists&weekend=W1'
    )
    const response = await optionsRoute.handler(req)

    const data = (await response.json()) as {
      options: Array<{ value: string; label: string }>
    }
    const values = data.options.map(o => o.value)
    const uniqueValues = new Set(values)

    // All values should be unique
    expect(values.length).toBe(uniqueValues.size)
  })
})
