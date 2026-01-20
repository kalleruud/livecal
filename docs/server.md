# Server & Routing

The server uses Bun's built-in HTTP server (`Bun.serve`) to handle requests.

## Entry Point

`src/index.ts` starts the server with configuration from environment variables:

- `PORT` - Server port (default: 6699)
- `HOST` - Server host (default: 0.0.0.0)

## Router

`src/server/router.ts` handles request routing.

### How It Works

1. Collects routes from all registered integrations
2. Matches incoming requests against registered paths
3. Returns 404 for unmatched routes

### Endpoints

| Path | Description |
| ---- | ----------- |
| `/health` | Health check endpoint |
| `/api/{integration}/*.ics` | Calendar endpoints from integrations |

### Adding Routes

Routes are defined by integrations via the `getRoutes()` method. Each route has:

- `path` - URL path to match
- `handler` - Function that receives `Request` and returns `Response`
