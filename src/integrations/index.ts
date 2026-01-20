import type { IntegrationService, Route } from './interface.ts'
import { IBUIntegration } from './ibu/service.ts'

export const integrations: IntegrationService[] = [new IBUIntegration()]

export function getAllRoutes(): Route[] {
  return integrations.flatMap((integration) => integration.getRoutes())
}
