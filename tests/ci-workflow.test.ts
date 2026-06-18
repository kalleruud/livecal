import { describe, expect, test } from 'bun:test'

describe('CI workflow', () => {
  test('defines a build script for CI and Docker builds', async () => {
    const packageJson = await Bun.file('package.json').json()

    expect(packageJson.scripts.build).toBe(
      'bun build src/index.ts --target bun --outfile dist/index.js'
    )
  })

  test('runs checks, lint, tests, and build before merging to main', async () => {
    const workflow = await Bun.file('.github/workflows/ci.yml').text()

    expect(workflow).toContain('name: CI')
    expect(workflow).toContain('pull_request:')
    expect(workflow).toContain('- main')
    expect(workflow).toContain('push:')
    expect(workflow).toContain('uses: oven-sh/setup-bun@v2')
    expect(workflow).toContain('run: bun install --frozen-lockfile')
    expect(workflow).toContain('run: bun run check')
    expect(workflow).toContain('run: bun run lint')
    expect(workflow).toContain('run: bun test')
    expect(workflow).toContain('run: bun run build')
  })
})
