import { mkdir, readdir, unlink } from 'node:fs/promises'
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
    await unlink(path)
  }
}

export async function clear(): Promise<void> {
  await ensureCacheDir()
  const files = await readdir(cacheDir)
  await Promise.all(files.map((file) => unlink(join(cacheDir, file))))
  console.log(`Cache cleared: ${files.length} files removed`)
}
