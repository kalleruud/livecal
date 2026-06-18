import { describe, expect, test } from 'bun:test'
import {
  buildHttpCalendarUrl,
  getNextOptionIndex,
  getRenderedOptionIndex,
  resolveActiveOptionIndex,
  toggleSelectedValue,
} from '../src/static/multi-select.js'
import tomorrowlandIntegration from '../src/integrations/tomorrowland/definition.ts'
import { addRoute, handleRequest } from '../src/server/router.ts'

describe('multi-select UI state', () => {
  test('builds an absolute HTTP calendar URL with current filters', () => {
    expect(
      buildHttpCalendarUrl(
        'https://livecal.example',
        '/api/tomorrowland/lineup.ics?weekend=W1&artists=Alesso'
      )
    ).toBe(
      'https://livecal.example/api/tomorrowland/lineup.ics?weekend=W1&artists=Alesso'
    )
    expect(
      buildHttpCalendarUrl('http://localhost:6699', '/api/ibu/wc.ics')
    ).toBe('http://localhost:6699/api/ibu/wc.ics')
  })

  test('renders a copy control inside each URL view', async () => {
    const template = await Bun.file('src/static/endpoint.html').text()

    expect(template).toMatch(
      /<div class="url-view">[\s\S]*<code>{{PATH}}<\/code>[\s\S]*class="copy-link"/
    )
    expect(template).toContain('aria-label="Copy HTTP calendar URL"')
    expect(template).toContain('aria-live="polite"')
  })

  test('bounds clipboard writes and retains a synchronous fallback', async () => {
    const html = await Bun.file('src/static/index.html').text()

    expect(html).toContain('function copyWithTextarea(text)')
    expect(html).toContain('textarea.focus()')
    expect(html).toContain(
      'textarea.setSelectionRange(0, textarea.value.length)'
    )
    expect(html).toContain('navigator.clipboard?.writeText')
    expect(html).toContain("new Error('Clipboard timeout')")
    expect(html).toContain("copied ? 'Copied' : 'Copy failed'")
  })

  test('keeps generic text input chrome off the nested search field', async () => {
    const html = await Bun.file('src/static/index.html').text()

    expect(html).toContain("input[type='text']:not(.multi-select-input)")
    expect(html).toMatch(
      /\.multi-select-input\s*{[^}]*background: #1e1e1e;[^}]*border: none;[^}]*border-bottom: 1px solid #333;/s
    )
  })

  test('constrains long URLs and large selections to scrollable areas', async () => {
    const html = await Bun.file('src/static/index.html').text()

    expect(html).toMatch(
      /code\s*{[^}]*min-width: 0;[^}]*overflow-x: auto;[^}]*white-space: nowrap;/s
    )
    expect(html).toMatch(
      /\.multi-select-selected\s*{[^}]*align-items: center;[^}]*overflow-x: scroll;[^}]*overflow-y: hidden;/s
    )
    expect(html).toMatch(
      /\.multi-select-options\s*{[^}]*max-height: calc\(300px - 2\.5rem\);[^}]*overflow-y: scroll;/s
    )
    expect(html).toMatch(
      /\.multi-select-selected\s*{[^}]*overscroll-behavior-x: contain;[^}]*touch-action: pan-x;/s
    )
    expect(html).toMatch(
      /\.multi-select-options\s*{[^}]*overscroll-behavior-y: contain;[^}]*touch-action: pan-y;/s
    )
    expect(html).toMatch(
      /\.chip\s*{[^}]*justify-content: flex-start;[^}]*width: fit-content;[^}]*max-width: 100%;/s
    )
    expect(html).toMatch(
      /\.multi-select-selected::\-webkit-scrollbar,\s*\.multi-select-options::\-webkit-scrollbar\s*{[^}]*display: none;/s
    )
  })

  test('places search in the dropdown and opens it with an add button', async () => {
    const html = await Bun.file('src/static/index.html').text()

    expect(html).toContain("addButton.textContent = '+'")
    expect(html).toContain("addButton.addEventListener('click', openDropdown)")
    expect(html).toContain(
      "addButton.setAttribute('aria-controls', optionsContainer.id)"
    )
    expect(html).toMatch(
      /dropdown\.appendChild\(searchInput\)[^]*dropdown\.appendChild\(optionsContainer\)/
    )
    expect(html).not.toContain('chipsContainer.appendChild(searchInput)')
    expect(html).toContain("placeholder.className = 'multi-select-placeholder'")
  })

  test('clears the search term after toggling an option', async () => {
    const html = await Bun.file('src/static/index.html').text()

    expect(html).toMatch(
      /function toggleOption\(opt\)\s*{[^}]*activeOption\.offsetTop - optionsContainer\.scrollTop[^}]*searchInput\.value = ''[^}]*renderDropdown\('', false, opt\.value, activeOffset\)/s
    )
  })

  test('makes the entire selected chip removable', async () => {
    const html = await Bun.file('src/static/index.html').text()

    expect(html).toContain("chipEl.addEventListener('click'")
    expect(html).not.toContain(".querySelector('.chip-close')")
    expect(html).toMatch(/\.chip\s*{[^}]*cursor: pointer;/s)
    expect(html).toMatch(/\.chip-close\s*{[^}]*pointer-events: none;/s)
  })

  test('renders an integration description as helper text', async () => {
    const calendarRoute = tomorrowlandIntegration.routes.find(route =>
      route.path.endsWith('.ics')
    )
    if (!calendarRoute) throw new Error('Calendar route not found')

    addRoute(calendarRoute, tomorrowlandIntegration)
    const response = await handleRequest(new Request('http://localhost/'))
    const html = await response.text()

    expect(html).toContain('class="endpoint-description"')
    expect(html).toContain(
      'Selecting both artists and stages includes only performances matching at least one selected artist and at least one selected stage.'
    )
  })

  test('arrow navigation wraps through the filtered options', () => {
    expect(getNextOptionIndex(-1, 3, 1)).toBe(0)
    expect(getNextOptionIndex(0, 3, -1)).toBe(2)
    expect(getNextOptionIndex(2, 3, 1)).toBe(0)
    expect(getNextOptionIndex(1, 3, 1)).toBe(2)
    expect(getNextOptionIndex(0, 0, 1)).toBe(-1)
  })

  test('filter changes highlight the first matching option', () => {
    expect(getRenderedOptionIndex(4, 2, true)).toBe(0)
    expect(getRenderedOptionIndex(4, 2, false)).toBe(1)
    expect(getRenderedOptionIndex(0, 0, true)).toBe(-1)
  })

  test('keeps the toggled option highlighted after clearing search', () => {
    const options = [
      { value: 'A Little Sound' },
      { value: 'A.N.I.' },
      { value: 'Adrián Mills' },
    ]

    expect(resolveActiveOptionIndex(options, 0, false, 'Adrián Mills')).toBe(2)
    expect(resolveActiveOptionIndex(options, 2, false, 'Missing')).toBe(2)
  })

  test('enter-style toggling selects and deselects the same option', () => {
    const selectedValues = new Set<string>()

    expect(toggleSelectedValue(selectedValues, 'Tiësto')).toBe(true)
    expect(selectedValues.has('Tiësto')).toBe(true)

    expect(toggleSelectedValue(selectedValues, 'Tiësto')).toBe(false)
    expect(selectedValues.has('Tiësto')).toBe(false)
  })

  test('serves the browser helper module', async () => {
    const response = await handleRequest(
      new Request('http://localhost/static/multi-select.js')
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/javascript')
    expect(await response.text()).toContain('getNextOptionIndex')
  })
})
