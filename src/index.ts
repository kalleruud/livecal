import { getAllRoutes } from './integrations/index.ts'
import * as cache from './server/cache.ts'
import { addRoute, handleRequest } from './server/router.ts'
import * as scheduler from './server/scheduler.ts'

for (const route of getAllRoutes()) {
  addRoute(route)
}

scheduler.start(async () => {
  console.log('Scheduled cache invalidation triggered')
  await cache.clear()
})

const port = Number(process.env.PORT) || 6699
const hostname = process.env.HOST || '0.0.0.0'

const server = Bun.serve({
  port,
  hostname,
  fetch: async (req: Request) => {
    try {
      return await handleRequest(req)
    } catch (error) {
      console.error('Error handling request:', error)
      if (!(error instanceof Error)) throw error
      return new Response(`Internal Server Error: ${error.message}`, {
        status: 500,
      })
    }
  },
})

console.log(`Server running at http://${server.hostname}:${server.port}`)
