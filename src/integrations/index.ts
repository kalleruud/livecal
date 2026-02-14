import type { RegisteredIntegration, Route } from "./framework/index.ts";
import ibuIntegration from "./ibu/definition.ts";
import tomorrowlandIntegration from "./tomorrowland/definition.ts";

/** All registered integrations */
export const integrations: RegisteredIntegration[] = [
	ibuIntegration,
	tomorrowlandIntegration,
];

/** Get all routes with their associated integration metadata */
export function getAllRoutes(): Array<{
	route: Route;
	integration: RegisteredIntegration;
}> {
	return integrations.flatMap((integration) =>
		integration.routes.map((route) => ({ route, integration })),
	);
}
