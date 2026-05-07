import { useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SKILL_TEXT } from '@/lib/skill'
import { downloadText } from '@/lib/utils'

interface SkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SkillDialog({ open, onOpenChange }: SkillDialogProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(SKILL_TEXT)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore — fallback to manual selection
    }
  }

  const onDownload = () => {
    downloadText('SKILL.md', SKILL_TEXT, 'text/markdown')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Diagrammer authoring skill</DialogTitle>
          <DialogDescription>
            Paste this into your LLM context (system prompt, Cursor rule,
            Claude Code skill file, etc.). Models will produce JSON the viewer
            can render.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onCopy} className="gap-2">
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copied' : 'Copy to clipboard'}
          </Button>
          <Button size="sm" variant="outline" onClick={onDownload}>
            <Download />
            Download SKILL.md
          </Button>
        </div>
        <pre className="scrollbar-thin max-h-[60vh] overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-xs leading-relaxed font-mono whitespace-pre-wrap break-words">
          {SKILL_TEXT}
        </pre>
      </DialogContent>
    </Dialog>
  )
}
