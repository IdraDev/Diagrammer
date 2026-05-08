import { useEffect, useState } from 'react'
import { Keyboard, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_BINDINGS,
  SHORTCUT_DEFS,
  bindingFromEvent,
  formatBinding,
  isModifierKey,
  type ShortcutId,
} from '@/lib/shortcuts'
import { cn } from '@/lib/utils'

interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bindings: Record<ShortcutId, string>
  onBindingsChange: (next: Record<ShortcutId, string>) => void
}

export function ShortcutsDialog({
  open,
  onOpenChange,
  bindings,
  onBindingsChange,
}: ShortcutsDialogProps) {
  const [recording, setRecording] = useState<ShortcutId | null>(null)

  // Reset recording state when dialog closes.
  useEffect(() => {
    if (!open) setRecording(null)
  }, [open])

  // Capture next keypress while recording.
  useEffect(() => {
    if (!recording) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') {
        setRecording(null)
        return
      }
      if (isModifierKey(e.key)) return
      const next = bindingFromEvent(e)
      if (!next) return
      onBindingsChange({ ...bindings, [recording]: next })
      setRecording(null)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [recording, bindings, onBindingsChange])

  const onResetOne = (id: ShortcutId) => {
    onBindingsChange({ ...bindings, [id]: DEFAULT_BINDINGS[id] })
  }
  const onClearOne = (id: ShortcutId) => {
    onBindingsChange({ ...bindings, [id]: '' })
  }
  const onResetAll = () => onBindingsChange({ ...DEFAULT_BINDINGS })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-4" />
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription>
            Click a binding to record a new one. Press Esc to cancel, or use
            the clear button to unbind.
          </DialogDescription>
        </DialogHeader>

        <ul className="scrollbar-thin max-h-[60vh] divide-y divide-[var(--color-border)] overflow-auto rounded-md border border-[var(--color-border)]">
          {SHORTCUT_DEFS.map((def) => {
            const current = bindings[def.id] ?? ''
            const isRecording = recording === def.id
            const isCustom = current !== DEFAULT_BINDINGS[def.id]
            return (
              <li
                key={def.id}
                className="flex items-center gap-2 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{def.label}</p>
                </div>
                {isCustom && !isRecording ? (
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label="Reset to default"
                    title="Reset to default"
                    onClick={() => onResetOne(def.id)}
                  >
                    <RotateCcw />
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant={isRecording ? 'default' : 'outline'}
                  className={cn(
                    'min-w-[7rem] font-mono text-xs',
                    isRecording && 'animate-pulse',
                  )}
                  onClick={() => setRecording(isRecording ? null : def.id)}
                  aria-label={
                    isRecording
                      ? `Recording new shortcut for ${def.label}`
                      : `Change shortcut for ${def.label}`
                  }
                >
                  {isRecording
                    ? 'Press keys…'
                    : current
                      ? formatBinding(current)
                      : 'Unbound'}
                </Button>
                {!isRecording && current ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[var(--color-muted-foreground)]"
                    onClick={() => onClearOne(def.id)}
                  >
                    Clear
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ul>

        <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
          <span>
            Mod = {/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ Cmd' : 'Ctrl'}
          </span>
          <Button variant="outline" size="sm" onClick={onResetAll}>
            Reset all to defaults
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
