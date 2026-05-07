import type { MapDocument } from './schema'

const RECENTS_KEY = 'diagrammer:recents:v1'
const PREFS_KEY = 'diagrammer:prefs:v1'
const MAX_RECENTS = 24

export interface RecentMap {
  id: string
  title: string
  type: MapDocument['type']
  nodeCount: number
  edgeCount: number
  updatedAt: number
  source: 'file' | 'paste' | 'example' | 'local'
  fileName?: string
  /** Inlined map JSON; we keep a copy so the user can re-open without re-importing. */
  map: MapDocument
}

export interface Prefs {
  theme: 'system' | 'light' | 'dark'
  /** Id of the most recently active map. Restored on load. */
  lastOpenedId?: string
}

const DEFAULT_PREFS: Prefs = { theme: 'light' }

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or disabled — ignore. Recents are best-effort.
  }
}

export function getRecents(): RecentMap[] {
  return safeRead<RecentMap[]>(RECENTS_KEY, [])
}

export function saveRecent(entry: Omit<RecentMap, 'id' | 'updatedAt'> & { id?: string }): RecentMap {
  const id = entry.id ?? crypto.randomUUID()
  const updatedAt = Date.now()
  const next: RecentMap = { ...entry, id, updatedAt }
  const list = getRecents().filter((r) => r.id !== id)
  list.unshift(next)
  while (list.length > MAX_RECENTS) list.pop()
  safeWrite(RECENTS_KEY, list)
  return next
}

export function getRecent(id: string): RecentMap | undefined {
  return getRecents().find((r) => r.id === id)
}

export function deleteRecent(id: string) {
  const list = getRecents().filter((r) => r.id !== id)
  safeWrite(RECENTS_KEY, list)
}

export function clearRecents() {
  safeWrite(RECENTS_KEY, [])
}

export function getPrefs(): Prefs {
  return { ...DEFAULT_PREFS, ...safeRead<Partial<Prefs>>(PREFS_KEY, {}) }
}

export function setPrefs(patch: Partial<Prefs>) {
  const next = { ...getPrefs(), ...patch }
  safeWrite(PREFS_KEY, next)
  return next
}
