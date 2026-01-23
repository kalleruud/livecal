import { IBUIntegration } from './ibu/service.ts'
import { TomorrowlandIntegration } from './tomorrowland/service.ts'
import type { IntegrationService, Route } from './interface.ts'

export const integrations: IntegrationService[] = [
  new IBUIntegration(),
  new TomorrowlandIntegration(),
]

export function getAllRoutes(): Route[] {
  return integrations.flatMap((integration) => integration.getRoutes())
}
