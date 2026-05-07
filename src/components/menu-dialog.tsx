import {
  ClipboardPaste,
  FilePlus2,
  FolderOpen,
  Sparkles,
  Trash2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapTypeIcon } from './map-type-icon'
import { EXAMPLES, type ExampleEntry } from '@/lib/examples'
import type { RecentMap } from '@/lib/storage'
import { formatRelativeTime } from '@/lib/utils'
import { InlineMarkdown, stripMarkdown } from '@/lib/markdown'

interface MenuDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recents: RecentMap[]
  onOpenRecent: (recent: RecentMap) => void
  onDeleteRecent: (id: string) => void
  onOpenExample: (example: ExampleEntry) => void
  onPickFile: () => void
  onPaste: () => void
  onSkill: () => void
  onNewMap: () => void
}

export function MenuDialog({
  open,
  onOpenChange,
  recents,
  onOpenRecent,
  onDeleteRecent,
  onOpenExample,
  onPickFile,
  onPaste,
  onSkill,
  onNewMap,
}: MenuDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Standard Map</DialogTitle>
          <DialogDescription>
            Open a map, paste JSON, browse recents and examples, or copy the
            authoring skill.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button onClick={onNewMap} className="justify-start gap-2">
            <FilePlus2 />
            New map
          </Button>
          <Button variant="outline" onClick={onPickFile} className="justify-start gap-2">
            <FolderOpen />
            Open file
          </Button>
          <Button variant="outline" onClick={onPaste} className="justify-start gap-2">
            <ClipboardPaste />
            Paste JSON
          </Button>
          <Button variant="outline" onClick={onSkill} className="justify-start gap-2">
            <Sparkles />
            Copy skill
          </Button>
        </div>

        {recents.length > 0 ? (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Recent
            </h3>
            <ul className="scrollbar-thin max-h-60 divide-y divide-[var(--color-border)] overflow-auto rounded-md border border-[var(--color-border)]">
              {recents.map((r) => (
                <li
                  key={r.id}
                  className="group flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--color-muted)]"
                >
                  <button
                    type="button"
                    onClick={() => onOpenRecent(r)}
                    className="flex flex-1 min-w-0 items-center gap-3 text-left focus:outline-none"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)]">
                      <MapTypeIcon type={r.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium"
                        title={stripMarkdown(r.title)}
                      >
                        <InlineMarkdown text={r.title} />
                      </p>
                      <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                        {(r.fileName ?? r.source) + ' · ' + formatRelativeTime(r.updatedAt)}
                      </p>
                    </div>
                    <Badge variant="muted" className="font-mono">
                      {r.type}
                    </Badge>
                  </button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label="Remove from recents"
                    className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteRecent(r.id)
                    }}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Examples
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.slug}
                type="button"
                onClick={() => onOpenExample(ex)}
                className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-left transition-colors hover:border-[var(--color-foreground)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                  <MapTypeIcon type={ex.map.type} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{ex.label}</p>
                  <p className="truncate text-[10px] font-mono text-[var(--color-muted-foreground)]">
                    {ex.map.type}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  )
}
