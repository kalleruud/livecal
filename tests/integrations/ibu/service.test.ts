import { describe, expect, test } from 'bun:test'
import { IBUIntegration } from '../../../src/integrations/ibu/service.ts'

describe('IBUIntegration', () => {
  const integration = new IBUIntegration()

  describe('config', () => {
    test('has correct id', () => {
      expect(integration.config.id).toBe('ibu')
    })

    test('has correct basePath', () => {
      expect(integration.config.basePath).toBe('/api/ibu')
    })
  })

  describe('validateParams', () => {
    test('returns null for valid params', () => {
      expect(integration.validateParams({})).toBeNull()
      expect(integration.validateParams({ season: '2526' })).toBeNull()
      expect(integration.validateParams({ gender: 'M' })).toBeNull()
      expect(integration.validateParams({ gender: 'W' })).toBeNull()
    })

    test('returns error when both includeEvents and includeComps are false', () => {
      const error = integration.validateParams({
        includeEvents: 'false',
        includeComps: 'false',
      })
      expect(error).toBe(
        'At least one of includeEvents or includeComps must be true',
      )
    })

    test('returns error for invalid gender', () => {
      const error = integration.validateParams({ gender: 'X' })
      expect(error).toBe("Gender must be 'M' or 'W'")
    })
  })

  describe('getCacheKey', () => {
    test('returns default key when no params', () => {
      expect(integration.getCacheKey({})).toBe('ibu-wc-all-both.ics')
    })

    test('includes season in key', () => {
      expect(integration.getCacheKey({ season: '2526' })).toBe(
        'ibu-wc-2526-both.ics',
      )
    })

    test('includes gender in key', () => {
      expect(integration.getCacheKey({ gender: 'M' })).toBe('ibu-wc-all-M.ics')
    })

    test('includes both season and gender in key', () => {
      expect(integration.getCacheKey({ season: '2526', gender: 'W' })).toBe(
        'ibu-wc-2526-W.ics',
      )
    })
  })

  describe('getRoutes', () => {
    test('returns route for wc.ics', () => {
      const routes = integration.getRoutes()
      expect(routes).toHaveLength(1)
      expect(routes[0].path).toBe('/api/ibu/wc.ics')
    })
  })
})
