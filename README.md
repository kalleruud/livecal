# Livecal

This is a super minimal server that ports external APIs to simple webcal endpoints.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh/) - Fast TypeScript runtime with built-in HTTP server
- **Calendar:** [ts-ics](https://github.com/Neuvernetzung/ts-ics) - ICS/WebCal format generation
- **Testing:** [Bun test](https://bun.sh/docs/cli/test) - Built-in test runner
- **Linting/Formatting:** [Biome](https://biomejs.dev/) - Fast formatter and linter
- **Git Hooks:** [Husky](https://typicode.github.io/husky/) - Git hooks made easy

## Features

- Caches responses on disk, updates every hour (configurable via CRON schedule in env variables)
- Event titles prefixed with emojis representing event type
- Completed events marked with ✅

## Documentation

Feature specifications and design documents live in the `docs/` folder.

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

> More coming soon...

See [Adding a New Integration](#adding-a-new-integration) for how to create new integrations.

## File Structure

```
livecal/
├── docs/                          # Feature documentation
│   └── *.md                       # Detailed feature specifications
├── src/
│   ├── index.ts                    # Application entry point (Bun.serve)
│   │
│   ├── server/                     # Server setup and core functionality
│   │   ├── router.ts               # Route definitions and request handling
│   │   ├── cache.ts                # Disk caching logic
│   │   └── scheduler.ts            # CRON scheduler for cache updates
│   │
│   ├── integrations/               # All calendar integrations
│   │   ├── index.ts                # Integration registry and loader
│   │   ├── interface.ts            # Common interface all services implement
│   │   │
│   │   └── ibu/                    # IBU Biathlon integration
│   │       ├── README.md           # Integration-specific documentation
│   │       ├── types.ts            # IBU API response types
│   │       ├── service.ts          # Implements IntegrationService interface
│   │       ├── api.ts              # IBU API client
│   │       └── calendar.ts         # IBU-specific calendar event builder
│   │
│   └── shared/                     # Shared utilities
│       ├── types.ts                # Common types (CalendarEvent, etc.)
│       ├── calendar.ts             # ts-ics wrapper utilities
│       └── date.ts                 # Date formatting helpers
│
├── tests/
│   ├── setup.ts                    # Test setup and global mocks
│   ├── server/
│   │   └── cache.test.ts           # Cache service tests
│   └── integrations/
│       └── ibu/
│           ├── service.test.ts     # IBU service tests
│           └── api.test.ts         # IBU API client tests
│
├── cache/                          # Cached responses (gitignored)
├── .husky/
│   └── pre-commit                  # Pre-commit hook script
├── biome.json                      # Biome configuration
├── tsconfig.json                   # TypeScript configuration
├── Dockerfile                      # Production Docker image
├── docker-compose.yml              # Docker Compose setup
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies and scripts
├── bun.lock                        # Bun lockfile
└── README.md                       # This file
```

## Integration Interface

All integrations implement the same interface, making it easy to add new calendar sources.

### Interface Definition (`src/integrations/interface.ts`)

```typescript
import type { VCalendar } from "ts-ics";

/**
 * Configuration for an integration
 */
export interface IntegrationConfig {
  /** Unique identifier for this integration */
  id: string;
  /** Display name */
  name: string;
  /** Base path for routes (e.g., "/api/ibu") */
  basePath: string;
  /** CRON expression for cache updates */
  cacheCron?: string;
}

/**
 * Query parameters parsed from the request
 */
export interface QueryParams {
  [key: string]: string | boolean | undefined;
}

/**
 * Route handler function type
 */
export type RouteHandler = (req: Request) => Response | Promise<Response>;

/**
 * Route definition for an integration
 */
export interface Route {
  path: string;
  handler: RouteHandler;
}

/**
 * All integration services must implement this interface
 */
export interface IntegrationService {
  /** Integration configuration */
  readonly config: IntegrationConfig;

  /**
   * Fetch data from external API and return calendar events
   * @param params - Query parameters from the request
   * @returns Promise resolving to a VCalendar object
   */
  getCalendar(params: QueryParams): Promise<VCalendar>;

  /**
   * Get routes for this integration
   * @returns Array of route definitions
   */
  getRoutes(): Route[];

  /**
   * Validate query parameters
   * @returns null if valid, error message if invalid
   */
  validateParams(params: QueryParams): string | null;

  /**
   * Get cache key for the given parameters
   * Used for disk caching
   */
  getCacheKey(params: QueryParams): string;
}
```

### Adding a New Integration

1. Create a new folder under `src/integrations/`:

```
src/integrations/
└── myservice/
    ├── README.md       # Documentation for this integration
    ├── types.ts        # API response types
    ├── service.ts      # Implements IntegrationService
    ├── api.ts          # External API client
    └── calendar.ts     # Calendar event builder
```

2. Implement the service (`service.ts`):

```typescript
import type { VCalendar } from "ts-ics";
import type {
  IntegrationConfig,
  IntegrationService,
  QueryParams,
  Route,
} from "../interface";
import { fetchData } from "./api";
import { buildCalendar } from "./calendar";

const config: IntegrationConfig = {
  id: "myservice",
  name: "My Service",
  basePath: "/api/myservice",
};

export class MyServiceIntegration implements IntegrationService {
  readonly config = config;

  async getCalendar(params: QueryParams): Promise<VCalendar> {
    const data = await fetchData(params);
    return buildCalendar(data);
  }

  getRoutes(): Route[] {
    return [
      {
        path: `${this.config.basePath}/calendar.ics`,
        handler: async (req: Request) => {
          const url = new URL(req.url);
          const params = Object.fromEntries(url.searchParams);

          const error = this.validateParams(params);
          if (error) {
            return new Response(error, { status: 400 });
          }

          const calendar = await this.getCalendar(params);
          return new Response(calendar.toString(), {
            headers: { "Content-Type": "text/calendar; charset=utf-8" },
          });
        },
      },
    ];
  }

  validateParams(params: QueryParams): string | null {
    // Validate parameters, return error message or null
    return null;
  }

  getCacheKey(params: QueryParams): string {
    return `myservice-${JSON.stringify(params)}`;
  }
}
```

3. Register the integration (`src/integrations/index.ts`):

```typescript
import type { IntegrationService, Route } from "./interface";
import { IBUIntegration } from "./ibu/service";
import { MyServiceIntegration } from "./myservice/service";

export const integrations: IntegrationService[] = [
  new IBUIntegration(),
  new MyServiceIntegration(),
];

export function getAllRoutes(): Route[] {
  return integrations.flatMap((integration) => integration.getRoutes());
}
```

4. Add tests under `tests/integrations/myservice/`

5. Update the main README with the new integration

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
| `bun run check`   | Run Biome check (lint + format)          |
| `bun run prepare` | Setup Husky git hooks                    |

## Testing

Tests are written using [Bun's built-in test runner](https://bun.sh/docs/cli/test) and located in the `tests/` directory.

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test tests/integrations/ibu/service.test.ts
```

### Test Structure

- **Unit tests:** Test individual functions and utilities
- **Integration tests:** Test API endpoints and service interactions
- **Mocking:** External API calls are mocked using `mock` from `bun:test`

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
