import request from '../../server/cache.ts'
import { config } from './service.ts'
import type {
  TomorrowlandApiResponse,
  TomorrowlandPerformance,
  TomorrowlandStageInfo,
  TomorrowlandStagesResponse,
  Weekend,
} from './types.ts'

const BASE_URL = 'https://artist-lineup-cdn.tomorrowland.com'
const API_TOKEN = '9205196e-3eef-45c0-a82e-72aa1bb3cf8f'

export async function fetchPerformances(
  weekend: Weekend,
): Promise<TomorrowlandPerformance[]> {
  const url = `${BASE_URL}/TL26BE-${weekend}-${API_TOKEN}.json`

  try {
    const response = await request<TomorrowlandApiResponse>(
      url,
      `${config.id}-fetchPerformances-${weekend}`,
    )
    return response.performances
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function fetchStages(): Promise<TomorrowlandStageInfo[]> {
  const url = `${BASE_URL}/stages-TL26BE-${API_TOKEN}.json`

  try {
    const response = await request<TomorrowlandStagesResponse>(
      url,
      `${config.id}-fetchStages`,
    )
    return response.stages
  } catch (error) {
    console.error(error)
    return []
  }
}
