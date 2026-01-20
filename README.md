# Livecal

This is a super minimal server that ports external apis to a simple webcal endpoints.

# Structure

- Dockerized in a minimal image.
- Typescript backend using `bun`.
- Uses packages [`ts-ics`](https://raw.githubusercontent.com/Neuvernetzung/ts-ics/refs/heads/master/packages/ts-ics/README.md) to create webcal format and [`hono`](https://hono.dev/llms-small.txt) for serving webcal endpoints.
- Tests using [`vitest`](https://vitest.dev/guide/)
- Formatting using [`biome`](https://biomejs.dev/guides/getting-started/) and runs format, lint and import organizing on commit using [`husky`](https://typicode.github.io/husky/get-started.html).

# Features

- Caches responses on disk, updates every hour (Can be adjusted with CRON schedule in env variables).
- Starts all titles with emojis for representing event type and ✅ for completed events.

# Integrations

- IBU - [IBU.md](IBU.md)

> More coming soon...
