import { handleRequest } from './server/router.ts'

const port = Number(process.env.PORT) || 6699
const hostname = process.env.HOST || '0.0.0.0'

const server = Bun.serve({
  port,
  hostname,
  fetch: handleRequest,
})

console.log(`Server running at http://${server.hostname}:${server.port}`)
