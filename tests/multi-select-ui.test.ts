import { describe, expect, test } from 'bun:test'
import {
  getNextOptionIndex,
  getRenderedOptionIndex,
  replaceChipsPreservingInput,
  toggleSelectedValue,
} from '../src/static/multi-select.js'
import tomorrowlandIntegration from '../src/integrations/tomorrowland/definition.ts'
import { addRoute, handleRequest } from '../src/server/router.ts'

describe('multi-select UI state', () => {
  test('keeps generic text input chrome off the nested search field', async () => {
    const html = await Bun.file('src/static/index.html').text()

    expect(html).toContain("input[type='text']:not(.multi-select-input)")
    expect(html).toMatch(
      /\.multi-select-input\s*{[^}]*background: transparent;[^}]*border: none;/s
    )
  })

  test('constrains long URLs and large selections to scrollable areas', async () => {
    const html = await Bun.file('src/static/index.html').text()

    expect(html).toMatch(
      /code\s*{[^}]*min-width: 0;[^}]*overflow-x: auto;[^}]*white-space: nowrap;/s
    )
    expect(html).toMatch(
      /\.multi-select-chips\s*{[^}]*max-height: 6rem;[^}]*overflow-x: hidden;[^}]*overflow-y: scroll;/s
    )
    expect(html).toMatch(
      /\.multi-select-dropdown\s*{[^}]*max-height: 300px;[^}]*overflow-y: scroll;/s
    )
    expect(html).toMatch(
      /\.multi-select-chips,\s*\.multi-select-dropdown\s*{[^}]*overscroll-behavior-y: contain;[^}]*scrollbar-width: none;[^}]*touch-action: pan-y;/s
    )
    expect(html).toMatch(
      /\.multi-select-chips::\-webkit-scrollbar,\s*\.multi-select-dropdown::\-webkit-scrollbar\s*{[^}]*display: none;/s
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

  test('enter-style toggling selects and deselects the same option', () => {
    const selectedValues = new Set<string>()

    expect(toggleSelectedValue(selectedValues, 'Tiësto')).toBe(true)
    expect(selectedValues.has('Tiësto')).toBe(true)

    expect(toggleSelectedValue(selectedValues, 'Tiësto')).toBe(false)
    expect(selectedValues.has('Tiësto')).toBe(false)
  })

  test('repeated chip renders preserve the focused search input', () => {
    const searchInput = { id: 'search' }
    const oldChip = { id: 'old-chip' }
    const firstChip = { id: 'first-chip' }
    const secondChip = { id: 'second-chip' }
    const children = [oldChip, searchInput]
    let searchInputWasRemoved = false

    const chipsContainer = {
      get firstChild() {
        return children[0]
      },
      removeChild(child: object) {
        if (child === searchInput) searchInputWasRemoved = true
        children.splice(children.indexOf(child), 1)
      },
      insertBefore(child: object, reference: object) {
        children.splice(children.indexOf(reference), 0, child)
      },
    }

    replaceChipsPreservingInput(chipsContainer, searchInput, [firstChip])
    replaceChipsPreservingInput(chipsContainer, searchInput, [
      firstChip,
      secondChip,
    ])

    expect(searchInputWasRemoved).toBe(false)
    expect(children).toEqual([firstChip, secondChip, searchInput])
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
