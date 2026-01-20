# Caching

The cache stores generated calendars on disk to reduce external API calls.

## Configuration

- `CACHE_DIR` - Directory for cached files (default: `./cache`)

## How It Works

1. When a calendar is requested, check if a cached version exists
2. If cached, return the cached content
3. If not cached, fetch from external API, store result, and return

## Cache Keys

Each integration generates cache keys via `getCacheKey(params)`. Keys are based on:

- Integration ID
- Query parameters

## File Structure

```
cache/
├── ibu-wc.ics
└── {integration}-{params}.ics
```

## Cache Invalidation

Caches are refreshed by the scheduler on a CRON schedule. Manual invalidation can be done by deleting files from the cache directory.
