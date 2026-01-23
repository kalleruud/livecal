# Tomorrowland Integration

Calendar integration for [Tomorrowland](https://www.tomorrowland.com/) festival performances.

## Endpoint

```
GET /api/tomorrowland/lineup.ics
```

## Parameters

| Parameter | Required | Values | Description |
| --------- | -------- | ------ | ----------- |
| `weekend` | No | `W1`, `W2` | Festival weekend (W1 = Weekend 1, W2 = Weekend 2) |
| `artist` | No | comma seperated string | Filter by artist names (case-insensitive partial match) |
| `stage` | No | comma seperated string | Filter by stage names (case-insensitive partial match) |

## Calendar Events

Each performance creates a calendar event with:

- **Summary**: Artist/performance name with music emoji
- **Location**: Stage name
- **Description**: List of artists performing
- **Start/End time**: Exact performance times

## Data Source

Data is fetched from the Tomorrowland artist lineup CDN:

```
https://artist-lineup-cdn.tomorrowland.com/TL26BE-{weekend}-{token}.json
```

### API Response Format

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

## Future Endpoints

Additional endpoints may be added for:

- Festival info (opening hours, practical info)
- Food & beverage lineup
- Activities and experiences
