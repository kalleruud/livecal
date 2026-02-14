# Rules (Important)

- Always read [`README.md`](README.md)
- Always keep relevant `.md`-files in the docs folder updated, and the `README.md`-file updated with a list of doc-files.
- Verify changes with `bun test && bun run lint`
- Regularly commit changes with a one-line description using `bun run format && git stage . && git commit -m <message>`
- Always provide tests to prove implementation works.

# Use Bun

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

# Project Overview

Livecal converts external APIs into webcal/ICS calendar subscriptions. Each external service is implemented as an "integration".

## Key Files

- `src/integrations/interface.ts` - The `IntegrationService` interface all integrations implement
- `src/integrations/index.ts` - Registry where all integrations are registered
- `src/server/cache.ts` - Disk caching for generated ICS files
- `src/server/scheduler.ts` - CRON-based cache refresh

## Adding a New Integration

1. Create folder `src/integrations/{name}/`
2. Required files:
   - `types.ts` - TypeScript types for the external API responses
   - `api.ts` - Functions to fetch data from the external API
   - `calendar.ts` - `buildCalendar()` function that creates an `IcsCalendar`
   - `service.ts` - Class implementing `IntegrationService`
   - `README.md` - Documentation for this integration
3. Register in `src/integrations/index.ts`
4. Add tests in `tests/{name}-calendar.test.ts`
5. Update main `README.md` integrations table

## Testing Guidelines

- Tests should focus on the final ICS calendar output
- Test the `buildCalendar()` function directly with mock data
- Verify both the `IcsCalendar` object and generated ICS string
- Test edge cases (empty results, DNFs, start lists vs results)

## ICS Calendar Format

We use `ts-ics` for calendar generation:

```typescript
import type { IcsCalendar, IcsEvent } from 'ts-ics'
import { generateIcsCalendar } from 'ts-ics'

const calendar: IcsCalendar = {
  version: '2.0',
  prodId: '-//Livecal//My Service//EN',
  name: 'Calendar Name',
  events: [
    /* IcsEvent[] */
  ],
}

const icsString = generateIcsCalendar(calendar)
```

## Caching

- Integrations should use `cache.get()` and `cache.set()` in their route handlers
- Cache keys should be unique per parameter combination
- The scheduler auto-refreshes caches based on CRON schedule
