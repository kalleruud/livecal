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

Livecal converts external APIs into webcal/ICS calendar subscriptions. Each external service is implemented as a declarative "integration".

## Key Files

- `src/integrations/framework/` - Declarative integration framework
  - `types.ts` - `CalendarIntegration` type definition
  - `params.ts` - Parameter schema types and validation
  - `handlers.ts` - Route handlers (calendar, options endpoints)
  - `register.ts` - `createIntegration()` factory function
- `src/integrations/index.ts` - Registry where all integrations are registered
- `src/server/cache.ts` - Disk caching for API responses
- `src/server/scheduler.ts` - CRON-based cache refresh

## Adding a New Integration

1. Create folder `src/integrations/{name}/`
2. Required files:
   - `types.ts` - TypeScript types for the external API responses
   - `api.ts` - Functions to fetch data from the external API
   - `events.ts` - Pure functions to transform API data into `IcsEvent[]`
   - `definition.ts` - Declarative integration using `createIntegration()`
   - `README.md` - Documentation for this integration
3. Register in `src/integrations/index.ts`
4. Add tests in `tests/{name}-calendar.test.ts`
5. Update main `README.md` integrations table

## Integration Definition

Integrations are declarative - define **what** you need, not how to do it:

```typescript
import { createIntegration } from '../framework/index.ts'
import { fetchData } from './api.ts'
import { dataToEvent } from './events.ts'

export default createIntegration<MyData, MyParams>({
  id: 'myservice',
  name: 'My Service',

  calendar: {
    prodId: '-//Livecal//My Service//EN',
    name: 'My Service Calendar',
  },

  endpoint: 'calendar.ics',

  params: {
    filter: { type: 'text', label: 'Filter' },
    category: {
      type: 'select',
      label: 'Category',
      options: [{ value: 'all', label: 'All' }],
    },
    enabled: { type: 'checkbox', label: 'Enabled', default: true },
  },

  fetchData: async params => fetchData(params),
  toEvents: (data, params) => data.map(dataToEvent),
})
```

## Parameter Types

| Type             | Description        | Key Options                           |
| ---------------- | ------------------ | ------------------------------------- |
| `text`           | Text input         | `required`, `placeholder`, `validate` |
| `select`         | Single dropdown    | `required`, `options`, `validate`     |
| `checkbox`       | Boolean toggle     | `default`                             |
| `dynamic-select` | Async multi-select | `dependsOn`, `fetchOptions`           |

## Testing Guidelines

- Tests should focus on the final ICS calendar output
- Test the `toEvents()` function directly with mock data
- Also test via the legacy `buildCalendar()` wrapper if present
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

- API responses are cached automatically via `src/server/cache.ts`
- Use the `request()` helper from cache.ts in your `api.ts` files
- The scheduler auto-refreshes caches based on CRON schedule
