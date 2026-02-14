import type { IcsEvent } from "ts-ics";
import type {
	TomorrowlandPerformance,
	TomorrowlandStageInfo,
} from "./types.ts";

function parseDateTime(dateTimeStr: string): Date {
	// Format: "2026-07-18 12:00:00+02:00"
	const isoStr = dateTimeStr.replace(" ", "T");
	return new Date(isoStr);
}

function isUnpublishedTime(startTime: string, endTime: string): boolean {
	// Times of 12:00-12:01 indicate the performance time hasn't been published yet
	const startMatch = startTime.match(/12:00:00/);
	const endMatch = endTime.match(/12:01:00/);
	return !!(startMatch && endMatch);
}

function getStageHost(
	stageId: string,
	date: string,
	stages: TomorrowlandStageInfo[],
): string | undefined {
	const stage = stages.find((s) => s.id === stageId);
	return stage?.hosts[date];
}

/**
 * Transform a Tomorrowland performance into an ICS event.
 */
export function performanceToEvent(
	performance: TomorrowlandPerformance,
	stages: TomorrowlandStageInfo[] = [],
): IcsEvent {
	const artistNames = performance.artists.map((a) => a.name).join(", ");
	const startTime = parseDateTime(performance.startTime);
	const endTime = parseDateTime(performance.endTime);
	const stageHost = getStageHost(
		performance.stage.id,
		performance.date,
		stages,
	);

	const descriptionParts = [`Artists: ${artistNames}`];
	if (stageHost) {
		descriptionParts.push(`Stage: ${stageHost}`);
	}

	// Check if time is unpublished (12:00-12:01 indicator)
	if (isUnpublishedTime(performance.startTime, performance.endTime)) {
		// Create all-day event by using date-only format
		const endDateNextDay = new Date(startTime);
		endDateNextDay.setDate(endDateNextDay.getDate() + 1);

		return {
			uid: performance.id,
			stamp: { date: new Date() },
			start: { type: "DATE", date: startTime },
			end: { type: "DATE", date: endDateNextDay },
			summary: `🎵 ${performance.name}`,
			description: descriptionParts.join("\n"),
			location: performance.stage.name,
		};
	}

	return {
		uid: performance.id,
		stamp: { date: new Date() },
		start: { date: startTime },
		end: { date: endTime },
		summary: `🎵 ${performance.name}`,
		description: descriptionParts.join("\n"),
		location: performance.stage.name,
	};
}
