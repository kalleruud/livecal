import type { IcsCalendar, IcsEvent } from 'ts-ics'
import type {
  TomorrowlandPerformance,
  TomorrowlandQueryParams,
  TomorrowlandStageInfo,
} from './types.ts'

function parseDateTime(dateTimeStr: string): Date {
  // Format: "2026-07-18 12:00:00+02:00"
  // Replace space with T for ISO format
  const isoStr = dateTimeStr.replace(' ', 'T')
  return new Date(isoStr)
}

function isUnpublishedTime(startTime: string, endTime: string): boolean {
  // Times of 12:00-12:01 indicate the performance time hasn't been published yet
  const startMatch = startTime.match(/12:00:00/)
  const endMatch = endTime.match(/12:01:00/)
  return !!(startMatch && endMatch)
}

function performanceToIcsEvent(
  performance: TomorrowlandPerformance,
  stageHost?: string
): IcsEvent {
  const artistNames = performance.artists.map(a => a.name).join(', ')
  const startTime = parseDateTime(performance.startTime)
  const endTime = parseDateTime(performance.endTime)

  const descriptionParts = [`Artists: ${artistNames}`]
  if (stageHost) {
    descriptionParts.push(`Stage: ${stageHost}`)
  }

  // Check if time is unpublished (12:00-12:01 indicator)
  if (isUnpublishedTime(performance.startTime, performance.endTime)) {
    // Create all-day event by using date-only format
    // For all-day events, end date should be the day after (exclusive)
    const endDateNextDay = new Date(startTime)
    endDateNextDay.setDate(endDateNextDay.getDate() + 1)

    return {
      uid: performance.id,
      stamp: { date: new Date() },
      start: { type: 'DATE', date: startTime },
      end: { type: 'DATE', date: endDateNextDay },
      summary: `🎵 ${performance.name}`,
      description: descriptionParts.join('\n'),
      location: performance.stage.name,
    }
  }

  return {
    uid: performance.id,
    stamp: { date: new Date() },
    start: { date: startTime },
    end: { date: endTime },
    summary: `🎵 ${performance.name}`,
    description: descriptionParts.join('\n'),
    location: performance.stage.name,
  }
}

function filterPerformances(
  performances: TomorrowlandPerformance[],
  params: TomorrowlandQueryParams
): TomorrowlandPerformance[] {
  let filtered = performances

  if (params.artists && params.artists.length > 0) {
    const artistFilters = params.artists.map(a => a.toLowerCase())
    filtered = filtered.filter(p =>
      artistFilters.some(
        filter =>
          p.name.toLowerCase().includes(filter) ||
          p.artists.some(a => a.name.toLowerCase().includes(filter))
      )
    )
  }

  if (params.stages && params.stages.length > 0) {
    const stageFilters = params.stages.map(s => s.toLowerCase())
    filtered = filtered.filter(p =>
      stageFilters.some(filter => p.stage.name.toLowerCase().includes(filter))
    )
  }

  return filtered
}

function getStageHost(
  stageId: string,
  date: string,
  stages: TomorrowlandStageInfo[]
): string | undefined {
  const stage = stages.find(s => s.id === stageId)
  if (stage?.hosts[date]) {
    return stage.hosts[date]
  }
  return undefined
}

export function buildCalendar(
  performances: TomorrowlandPerformance[],
  params: TomorrowlandQueryParams,
  stages: TomorrowlandStageInfo[] = []
): IcsCalendar {
  const filtered = filterPerformances(performances, params)

  const icsEvents = filtered.map(performance => {
    const stageHost = getStageHost(
      performance.stage.id,
      performance.date,
      stages
    )
    return performanceToIcsEvent(performance, stageHost)
  })

  const weekendLabel = params.weekend === 'W1' ? 'Weekend 1' : 'Weekend 2'

  return {
    version: '2.0',
    prodId: '-//Livecal//Tomorrowland//EN',
    name: `Tomorrowland 2026 ${weekendLabel}`,
    events: icsEvents,
  }
}
