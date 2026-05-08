const SHORTCUTS_KEY = 'diagrammer:shortcuts:v1'

export type ShortcutId =
  | 'newMap'
  | 'openFile'
  | 'pasteJson'
  | 'downloadJson'
  | 'toggleEdit'
  | 'addNode'
  | 'closeMap'
  | 'showShortcuts'
  | 'openMenu'
  | 'showSkill'

export type ShortcutScope = 'always' | 'mapOpen' | 'edit'

export interface ShortcutDef {
  id: ShortcutId
  label: string
  defaultBinding: string
  scope: ShortcutScope
}

// `Mod` = Cmd on macOS, Ctrl elsewhere. Defaults avoid bindings the browser
// reliably steals (Mod+N, Mod+T, Mod+W) and avoid plain-letter keys that
// would conflict with typing in the canvas/title input.
export const SHORTCUT_DEFS: ShortcutDef[] = [
  { id: 'newMap', label: 'New map', defaultBinding: 'Mod+Alt+N', scope: 'always' },
  { id: 'openFile', label: 'Open file', defaultBinding: 'Mod+O', scope: 'always' },
  { id: 'pasteJson', label: 'Paste JSON', defaultBinding: 'Mod+Shift+V', scope: 'always' },
  { id: 'downloadJson', label: 'Download JSON', defaultBinding: 'Mod+S', scope: 'mapOpen' },
  { id: 'toggleEdit', label: 'Toggle edit / view mode', defaultBinding: 'Mod+E', scope: 'mapOpen' },
  { id: 'addNode', label: 'Add node', defaultBinding: 'Mod+Enter', scope: 'edit' },
  { id: 'closeMap', label: 'Close map', defaultBinding: 'Mod+Shift+W', scope: 'mapOpen' },
  { id: 'openMenu', label: 'Open menu', defaultBinding: 'Mod+K', scope: 'always' },
  { id: 'showSkill', label: 'Show authoring skill', defaultBinding: 'Mod+/', scope: 'always' },
  { id: 'showShortcuts', label: 'Show keyboard shortcuts', defaultBinding: '?', scope: 'always' },
]

export const DEFAULT_BINDINGS: Record<ShortcutId, string> = Object.fromEntries(
  SHORTCUT_DEFS.map((d) => [d.id, d.defaultBinding]),
) as Record<ShortcutId, string>

export function getBindings(): Record<ShortcutId, string> {
  try {
    const raw = localStorage.getItem(SHORTCUTS_KEY)
    if (!raw) return { ...DEFAULT_BINDINGS }
    const parsed = JSON.parse(raw) as Partial<Record<ShortcutId, string>>
    return { ...DEFAULT_BINDINGS, ...parsed }
  } catch {
    return { ...DEFAULT_BINDINGS }
  }
}

export function setBindings(next: Record<ShortcutId, string>) {
  try {
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(next))
  } catch {
    // Storage full or disabled — bindings stay in-memory only.
  }
}

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform)

export interface ParsedBinding {
  mod: boolean
  ctrl: boolean
  alt: boolean
  shift: boolean
  key: string
}

export function parseBinding(binding: string): ParsedBinding | null {
  if (!binding) return null
  const parts = binding.split('+').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null
  let mod = false
  let ctrl = false
  let alt = false
  let shift = false
  let key = ''
  for (const part of parts) {
    const lower = part.toLowerCase()
    if (lower === 'mod' || lower === 'cmdorctrl' || lower === 'meta' || lower === 'cmd' || lower === 'command') {
      mod = true
    } else if (lower === 'ctrl' || lower === 'control') {
      ctrl = true
    } else if (lower === 'alt' || lower === 'option') {
      alt = true
    } else if (lower === 'shift') {
      shift = true
    } else {
      key = normalizeKey(part)
    }
  }
  if (!key) return null
  return { mod, ctrl, alt, shift, key }
}

const KEY_ALIASES: Record<string, string> = {
  enter: 'Enter',
  return: 'Enter',
  esc: 'Escape',
  escape: 'Escape',
  space: ' ',
  spacebar: ' ',
  tab: 'Tab',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  backspace: 'Backspace',
  delete: 'Delete',
  del: 'Delete',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
}

function normalizeKey(k: string): string {
  if (k.length === 1) return k
  return KEY_ALIASES[k.toLowerCase()] ?? k
}

const MODIFIER_KEYS = new Set(['Control', 'Meta', 'Alt', 'Shift', 'AltGraph'])

export function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key)
}

export function matchBinding(event: KeyboardEvent, binding: string): boolean {
  const p = parseBinding(binding)
  if (!p) return false
  const eventMod = IS_MAC ? event.metaKey : event.ctrlKey
  const eventOtherMeta = IS_MAC ? event.ctrlKey : event.metaKey
  if (p.mod !== eventMod) return false
  if (p.ctrl !== eventOtherMeta) return false
  if (p.alt !== event.altKey) return false

  const wantKey = p.key
  const evKey = event.key
  const wantSingle = wantKey.length === 1
  const evSingle = evKey.length === 1

  if (wantSingle && evSingle) {
    if (wantKey.toUpperCase() !== evKey.toUpperCase()) return false
    // Letters: shift flag controls case selection. Other single chars (e.g. ?,
    // /, +) carry shift implicitly via the rendered character, so we only
    // enforce shift for letters.
    const isLetter = /^[A-Za-z]$/.test(wantKey)
    if (isLetter && p.shift !== event.shiftKey) return false
    return true
  }
  if (wantKey !== evKey) return false
  if (p.shift !== event.shiftKey) return false
  return true
}

export function formatBinding(binding: string): string {
  const p = parseBinding(binding)
  if (!p) return ''
  const out: string[] = []
  if (p.mod) out.push(IS_MAC ? '⌘' : 'Ctrl')
  if (p.ctrl) out.push(IS_MAC ? '⌃' : 'Ctrl')
  if (p.alt) out.push(IS_MAC ? '⌥' : 'Alt')
  if (p.shift) out.push(IS_MAC ? '⇧' : 'Shift')
  let key = p.key
  if (key === ' ') key = 'Space'
  else if (key.length === 1) key = key.toUpperCase()
  out.push(key)
  return IS_MAC ? out.join('') : out.join('+')
}

export function bindingFromEvent(event: KeyboardEvent): string {
  if (isModifierKey(event.key)) return ''
  const parts: string[] = []
  const eventMod = IS_MAC ? event.metaKey : event.ctrlKey
  const eventOtherMeta = IS_MAC ? event.ctrlKey : event.metaKey
  if (eventMod) parts.push('Mod')
  if (eventOtherMeta) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')

  let key = event.key
  if (key.length === 1) {
    const isLetter = /^[A-Za-z]$/.test(key)
    if (isLetter) {
      if (event.shiftKey) parts.push('Shift')
      key = key.toUpperCase()
    }
    // Non-letter single chars: shift is encoded in the char already.
  } else {
    if (event.shiftKey) parts.push('Shift')
  }
  parts.push(key)
  return parts.join('+')
}

export function bindingHasModifier(binding: string): boolean {
  const p = parseBinding(binding)
  if (!p) return false
  return p.mod || p.ctrl || p.alt
}
