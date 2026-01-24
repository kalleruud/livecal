import { mkdir, readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'

const cacheDir = process.env.CACHE_DIR || './cache'

/*
 * CacheKey format: `${integrationId}-${endpointId}`
 */
type CacheKey = `${string}-${string}`
type CacheValue = {
  isValid: boolean
  path: string
}

const cache = new Map<CacheKey, CacheValue>()

async function ensureCacheDir(): Promise<void> {
  await mkdir(cacheDir, { recursive: true })
}

/*
 * Main request function with caching
 */
export default async function request<T extends object>(
  url: string,
  integrationId: string,
): Promise<T> {
  const key: CacheKey = `${integrationId}-${url.toString()}`

  const cachedContent = await get(key)
  if (cachedContent && hasValidCache(key)) {
    console.log(`Cache hit for ${url}`)
    return JSON.parse(cachedContent)
  }

  console.log(`Cache miss for ${url}, fetching...`)
  const response = await fetch(url)
  if (response.ok) {
    await set(key, await response.text())
    console.log(`Fetched and cached ${url}`)
    return (await response.json()) as T
  }

  if (cachedContent) {
    console.warn(
      `Using stale cache for ${url} due to fetch error: ${response.status} - ${response.statusText}`,
    )
    return JSON.parse(cachedContent)
  }
  throw new Error(
    `Failed to fetch ${url} (${response.status}): ${response.statusText} ${await response.text()}`,
  )
}

/*
 * Retrieve content from cache
 */
async function get(key: CacheKey): Promise<string | null> {
  const cached = cache.get(key)
  if (!cached) return null

  const file = Bun.file(cached.path)
  if (!(await file.exists())) return null

  return file.text()
}

/*
 * Retrieve content from cache
 */
function hasValidCache(key: CacheKey): boolean {
  return cache.get(key)?.isValid === true
}

/*
 * Store content in cache
 */
async function set(key: CacheKey, content: string): Promise<void> {
  await ensureCacheDir()
  const path = join(cacheDir, key)
  cache.set(key, { isValid: true, path })
  await Bun.write(path, content)
}

/*
 * Invalidate a specific cache entry
 */
export async function invalidate(key: CacheKey): Promise<void> {
  const cached = cache.get(key)
  if (!cached) return
  cache.set(key, { ...cached, isValid: false })
}

/*
 * Hard clear the entire cache, including files on disk
 */
export async function clear(): Promise<void> {
  await ensureCacheDir()
  const files = await readdir(cacheDir)
  await Promise.all(files.map((file) => unlink(join(cacheDir, file))))
  cache.clear()
  console.log(`Cache cleared: ${files.length} files removed`)
}
