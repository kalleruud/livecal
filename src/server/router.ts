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

function renderEndpoints(host: string): string {
  const calendarRoutes = getCalendarRoutes()
  const protocol = host.includes('localhost') ? 'http' : 'https'

  if (calendarRoutes.length === 0) {
    return '<li>No calendars available</li>'
  }

  return calendarRoutes
    .map((path) => {
      const webcalUrl = `webcal://${host}${path}`
      const httpUrl = `${protocol}://${host}${path}`
      return `<li>
      <code>${path}</code>
      <a href="${webcalUrl}">Subscribe</a>
      <a href="${httpUrl}" target="_blank">Preview</a>
    </li>`
    })
    .join('\n    ')
}

async function renderHomePage(host: string): Promise<string> {
  const templatePath = new URL('../static/index.html', import.meta.url).pathname
  const template = await Bun.file(templatePath).text()
  return template.replace('{{ENDPOINTS}}', renderEndpoints(host))
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
