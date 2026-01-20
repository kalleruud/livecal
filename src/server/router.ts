export interface Route {
  path: string
  handler: (req: Request) => Response | Promise<Response>
}

const routes: Route[] = [
  {
    path: '/health',
    handler: () => new Response('ok'),
  },
]

export function addRoute(route: Route): void {
  routes.push(route)
}

export function handleRequest(req: Request): Response | Promise<Response> {
  const url = new URL(req.url)
  const route = routes.find((r) => r.path === url.pathname)

  if (route) {
    return route.handler(req)
  }

  return new Response('Not Found', { status: 404 })
}
