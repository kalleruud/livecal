import { Cron } from 'croner'

type SchedulerCallback = () => void | Promise<void>

let job: Cron | null = null

export function start(callback: SchedulerCallback): void {
  const cronExpression = process.env.CACHE_CRON || '0 * * * *'

  job = new Cron(cronExpression, async () => {
    try {
      await callback()
    } catch (error) {
      console.error('Scheduler error:', error)
    }
  })

  console.log(`Scheduler started with cron: ${cronExpression}`)
}

export function stop(): void {
  if (job) {
    job.stop()
    job = null
    console.log('Scheduler stopped')
  }
}

export function isRunning(): boolean {
  return job?.isRunning() ?? false
}
