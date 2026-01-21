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

function getCalendarRoutes(): string[] {
  return routes.filter((r) => r.path.endsWith('.ics')).map((r) => r.path)
}

async function loadTemplate(name: string): Promise<string> {
  const path = new URL(`../static/${name}`, import.meta.url).pathname
  return Bun.file(path).text()
}

async function renderEndpoints(host: string): Promise<string> {
  const calendarRoutes = getCalendarRoutes()

  if (calendarRoutes.length === 0) {
    return '<li>No calendars available</li>'
  }

  const endpointTemplate = await loadTemplate('endpoint.html')

  return calendarRoutes
    .map((path) => {
      const webcalUrl = `webcal://${host}${path}`
      return endpointTemplate
        .replace(/{{PATH}}/g, path)
        .replace(/{{WEBCAL_URL}}/g, webcalUrl)
    })
    .join('\n    ')
}

async function renderHomePage(host: string): Promise<string> {
  const template = await loadTemplate('index.html')
  const endpoints = await renderEndpoints(host)
  return template.replace('{{ENDPOINTS}}', endpoints)
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url)

  if (url.pathname === '/') {
    const html = await renderHomePage(url.host)
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const route = routes.find((r) => r.path === url.pathname)

  if (route) {
    return route.handler(req)
  }

  return new Response('Not Found', { status: 404 })
}
