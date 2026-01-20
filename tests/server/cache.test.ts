import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import * as cache from '../../src/server/cache.ts'

const testCacheDir = './cache'

describe('cache', () => {
  beforeAll(async () => {
    await rm(testCacheDir, { recursive: true, force: true })
  })

  afterAll(async () => {
    await rm(testCacheDir, { recursive: true, force: true })
  })

  test('get returns null for non-existent key', async () => {
    const result = await cache.get('nonexistent.ics')
    expect(result).toBeNull()
  })

  test('set and get roundtrip', async () => {
    const key = 'test-calendar.ics'
    const content = 'BEGIN:VCALENDAR\nEND:VCALENDAR'

    await cache.set(key, content)
    const result = await cache.get(key)

    expect(result).toBe(content)
  })

  test('remove deletes cached file', async () => {
    const key = 'to-remove.ics'
    await cache.set(key, 'content')

    await cache.remove(key)
    const result = await cache.get(key)

    expect(result).toBeNull()
  })

  test('remove handles non-existent key', async () => {
    await cache.remove('does-not-exist.ics')
  })
})
