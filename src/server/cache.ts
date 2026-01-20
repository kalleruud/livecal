import { mkdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'

const cacheDir = process.env.CACHE_DIR || './cache'

async function ensureCacheDir(): Promise<void> {
  await mkdir(cacheDir, { recursive: true })
}

export async function get(key: string): Promise<string | null> {
  const file = Bun.file(join(cacheDir, key))
  if (await file.exists()) {
    return file.text()
  }
  return null
}

export async function set(key: string, content: string): Promise<void> {
  await ensureCacheDir()
  await Bun.write(join(cacheDir, key), content)
}

export async function remove(key: string): Promise<void> {
  const path = join(cacheDir, key)
  const file = Bun.file(path)
  if (await file.exists()) {
    await Bun.write(path, '')
    await unlink(path)
  }
}
