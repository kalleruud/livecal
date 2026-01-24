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

| Document | Description |
| -------- | ----------- |
| [Server & Routing](docs/server.md) | HTTP server and request routing |
| [Caching](docs/cache.md) | Disk-based response caching |
| [Scheduler](docs/scheduler.md) | CRON-based cache refresh |

## Integrations

Each integration lives in its own folder under `src/integrations/` with its own README.

| Integration | Endpoint | Documentation |
| ----------- | -------- | ------------- |
| IBU Biathlon World Cup | `/api/ibu/wc.ics` | [src/integrations/ibu/README.md](src/integrations/ibu/README.md) |
| Tomorrowland | `/api/tomorrowland/lineup.ics` | [src/integrations/tomorrowland/README.md](src/integrations/tomorrowland/README.md) |

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
│   │   ├── interface.ts            # IntegrationService interface
│   │   │
│   │   ├── ibu/                    # IBU Biathlon integration
│   │   │   ├── README.md           # Integration documentation
│   │   │   ├── types.ts            # API response types
│   │   │   ├── service.ts          # IntegrationService implementation
│   │   │   ├── api.ts              # External API client
│   │   │   ├── calendar.ts         # ICS calendar builder
│   │   │   └── duration.ts         # Event duration estimation
│   │   │
│   │   └── tomorrowland/           # Tomorrowland integration
│   │       ├── README.md           # Integration documentation
│   │       ├── types.ts            # API response types
│   │       ├── service.ts          # IntegrationService implementation
│   │       ├── api.ts              # External API client
│   │       └── calendar.ts         # ICS calendar builder
│   │
│   └── static/                     # Static files (homepage, etc.)
│
└── tests/
    ├── ibu-calendar.test.ts        # IBU calendar output tests
    ├── tomorrowland-calendar.test.ts # Tomorrowland calendar output tests
    └── tomorrowland-options.test.ts  # Tomorrowland options endpoint tests
```

## Integration Interface

All integrations implement the same interface, making it easy to add new calendar sources.

### Interface Definition (`src/integrations/interface.ts`)

```typescript
import type { IcsCalendar } from 'ts-ics'

export interface IntegrationConfig {
  id: string
  name: string
  basePath: string
  cacheCron?: string
}

export interface QueryParams {
  [key: string]: string | boolean | undefined
}

export type RouteHandler = (req: Request) => Response | Promise<Response>

export interface Route {
  path: string
  handler: RouteHandler
}

export interface IntegrationService {
  readonly config: IntegrationConfig
  getCalendar(params: QueryParams): Promise<IcsCalendar>
  getRoutes(): Route[]
  validateParams(params: QueryParams): string | null
  getCacheKey(params: QueryParams): string
}
```

### Adding a New Integration

1. Create a new folder under `src/integrations/`:

```
src/integrations/
└── myservice/
    ├── README.md       # Integration documentation
    ├── types.ts        # API response types
    ├── service.ts      # IntegrationService implementation
    ├── api.ts          # External API client
    └── calendar.ts     # ICS calendar builder
```

2. Implement the service (`service.ts`):

```typescript
import type { IcsCalendar } from 'ts-ics'
import { generateIcsCalendar } from 'ts-ics'
import * as cache from '../../server/cache.ts'
import type {
  IntegrationConfig,
  IntegrationService,
  QueryParams,
  Route,
} from '../interface.ts'
import { fetchData } from './api.ts'
import { buildCalendar } from './calendar.ts'

const config: IntegrationConfig = {
  id: 'myservice',
  name: 'My Service',
  basePath: '/api/myservice',
}

export class MyServiceIntegration implements IntegrationService {
  readonly config = config

  async getCalendar(params: QueryParams): Promise<IcsCalendar> {
    const data = await fetchData(params)
    return buildCalendar(data)
  }

  getRoutes(): Route[] {
    return [
      {
        path: `${this.config.basePath}/calendar.ics`,
        handler: async (req: Request) => {
          const url = new URL(req.url)
          const params = Object.fromEntries(url.searchParams)

          const error = this.validateParams(params)
          if (error) {
            return new Response(error, { status: 400 })
          }

          const cacheKey = this.getCacheKey(params)
          let icsContent = await cache.get(cacheKey)

          if (!icsContent) {
            const calendar = await this.getCalendar(params)
            icsContent = generateIcsCalendar(calendar)
            await cache.set(cacheKey, icsContent)
          }

          return new Response(icsContent, {
            headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
          })
        },
      },
    ]
  }

  validateParams(params: QueryParams): string | null {
    // Return error message if invalid, null if valid
    return null
  }

  getCacheKey(params: QueryParams): string {
    return `myservice-calendar.ics`
  }
}
```

3. Register the integration (`src/integrations/index.ts`):

```typescript
import { IBUIntegration } from './ibu/service.ts'
import { MyServiceIntegration } from './myservice/service.ts'
import type { IntegrationService, Route } from './interface.ts'

export const integrations: IntegrationService[] = [
  new IBUIntegration(),
  new MyServiceIntegration(),
]

export function getAllRoutes(): Route[] {
  return integrations.flatMap((integration) => integration.getRoutes())
}
```

4. Add tests for the calendar output in `tests/myservice-calendar.test.ts`

5. Update this README with the new integration endpoint

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

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `bun run dev`     | Start development server with hot reload |
| `bun run start`   | Start production server                  |
| `bun test`        | Run tests                                |
| `bun test --watch`| Run tests in watch mode                  |
| `bun run lint`    | Run Biome linter                         |
| `bun run format`  | Format code with Biome                   |

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
      - "6699:6699"
    environment:
      - PORT=6699
      - HOST=0.0.0.0
      - CACHE_DIR=/app/cache
      - CACHE_CRON=0 * * * *
      - LOG_LEVEL=info
    volumes:
      - livecal-cache:/app/cache
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6699/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  livecal-cache:
```
