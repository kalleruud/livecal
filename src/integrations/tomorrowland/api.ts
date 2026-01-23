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
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch Tomorrowland ${weekend} lineup`)
      return []
    }

    const data = (await response.json()) as TomorrowlandApiResponse
    return data.performances || []
  } catch (error) {
    console.error(`Error fetching performances for ${weekend}:`, error)
    return []
  }
}

export async function fetchStages(): Promise<TomorrowlandStageInfo[]> {
  const url = `${BASE_URL}/stages-TL26BE-${API_TOKEN}.json`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error('Failed to fetch Tomorrowland stages')
      return []
    }

    const data = (await response.json()) as TomorrowlandStagesResponse
    return data.stages || []
  } catch (error) {
    console.error('Error fetching stages:', error)
    return []
  }
}
