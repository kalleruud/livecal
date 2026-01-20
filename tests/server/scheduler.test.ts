import { afterEach, describe, expect, test } from 'bun:test'
import * as scheduler from '../../src/server/scheduler.ts'

describe('scheduler', () => {
  afterEach(() => {
    scheduler.stop()
  })

  test('isRunning returns false when not started', () => {
    expect(scheduler.isRunning()).toBe(false)
  })

  test('start sets isRunning to true', () => {
    scheduler.start(() => {})
    expect(scheduler.isRunning()).toBe(true)
  })

  test('stop sets isRunning to false', () => {
    scheduler.start(() => {})
    scheduler.stop()
    expect(scheduler.isRunning()).toBe(false)
  })

  test('callback is invoked on schedule', async () => {
    let called = false

    process.env.CACHE_CRON = '* * * * * *' // every second
    scheduler.start(() => {
      called = true
    })

    await new Promise((resolve) => setTimeout(resolve, 1100))
    expect(called).toBe(true)
  })
})
