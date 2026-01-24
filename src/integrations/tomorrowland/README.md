# Tomorrowland Integration

Calendar integration for [Tomorrowland](https://www.tomorrowland.com/) festival performances.

## Endpoints

### Main Endpoint

```
GET /api/tomorrowland/lineup.ics
```

### Options Endpoint

```
GET /api/tomorrowland/options?type={type}&weekend={weekend}
```

Returns available artists and stages for a given weekend to populate multi-select dropdowns.

**Query Parameters:**
- `type` (required): `artists` or `stages`
- `weekend` (required): `W1` or `W2`

**Response:**
```json
{
  "options": [
    { "value": "Artist Name", "label": "Artist Name" },
    ...
  ]
}
```

## Parameters

| Parameter | Required | Values | Description |
| --------- | -------- | ------ | ----------- |
| `weekend` | Yes | `W1`, `W2` | Festival weekend (W1 = Weekend 1, W2 = Weekend 2) |
| `artist` | No | comma separated string | Filter by artist names (comma-separated, case-insensitive match) |
| `stage` | No | comma separated string | Filter by stage names (comma-separated, case-insensitive match) |

### Web UI

The web interface provides searchable multi-select dropdowns for artists and stages, populated dynamically based on the selected weekend. Options are fetched from the `/api/tomorrowland/options` endpoint when a weekend is selected, and selections are automatically updated in the subscription URL.

## Calendar Events

Each performance creates a calendar event with:

- **Summary**: Artist/performance name with music emoji (e.g., `🎵 DVBBS`)
- **Location**: Stage name (e.g., `PLANAXIS`)
- **Description**: List of artists performing, stage host info
- **Start/End time**: Exact performance times with timezone

## Data Source

All data is fetched from the Tomorrowland artist lineup CDN. The API token is `9205196e-3eef-45c0-a82e-72aa1bb3cf8f`.

### API Endpoints

| Endpoint | URL Pattern | Description |
| -------- | ----------- | ----------- |
| Config | `config-TL26BE-{token}.json` | Festival configuration and weekend dates |
| Stages | `stages-TL26BE-{token}.json` | All stages with hosts per date |
| Performances | `TL26BE-{weekend}-{token}.json` | Performances for W1 or W2 |

Base URL: `https://artist-lineup-cdn.tomorrowland.com/`

### Config Response

```json
{
  "config": {
    "weekends": [
      {
        "name": "W1",
        "startDate": "2026-07-16 12:00",
        "endDate": "2026-07-20 01:00"
      },
      {
        "name": "W2",
        "startDate": "2026-07-23 12:00",
        "endDate": "2026-07-27 01:00"
      }
    ],
    "withTimetable": false
  }
}
```

### Stages Response

```json
{
  "stages": [
    {
      "id": "2643200378",
      "name": "MAINSTAGE",
      "hosts": {},
      "mtba": false,
      "more_to_be_announced": {
        "2026-07-17": true,
        "2026-07-19": true
      }
    },
    {
      "id": "2643140430",
      "name": "THE ROSE GARDEN",
      "hosts": {
        "2026-07-17": "HOSTED BY RAMPAGE",
        "2026-07-18": "HOSTED BY BONZAI",
        "2026-07-19": "HOSTED BY SUB ZERO PROJECTS & FRIENDS"
      },
      "mtba": false,
      "more_to_be_announced": {
        "2026-07-17": true,
        "2026-07-18": false
      }
    }
  ]
}
```

### Performances Response

```json
{
  "performances": [
    {
      "id": "2658072650",
      "name": "DVBBS",
      "artists": [
        {
          "id": "1358428583",
          "name": "DVBBS",
          "image": "https://artist-lineup-cdn.tomorrowland.com/53776026-BREATHE9490.jpg"
        }
      ],
      "stage": {
        "id": "2643140614",
        "name": "PLANAXIS"
      },
      "date": "2026-07-18",
      "day": "SATURDAY",
      "startTime": "2026-07-18 12:00:00+02:00",
      "endTime": "2026-07-18 12:01:00+02:00"
    }
  ]
}
```

## Implementation Notes

### Data Fetching

1. **Performances**: Fetch from `TL26BE-{weekend}-{token}.json` based on weekend parameter
2. **Stages** (optional): Fetch from `stages-TL26BE-{token}.json` to get host information per date

### Calendar Building

For each performance:
- `uid`: Use performance `id`
- `start`: Parse `startTime` (format: `YYYY-MM-DD HH:mm:ss+02:00`)
- `end`: Parse `endTime`
- `summary`: `🎵 {performance.name}`
- `location`: `{performance.stage.name}`
- `description`: Join artist names, optionally include stage host for that date

### Filtering

- **Artist filter**: Match against `performance.name` or any `artist.name` (case-insensitive, partial match)
- **Stage filter**: Match against `performance.stage.name` (case-insensitive, partial match)
- Multiple filters are comma-separated and OR'd within each category, AND'd between categories
