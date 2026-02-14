# Scheduler

The scheduler periodically refreshes cached calendars using CRON expressions.

## Configuration

- `CACHE_CRON` - CRON expression for refresh interval (default: `0 * * * *` - every hour)

## How It Works

1. On startup, the scheduler initializes with the configured CRON expression
2. At each scheduled time, it iterates through all integrations
3. For each integration, it fetches fresh data and updates the cache

## CRON Format

Standard CRON format with 5 fields:

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, Sunday=0)
* * * * *
```

### Examples

| Expression     | Description       |
| -------------- | ----------------- |
| `0 * * * *`    | Every hour        |
| `*/15 * * * *` | Every 15 minutes  |
| `0 0 * * *`    | Daily at midnight |
| `0 6,18 * * *` | At 6:00 and 18:00 |
