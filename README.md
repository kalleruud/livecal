# Livecal

A minimal server that converts external APIs into webcal/ICS calendar subscriptions.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh/) - Fast TypeScript runtime with built-in HTTP server
- **Calendar:** [ts-ics](https://github.com/Neuvernetzung/ts-ics) - ICS/WebCal format generation
- **Testing:** [Bun test](https://bun.sh/docs/cli/test) - Built-in test runner
- **Linting/Formatting:** [Biome](https://biomejs.dev/) - Fast formatter and linter
- **Git Hooks:** [Husky](https://typicode.github.io/husky/) - Git hooks made easy

## Features

- Disk caching with configurable CRON-based refresh
- Integration-specific query parameters for customization
- Emoji prefixes for event types
- Completed events marked with ✅

## Documentation

Feature specifications live in the `docs/` folder.

| Document                           | Description                     |
| ---------------------------------- | ------------------------------- |
| [Server & Routing](docs/server.md) | HTTP server and request routing |
| [Caching](docs/cache.md)           | Disk-based response caching     |
| [Scheduler](docs/scheduler.md)     | CRON-based cache refresh        |
| [Web UI](docs/web-ui.md)           | Subscription form interactions  |

## Integrations

Each integration lives in its own folder under `src/integrations/` with its own README.

| Integration            | Endpoint                       | Documentation                                                                      |
| ---------------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| IBU Biathlon World Cup | `/api/ibu/wc.ics`              | [src/integrations/ibu/README.md](src/integrations/ibu/README.md)                   |
| Tomorrowland           | `/api/tomorrowland/lineup.ics` | [src/integrations/tomorrowland/README.md](src/integrations/tomorrowland/README.md) |

See [Adding a New Integration](#adding-a-new-integration) for how to create new integrations.

## File Structure

```
livecal/
├── docs/                           # Feature documentation
│   ├── cache.md                    # Disk caching
│   ├── scheduler.md                # CRON scheduler
│   └── server.md                   # HTTP server & routing
│
├── src/
│   ├── index.ts                    # Application entry point (Bun.serve)
│   │
│   ├── server/                     # Server core functionality
│   │   ├── router.ts               # Route definitions and request handling
│   │   ├── cache.ts                # Disk caching logic
│   │   └── scheduler.ts            # CRON scheduler for cache updates
│   │
│   ├── integrations/               # All calendar integrations
│   │   ├── index.ts                # Integration registry
│   │   │
│   │   ├── framework/              # Declarative integration framework
│   │   │   ├── types.ts            # CalendarIntegration type
│   │   │   ├── params.ts           # ParamSchema types & validation
│   │   │   ├── handlers.ts         # Route handlers (calendar, options)
│   │   │   ├── register.ts         # createIntegration() factory
│   │   │   └── index.ts            # Public exports
│   │   │
│   │   ├── ibu/                    # IBU Biathlon integration
│   │   │   ├── README.md           # Integration documentation
│   │   │   ├── types.ts            # API response types
│   │   │   ├── definition.ts       # Declarative integration definition
│   │   │   ├── api.ts              # External API client
│   │   │   ├── events.ts           # Transform data to ICS events
│   │   │   ├── calendar.ts         # Legacy calendar builder (for tests)
│   │   │   └── duration.ts         # Event duration estimation
│   │   │
│   │   └── tomorrowland/           # Tomorrowland integration
│   │       ├── README.md           # Integration documentation
│   │       ├── types.ts            # API response types
│   │       ├── definition.ts       # Declarative integration definition
│   │       ├── api.ts              # External API client
│   │       ├── events.ts           # Transform data to ICS events
│   │       └── calendar.ts         # Legacy calendar builder (for tests)
│   │
│   └── static/                     # Static files (homepage, etc.)
│
└── tests/
    ├── ibu-calendar.test.ts        # IBU calendar output tests
    ├── tomorrowland-calendar.test.ts # Tomorrowland calendar output tests
    └── tomorrowland-options.test.ts  # Tomorrowland options endpoint tests
```

## Declarative Integration Framework

Integrations are defined declaratively - you specify **what** your integration needs, and the framework handles routing, validation, and ICS generation.

### Adding a New Integration

1. Create a new folder under `src/integrations/`:

```
src/integrations/
└── myservice/
    ├── README.md       # Integration documentation
    ├── types.ts        # API response types
    ├── definition.ts   # Declarative integration definition
    ├── api.ts          # External API client
    └── events.ts       # Transform data to ICS events
```

2. Define the integration (`definition.ts`):

```typescript
import type { IcsEvent } from 'ts-ics'
import { createIntegration } from '../framework/index.ts'
import { fetchItems } from './api.ts'
import type { MyItem, MyParams } from './types.ts'

export default createIntegration<MyItem[], MyParams>({
  // Identity
  id: 'myservice',
  name: 'My Service',

  // Calendar metadata
  calendar: {
    prodId: '-//Livecal//My Service//EN',
    name: 'My Service Calendar', // Can also be a function: (params) => `Calendar ${params.filter}`
  },

  // Endpoint: creates /api/myservice/calendar.ics
  endpoint: 'calendar.ics',

  // Parameter schema - defines validation, parsing, and UI metadata
  params: {
    filter: {
      type: 'text',
      label: 'Filter',
      placeholder: 'Enter filter text',
    },
    category: {
      type: 'select',
      label: 'Category',
      required: true,
      options: [
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active Only' },
      ],
    },
    showCompleted: {
      type: 'checkbox',
      label: 'Show Completed',
      default: false,
    },
  },

  // Fetch data from external API
  fetchData: async params => {
    return fetchItems(params.category, params.filter)
  },

  // Transform data to ICS events
  toEvents: (items, params) => {
    let filtered = items
    if (!params.showCompleted) {
      filtered = filtered.filter(item => !item.completed)
    }
    return filtered.map(item => ({
      uid: item.id,
      stamp: { date: new Date() },
      start: { date: new Date(item.date) },
      summary: item.title,
      description: item.description,
    }))
  },
})
```

3. Register in `src/integrations/index.ts`:

```typescript
import myServiceIntegration from './myservice/definition.ts'

export const integrations = [
  // ... existing integrations
  myServiceIntegration,
]
```

4. Add tests for the `toEvents` function in `tests/myservice-calendar.test.ts`

5. Update this README with the new integration endpoint

### Parameter Types

| Type             | Description            | Options                                          |
| ---------------- | ---------------------- | ------------------------------------------------ |
| `text`           | Text input             | `required`, `default`, `placeholder`, `validate` |
| `select`         | Single-select dropdown | `required`, `default`, `options`, `validate`     |
| `checkbox`       | Boolean toggle         | `default`                                        |
| `dynamic-select` | Async multi-select     | `multiple`, `dependsOn`, `fetchOptions`          |

### Framework Benefits

- **No boilerplate**: Routes, validation, and ICS generation are handled automatically
- **Type-safe**: Full TypeScript support with inferred parameter types
- **Self-documenting**: Parameter schema generates UI metadata for the frontend
- **Testable**: Pure `toEvents` function makes testing straightforward

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server
PORT=6699
HOST=0.0.0.0

# Cache
CACHE_DIR=./cache
CACHE_CRON="0 * * * *"  # Every hour (cron format)
```

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd livecal

# Install dependencies
bun install

# Setup git hooks
bun run prepare

# Copy environment variables
cp .env.example .env
```

### Scripts

| Script             | Description                              |
| ------------------ | ---------------------------------------- |
| `bun run dev`      | Start development server with hot reload |
| `bun run start`    | Start production server                  |
| `bun test`         | Run tests                                |
| `bun test --watch` | Run tests in watch mode                  |
| `bun run lint`     | Run Biome linter                         |
| `bun run format`   | Format code with Biome                   |

## Testing

Tests use [Bun's test runner](https://bun.sh/docs/cli/test) and focus on verifying the final ICS calendar output for each integration.

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test tests/ibu-calendar.test.ts
```

Test files are named `{integration}-calendar.test.ts` and test the `buildCalendar()` function output.

## Docker

### Building the Image

```bash
# Build production image
docker build -t livecal .

# Run container
docker run -p 6699:6699 livecal
```

### Dockerfile

```dockerfile
# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1-slim
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs
USER bunjs

COPY --from=builder --chown=bunjs:nodejs /app/dist ./dist
COPY --from=builder --chown=bunjs:nodejs /app/package.json ./

# Create cache directory
RUN mkdir -p /app/cache

ENV NODE_ENV=production
ENV PORT=6699

EXPOSE 6699

CMD ["bun", "run", "dist/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  livecal:
    build: .
    container_name: livecal
    restart: unless-stopped
    ports:
      - '6699:6699'
    environment:
      - PORT=6699
      - HOST=0.0.0.0
      - CACHE_DIR=/app/cache
      - CACHE_CRON=0 * * * *
      - LOG_LEVEL=info
    volumes:
      - livecal-cache:/app/cache
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:6699/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  livecal-cache:
```
