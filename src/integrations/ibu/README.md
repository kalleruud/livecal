# IBU Biathlon World Cup Integration

## Overview

Fetches data from [IBU Biathlon World Cup](https://www.biathlonworld.com/calendar) API and exposes webcal endpoints.

**Endpoint:** `webcal://<origin>/api/ibu/wc.ics`

## Features

- Fetches all competitions for each Event
- Each competition is converted into a calendar event
- Updates description with top 10 results when available
- Event titles prefixed with emojis based on discipline and gender
- Completed events marked with ✅

## Query Parameters

All parameters are optional.

| Parameter      | Type    | Default | Description                              |
| -------------- | ------- | ------- | ---------------------------------------- |
| `season`       | string  | all     | Season ID (e.g., `2526` for 2025/2026)   |
| `gender`       | string  | both    | Filter by gender: `M` or `W`.            |
| `includeEvents`| boolean | false   | Include parent events as calendar events |
| `includeComps` | boolean | true    | Include competitions as calendar events  |

> **Note:** Returns `400 Bad Request` if both `includeEvents` and `includeComps` are `false`.

### Season ID Format

Season IDs follow the pattern `<start-year-2-digit><end-year-2-digit>`:
- `2425` = 2024/2025 season
- `2526` = 2025/2026 season

### Example Requests

```bash
# Default: All seasons, both genders, competitions only
curl "http://localhost:3000/api/ibu/wc.ics"

# Specific season
curl "http://localhost:3000/api/ibu/wc.ics?season=2526"

# Women only
curl "http://localhost:3000/api/ibu/wc.ics?gender=W"

# Include events, exclude competitions
curl "http://localhost:3000/api/ibu/wc.ics?includeEvents=true&includeComps=false"

# Get JSON response
curl -H "Content-Type: application/json; charset=utf-8" \
  "http://localhost:3000/api/ibu/wc.ics"
```

## Generated Calendar Event URLs

- **Event:** `https://www.biathlonworld.com/calendar?CupLevel=1&SeasonId=2526&EventId=BT2526SWRLCP06`
- **Competition:** `https://www.biathlonworld.com/results/<CompetitionId>`

## Emoji Mapping

| Emoji | Meaning                |
| ----- | ---------------------- |
| 🎿    | Sprint                 |
| 🏃    | Pursuit                |
| 🎯    | Individual             |
| 👥    | Mass Start             |
| 🔄    | Relay                  |
| 🏆    | Championship           |
| ♂️    | Men's event            |
| ♀️    | Women's event          |
| ✅    | Completed (has results)|

### Events

- URL: [`https://bw.biathlonresults.com/modules/sportapi/api/Events?SeasonId=2526`](https://bw.biathlonresults.com/modules/sportapi/api/Events?SeasonId=2526)

- Output:

  ```json
  [
    {
      "SeasonId": "2526",
      "Trimester": "2",
      "EventId": "BT2526JCEUCH__",
      "StartDate": "2026-01-19T12:00:00Z",
      "EndDate": "2026-01-25T12:00:00Z",
      "FirstCompetitionDate": "2026-01-21T08:30:00Z",
      "Description": "IBU Junior Open European Championships",
      "EventSeriesNr": "  ",
      "ShortDescription": "Imatra",
      "Altitude": "102",
      "OrganizerId": "IMA",
      "Organizer": "Imatra",
      "OrganizerColor": "#009CD9",
      "Nat": "FIN",
      "NatLong": "Finland",
      "MedalSetId": "BT2526JCEUCH__",
      "EventClassificationId": "BTJCEUCH",
      "Level": 3,
      "UTCOffset": 2,
      "IsActual": true,
      "IsCurrent": false,
      "EventStatusId": 0,
      "EventStatus": "",
      "Notes": "",
    },
    {
      // Etc...
    }
  ]
  ```

### Competitions

- URL: [`https://bw.biathlonresults.com/modules/sportapi/api/Competitions?EventId=BT2526SWRLCP06&Language=EN`](https://bw.biathlonresults.com/modules/sportapi/api/Competitions?EventId=BT2526SWRLCP06&Language=EN)

- Output:
  ```json
  [
    {
      "RaceId": "BT2526SWRLCP06SMSI",
      "km": "15",
      "catId": "SM",
      "DisciplineId": "SI",
      "StatusId": 1,
      "StatusText": "Scheduled",
      "ScheduleStatus": "SCHEDULED",
      "ResultStatus": "NONE",
      "HasLiveData": false,
      "IsLive": false,
      "StartTime": "2026-01-22T17:15:00Z",
      "Description": "Men 15km Short Individual",
      "ShortDescription": "Men 15km Short Individual",
      "Location": "Vysocina Arena",
      "ResultsCredit": null,
      "TimingCredit": null,
      "HasAnalysis": false,
      "StartMode": "I",
      "NrShootings": 4,
      "NrSpareRounds": 0,
      "HasSpareRounds": false,
      "PenaltySeconds": 45,
      "NrLegs": 0,
      "ShootingPositions": "PSPS",
      "LocalUTCOffset": 1,
      "RSC": "BTHM15KMIS------------FNL-000100--",
      "GenderOrder": null
    },
    {
      // Etc...
    }
  ]
  ```

### Results

- URL: [`https://bw.biathlonresults.com/modules/sportapi/api/Results?RaceId=BT2526SWRLCP05SMPU&Language=en`](https://bw.biathlonresults.com/modules/sportapi/api/Results?RaceId=BT2526SWRLCP05SMPU&Language=en)
- Only fetched when `Competition.StatusId >= 10` (indicates results are available)

- Output:
  ```json
  {
    "RaceId": "BT2526SWRLCP05SMPU",
    "IsStartList": false,
    "IsResult": true,
    "Competition": {
      "RaceId": "BT2526SWRLCP05SMPU",
      "km": "12.5",
      "catId": "SM",
      "DisciplineId": "PU",
      "StatusId": 11,
      "StatusText": "Final",
      "ScheduleStatus": null,
      "ResultStatus": null,
      "HasLiveData": false,
      "IsLive": false,
      "StartTime": "2026-01-18T14:00:00Z",
      "Description": "Men 12.5 km Pursuit Competition",
      "ShortDescription": "Men 12.5 km Pursuit",
      "Location": "Chiemgau Arena",
      "ResultsCredit": null,
      "TimingCredit": null,
      "HasAnalysis": true,
      "StartMode": null,
      "NrShootings": 4,
      "NrSpareRounds": 0,
      "HasSpareRounds": false,
      "PenaltySeconds": 0,
      "NrLegs": 0,
      "ShootingPositions": null,
      "LocalUTCOffset": 1,
      "RSC": null,
      "GenderOrder": null
    },
    "SportEvt": {
      "SeasonId": "2526",
      "Trimester": null,
      "EventId": "BT2526SWRLCP05",
      "StartDate": "2026-01-12T12:00:00Z",
      "EndDate": "2026-01-18T12:00:00Z",
      "FirstCompetitionDate": null,
      "Description": "BMW IBU World Cup Biathlon",
      "EventSeriesNr": null,
      "ShortDescription": "Ruhpolding",
      "Altitude": null,
      "OrganizerId": "RUH",
      "Organizer": "Ruhpolding",
      "OrganizerColor": null,
      "Nat": "GER",
      "NatLong": null,
      "MedalSetId": null,
      "EventClassificationId": "BTSWRLCP",
      "Level": 1,
      "UTCOffset": 1,
      "IsActual": false,
      "IsCurrent": null,
      "EventStatusId": 0,
      "EventStatus": null,
      "Notes": null
    },
    "Results": [
      {
        "StartOrder": 10,
        "ResultOrder": 1,
        "IRM": null,
        "IBUId": "BTNOR12305199701",
        "IsTeam": false,
        "Name": "DALE-SKJEVDAL Johannes",
        "ShortName": "DALE-SKJEVDAL J.",
        "FamilyName": "DALE-SKJEVDAL",
        "GivenName": "Johannes",
        "Nat": "NOR",
        "Bib": "10",
        "Leg": null,
        "Rank": "1",
        "Shootings": "0+0+1+0",
        "ShootingTotal": "1",
        "RunTime": null,
        "TotalTime": "30:23.9",
        "WC": "90",
        "NC": null,
        "NOC": null,
        "StartTime": null,
        "StartInfo": "0:54",
        "StartRow": 0,
        "StartLane": 2,
        "BibColor": null,
        "Behind": "0.0",
        "StartGroup": null,
        "TeamId": null,
        "PursuitStartDistance": 378,
        "Result": "30:23.9",
        "LegRank": null,
        "TeamRankAfterLeg": null,
        "StartConfirmed": null,
        "ParaSportClass": null,
        "ParaPercentage": null,
        "ParaDeltaTime": null,
        "ParaGuideName": null,
        "ParaRealTime": null
      },
      {
        // Etc...
      }
    ]
  }
  ```

## Implementation Notes

### Service Implementation

```typescript
// src/integrations/ibu/service.ts
import type { VCalendar } from "ts-ics";
import type {
  IntegrationConfig,
  IntegrationService,
  QueryParams,
  Route,
} from "../interface";
import { fetchEvents, fetchCompetitions, fetchResults } from "./api";
import { buildCalendar } from "./calendar";

const config: IntegrationConfig = {
  id: "ibu",
  name: "IBU Biathlon World Cup",
  basePath: "/api/ibu",
};

export class IBUIntegration implements IntegrationService {
  readonly config = config;

  async getCalendar(params: QueryParams): Promise<VCalendar> {
    const seasons = params.season ? [params.season as string] : await this.getAvailableSeasons();
    const events = await fetchEvents(seasons);
    const competitions = await fetchCompetitions(events, params.gender as string);
    const results = await fetchResults(competitions);

    return buildCalendar(events, competitions, results, params);
  }

  getRoutes(): Route[] {
    return [
      {
        path: `${this.config.basePath}/wc.ics`,
        handler: async (req: Request) => {
          const url = new URL(req.url);
          const params = this.parseParams(Object.fromEntries(url.searchParams));

          const error = this.validateParams(params);
          if (error) {
            return new Response(error, { status: 400 });
          }

          const calendar = await this.getCalendar(params);
          const contentType = req.headers.get("Content-Type");

          if (contentType?.includes("application/json")) {
            return Response.json(calendar);
          }
          return new Response(calendar.toString(), {
            headers: { "Content-Type": "text/calendar; charset=utf-8" },
          });
        },
      },
    ];
  }

  validateParams(params: QueryParams): string | null {
    if (params.includeEvents === false && params.includeComps === false) {
      return "At least one of includeEvents or includeComps must be true";
    }
    if (params.gender && !["M", "W"].includes(params.gender as string)) {
      return "Gender must be 'M' or 'W'";
    }
    return null;
  }

  getCacheKey(params: QueryParams): string {
    const season = params.season || "all";
    const gender = params.gender || "both";
    return `ibu-wc-${season}-${gender}`;
  }

  private parseParams(query: Record<string, string>): QueryParams {
    return {
      season: query.season,
      gender: query.gender,
      includeEvents: query.includeEvents === "true",
      includeComps: query.includeComps !== "false", // default true
    };
  }

  private async getAvailableSeasons(): Promise<string[]> {
    // Return current and previous season
    const now = new Date();
    const year = now.getFullYear() % 100;
    const month = now.getMonth();
    // Season starts in October
    const currentSeason = month >= 9 ? `${year}${year + 1}` : `${year - 1}${year}`;
    const prevSeason = month >= 9 ? `${year - 1}${year}` : `${year - 2}${year - 1}`;
    return [prevSeason, currentSeason];
  }
}
```

### TypeScript Types

```typescript
// src/integrations/ibu/types.ts

interface IBUEvent {
  SeasonId: string;
  EventId: string;
  StartDate: string;
  EndDate: string;
  FirstCompetitionDate: string | null;
  Description: string;
  ShortDescription: string; // Location name
  Organizer: string;
  Nat: string;
  NatLong: string;
  EventClassificationId: string;
  Level: number; // 1 = World Cup
  UTCOffset: number;
  IsActual: boolean;
  IsCurrent: boolean;
}

interface IBUCompetition {
  RaceId: string;
  km: string;
  catId: "SM" | "SW" | "MX"; // Men, Women, Mixed
  DisciplineId: "SP" | "PU" | "IN" | "SI" | "MS" | "RL" | "SR";
  StatusId: number;
  StatusText: string;
  StartTime: string;
  Description: string;
  ShortDescription: string;
  Location: string;
  LocalUTCOffset: number;
}

interface IBUResult {
  ResultOrder: number;
  Name: string;
  ShortName: string;
  Nat: string;
  Rank: string;
  Shootings: string;
  TotalTime: string;
  Behind: string;
}

interface IBUResultsResponse {
  RaceId: string;
  IsResult: boolean;
  Competition: IBUCompetition;
  SportEvt: IBUEvent;
  Results: IBUResult[];
}
```

### Discipline Codes

| Code | Discipline       |
| ---- | ---------------- |
| SP   | Sprint           |
| PU   | Pursuit          |
| IN   | Individual       |
| SI   | Short Individual |
| MS   | Mass Start       |
| RL   | Relay            |
| SR   | Single Mixed Relay |

### Category Codes

| Code | Category    |
| ---- | ----------- |
| SM   | Senior Men  |
| SW   | Senior Women|
| MX   | Mixed       |

### Event Levels

| Level | Description           |
| ----- | --------------------- |
| 1     | World Cup             |
| 2     | IBU Cup               |
| 3     | Junior Championships  |
| 4     | Other                 |

### Caching Strategy

1. Cache key: `ibu-wc-{seasonId}.json`
2. Cache location: `$CACHE_DIR/ibu/`
3. Update frequency: Configured via `CACHE_CRON` environment variable
4. Cache invalidation: Automatic on CRON schedule

### Data Flow

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  IBU Events API │────▶│ Cache Layer  │────▶│ Calendar Builder│
└─────────────────┘     └──────────────┘     └─────────────────┘
         │                                            │
         ▼                                            ▼
┌─────────────────┐                          ┌─────────────────┐
│ IBU Competitions│                          │   ICS Output    │
│      API        │                          │  (via ts-ics)   │
└─────────────────┘                          └─────────────────┘
         │
         ▼
┌─────────────────┐
│ IBU Results API │
│  (if available) │
└─────────────────┘
```

### Error Handling

| HTTP Status | Condition                                  |
| ----------- | ------------------------------------------ |
| 200         | Success                                    |
| 400         | Invalid parameters (e.g., both flags false)|
| 404         | Season not found                           |
| 502         | IBU API unavailable                        |
| 503         | Service temporarily unavailable            |
