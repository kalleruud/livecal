import type { IcsCalendar } from "ts-ics";
import { generateIcsCalendar } from "ts-ics";
import { type CustomValidator, type ParamDef, parseParams } from "./params.ts";
import type { CalendarIntegration } from "./types.ts";

/**
 * Create the main calendar route handler for an integration.
 */
export function createCalendarHandler<TData, TParams>(
	definition: CalendarIntegration<TData, TParams>,
	customValidator?: CustomValidator<TParams>,
): (req: Request) => Promise<Response> {
	return async (req: Request): Promise<Response> => {
		const url = new URL(req.url);
		const rawParams = Object.fromEntries(url.searchParams);

		// Parse and validate params using schema
		const result = parseParams<TParams>(rawParams, definition.params);
		if (!result.success) {
			return new Response(result.error, { status: 400 });
		}
		const params = result.params;

		// Run custom validation if provided
		if (customValidator) {
			const error = customValidator(params);
			if (error) {
				return new Response(error, { status: 400 });
			}
		}

		// Fetch data from external API
		const data = await definition.fetchData(params);

		// Transform data to ICS events
		const events = definition.toEvents(data, params);

		// Build calendar with metadata
		const calendarName =
			typeof definition.calendar.name === "function"
				? definition.calendar.name(params)
				: definition.calendar.name;

		const calendar: IcsCalendar = {
			version: "2.0",
			prodId: definition.calendar.prodId,
			name: calendarName,
			events,
		};

		// Generate ICS content
		const icsContent = generateIcsCalendar(calendar);

		// Handle content negotiation
		const contentType = req.headers.get("Content-Type");
		if (contentType?.includes("application/json")) {
			return Response.json({ cached: true, content: icsContent });
		}

		return new Response(icsContent, {
			headers: { "Content-Type": "text/calendar; charset=utf-8" },
		});
	};
}

/**
 * Create the options endpoint handler for dynamic select params.
 * Serves requests like /api/{id}/options?field=artists&weekend=W1
 */
export function createOptionsHandler<TData, TParams>(
	definition: CalendarIntegration<TData, TParams>,
): (req: Request) => Promise<Response> {
	return async (req: Request): Promise<Response> => {
		const url = new URL(req.url);
		const field = url.searchParams.get("field");

		if (!field) {
			return new Response("Missing required parameter: field", { status: 400 });
		}

		// Find the param definition
		const paramDef = definition.params[field as keyof TParams] as
			| ParamDef<TParams>
			| undefined;

		if (!paramDef) {
			return new Response(`Unknown field: ${field}`, { status: 400 });
		}

		if (paramDef.type !== "dynamic-select") {
			return new Response(`Field ${field} is not a dynamic-select`, {
				status: 400,
			});
		}

		// Extract dependency values from query params
		const partialParams: Partial<TParams> = {};
		if (paramDef.dependsOn) {
			for (const dep of paramDef.dependsOn) {
				const value = url.searchParams.get(dep as string);
				if (value) {
					partialParams[dep] = value as TParams[typeof dep];
				}
			}
		}

		// Validate required dependencies
		if (paramDef.dependsOn) {
			for (const dep of paramDef.dependsOn) {
				const depDef = definition.params[dep] as ParamDef<TParams> | undefined;
				if (depDef && "required" in depDef && depDef.required) {
					if (!partialParams[dep]) {
						return new Response(`Missing required dependency: ${String(dep)}`, {
							status: 400,
						});
					}
				}
			}
		}

		// Fetch options
		const options = await paramDef.fetchOptions(partialParams);

		return Response.json({ options });
	};
}
