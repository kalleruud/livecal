# Integrations

## [IBU Biathlon World Cup](https://www.biathlonworld.com/calendar)

Fetches data from api and exposes webcal on server `webcal://<origin>/api/ibu/wc.ics`

- Fetches all competitions on each Event.
- Each competition is converted into a calendar event.
- Include header `Content-Type: application/json; charset=utf-8` to get JSON.
- Optinal parameters:
  - Season (defaults to all available seasons).
  - Men/Women (Default: Both)
  - Flag for returning Events as calendar event (Default: `false`)
  - Flag for returning Competitions as calendar event. (Default: `true`)
  > Returns bad request if both flags are `false`.
- Season ids are formattes as `<startyear><endyear>`, e.g. `2425` and `2526`
- Updates description with top 10 if result is available.
- URL is generated for each calendar event:
  - Event `https://www.biathlonworld.com/calendar?CupLevel=1&SeasonId=2526&EventId=BT2526SWRLCP06`
  - Competition `https://www.biathlonworld.com/results/<CompetitionId>`

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
