export type Weekend = "W1" | "W2";

export interface TomorrowlandArtist {
	id: string;
	name: string;
	image: string;
}

export interface TomorrowlandStage {
	id: string;
	name: string;
}

export interface TomorrowlandPerformance {
	id: string;
	name: string;
	artists: TomorrowlandArtist[];
	stage: TomorrowlandStage;
	date: string;
	day: string;
	startTime: string;
	endTime: string;
}

export interface TomorrowlandApiResponse {
	performances: TomorrowlandPerformance[];
}

export interface TomorrowlandStageInfo {
	id: string;
	name: string;
	hosts: Record<string, string>;
	mtba: boolean;
	more_to_be_announced: Record<string, boolean>;
}

export interface TomorrowlandStagesResponse {
	stages: TomorrowlandStageInfo[];
}

export interface TomorrowlandQueryParams {
	weekend: Weekend;
	artists?: string[];
	stages?: string[];
}
