import type {
  ParamMetadata,
  RegisteredIntegration,
  Route,
} from '../integrations/framework/index.ts'

const routes: Route[] = [
  {
    path: '/health',
    handler: () => new Response('ok'),
  },
]

const routeToIntegration = new Map<string, RegisteredIntegration>()

export function addRoute(
  route: Route,
  integration?: RegisteredIntegration
): void {
  routes.push(route)
  if (integration) {
    routeToIntegration.set(route.path, integration)
  }
}

function getCalendarRoutes(): string[] {
  return routes.filter(r => r.path.endsWith('.ics')).map(r => r.path)
}

async function loadTemplate(name: string): Promise<string> {
  const path = new URL(`../static/${name}`, import.meta.url).pathname
  return Bun.file(path).text()
}

function escapeHtmlAttribute(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function renderEndpoints(host: string): Promise<string> {
  const calendarRoutes = getCalendarRoutes()

  if (calendarRoutes.length === 0) {
    return '<li>No calendars available</li>'
  }

  const endpointTemplate = await loadTemplate('endpoint.html')

  return calendarRoutes
    .map(path => {
      const webcalUrl = `webcal://${host}${path}`
      const integration = routeToIntegration.get(path)
      const params: ParamMetadata[] = integration?.paramMetadata || []
      const paramsJson = escapeHtmlAttribute(JSON.stringify(params))

      return endpointTemplate
        .replaceAll('{{PATH}}', path)
        .replaceAll('{{WEBCAL_URL}}', webcalUrl)
        .replaceAll('{{PARAMS_JSON}}', paramsJson)
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

  if (url.pathname === '/static/multi-select.js') {
    const script = await loadTemplate('multi-select.js')
    return new Response(script, {
      headers: { 'Content-Type': 'text/javascript; charset=utf-8' },
    })
  }

  if (url.pathname === '/') {
    const html = await renderHomePage(url.host)
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const route = routes.find(r => r.path === url.pathname)

  if (route) {
    return route.handler(req)
  }

  return new Response('Not Found', { status: 404 })
}
