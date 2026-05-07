import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { tryParseMap } from '@/lib/schema'
import type { StandardMap } from '@/lib/schema'

interface PasteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoad: (map: StandardMap, source: 'paste') => void
}

export function PasteDialog({ open, onOpenChange, onLoad }: PasteDialogProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = () => {
    const result = tryParseMap(text)
    if (!result.ok || !result.map) {
      setError(result.issues[0]?.message ?? 'Invalid map JSON.')
      return
    }
    setError(null)
    onLoad(result.map, 'paste')
    setText('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paste map JSON</DialogTitle>
          <DialogDescription>
            Paste a Standard Map JSON document. The viewer validates it before
            rendering.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`{\n  "version": "1",\n  "type": "mindmap",\n  "title": "Untitled",\n  "nodes": [],\n  "edges": []\n}`}
          rows={14}
          className="text-xs"
        />
        {error ? (
          <p className="text-sm text-[var(--color-destructive)]">{error}</p>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={text.trim().length === 0}>
            Open map
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
