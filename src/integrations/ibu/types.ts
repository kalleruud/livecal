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

export interface IBUCompetition {
  RaceId: string
  km: string
  catId: CategoryId
  DisciplineId: DisciplineId
  StatusId: number
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
  ResultOrder: number
  IsTeam: boolean
  Name: string
  ShortName: string
  Nat: string
  Rank: string
  Shootings: string
  TotalTime: string
  Behind: string
}

export interface IBUResultsResponse {
  RaceId: string
  IsResult: boolean
  Competition: IBUCompetition
  SportEvt: IBUEvent
  Results: IBUResult[]
}

export interface IBUQueryParams {
  season?: string
  gender?: string
  includeEvents: boolean
  includeComps: boolean
}
