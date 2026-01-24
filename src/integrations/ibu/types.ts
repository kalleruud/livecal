export interface IBUEvent {
  SeasonId: string
  EventId: string
  StartDate: string
  EndDate: string
  FirstCompetitionDate: string | null
  Description: string
  ShortDescription: string
  Organizer: string
  Nat: string
  NatLong: string
  EventClassificationId: string
  Level: number
  UTCOffset: number
  IsActual: boolean
  IsCurrent: boolean
}

export type CategoryId = 'SM' | 'SW' | 'MX'
export type DisciplineId = 'SP' | 'PU' | 'IN' | 'SI' | 'MS' | 'RL' | 'SR'

export type StartMode = 'M' | 'I' | 'P' | 'H' // Mass, Interval, Pursuit, Handicap

export enum IBUCompetitionStatus {
  Scheduled = 1,
  ProvStartList = 2,
  StartList = 3,
  Final = 11,
}

export interface IBUCompetition {
  RaceId: string
  km: string
  catId: CategoryId
  DisciplineId: DisciplineId
  StatusId: IBUCompetitionStatus
  StatusText: string
  StartTime: string
  Description: string
  ShortDescription: string
  Location: string
  LocalUTCOffset: number
  NrShootings?: number
  ShootingPositions?: string // e.g., "PS" (Prone+Standing), "PPSS"
  StartMode?: StartMode
  NrLegs?: number
  PenaltySeconds?: number
  HasSpareRounds?: boolean
  NrSpareRounds?: number
}

export interface IBUResult {
  StartOrder: number
  ResultOrder: number
  IBUId: string
  IsTeam: boolean
  Name: string
  ShortName: string
  Nat: string
  Rank: string | null
  Bib: string
  Shootings: string
  TotalTime: string | null
  Behind: string | null
}

export interface IBUResultsResponse {
  RaceId: string
  IsStartList: boolean
  IsResult: boolean
  Competition: IBUCompetition
  SportEvt: IBUEvent
  Results: IBUResult[]
}

export interface IBUResultsData {
  isStartList: boolean
  results: IBUResult[]
}

export interface IBUQueryParams {
  season?: string
  gender?: string
  includeEvents: boolean
  includeComps: boolean
}
