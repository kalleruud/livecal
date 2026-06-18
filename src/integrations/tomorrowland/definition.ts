import { createIntegration } from '../framework/index.ts'
import { fetchPerformances, fetchStages } from './api.ts'
import { performanceToEvent } from './events.ts'
import type {
  TomorrowlandPerformance,
  TomorrowlandStageInfo,
  Weekend,
} from './types.ts'

/** Data returned by fetchData */
interface TomorrowlandData {
  performances: TomorrowlandPerformance[]
  stages: TomorrowlandStageInfo[]
}

/** Parsed parameters */
interface TomorrowlandParams {
  weekend: Weekend
  artists?: string[]
  stages?: string[]
}

export default createIntegration<TomorrowlandData, TomorrowlandParams>({
  id: 'tomorrowland',
  name: 'Tomorrowland',
  description:
    'Selecting both artists and stages includes only performances matching at least one selected artist and at least one selected stage.',

  calendar: {
    prodId: '-//Livecal//Tomorrowland//EN',
    name: params =>
      `Tomorrowland 2026 ${params.weekend === 'W1' ? 'Weekend 1' : 'Weekend 2'}`,
  },

  endpoint: 'lineup.ics',

  params: {
    weekend: {
      type: 'select',
      label: 'Weekend',
      required: true,
      options: [
        { value: 'W1', label: 'Weekend 1' },
        { value: 'W2', label: 'Weekend 2' },
      ],
    },
    artists: {
      type: 'dynamic-select',
      label: 'Artists',
      multiple: true,
      placeholder: 'Search and select artists...',
      description: 'Filter by artist names',
      dependsOn: ['weekend'],
      fetchOptions: async params => {
        if (!params.weekend) return []
        const performances = await fetchPerformances(params.weekend as Weekend)
        const names = new Set<string>()
        for (const perf of performances) {
          for (const artist of perf.artists) {
            names.add(artist.name)
          }
        }
        return Array.from(names)
          .sort((a, b) =>
            a.localeCompare(b, undefined, {
              numeric: true,
              sensitivity: 'base',
            })
          )
          .map(name => ({ value: name, label: name }))
      },
    },
    stages: {
      type: 'dynamic-select',
      label: 'Stages',
      multiple: true,
      placeholder: 'Search and select stages...',
      description: 'Filter by stage names',
      dependsOn: ['weekend'],
      fetchOptions: async () => {
        const stages = await fetchStages()
        return stages
          .map(s => ({ value: s.name, label: s.name }))
          .sort((a, b) =>
            a.label.localeCompare(b.label, undefined, {
              numeric: true,
              sensitivity: 'base',
            })
          )
      },
    },
  },

  fetchData: async params => ({
    performances: await fetchPerformances(params.weekend),
    stages: await fetchStages(),
  }),

  toEvents: (data, params) => {
    let performances = data.performances

    // Filter by artists (OR logic within category)
    if (params.artists && params.artists.length > 0) {
      const artistFilters = params.artists.map(a => a.toLowerCase())
      performances = performances.filter(p =>
        artistFilters.some(
          filter =>
            p.name.toLowerCase().includes(filter) ||
            p.artists.some(a => a.name.toLowerCase().includes(filter))
        )
      )
    }

    // Filter by stages (OR logic within category)
    if (params.stages && params.stages.length > 0) {
      const stageFilters = params.stages.map(s => s.toLowerCase())
      performances = performances.filter(p =>
        stageFilters.some(filter => p.stage.name.toLowerCase().includes(filter))
      )
    }

    return performances.map(p => performanceToEvent(p, data.stages))
  },
})
