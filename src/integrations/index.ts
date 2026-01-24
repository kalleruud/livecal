import { IBUIntegration } from './ibu/service.ts'
import type { IntegrationService, Route } from './interface.ts'
import { TomorrowlandIntegration } from './tomorrowland/service.ts'

export const integrations: IntegrationService[] = [
  new IBUIntegration(),
  new TomorrowlandIntegration(),
]

export function getAllRoutes(): Array<{ route: Route; integration: IntegrationService }> {
  return integrations.flatMap((integration) =>
    integration.getRoutes().map((route) => ({ route, integration }))
  )
}
