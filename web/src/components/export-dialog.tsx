import { FileJson, Image as ImageIcon, Moon, Sun } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExportJson: () => void
  onExportPngLight: () => void
  onExportPngDark: () => void
  busy?: boolean
}

export function ExportDialog({
  open,
  onOpenChange,
  onExportJson,
  onExportPngLight,
  onExportPngDark,
  busy = false,
}: ExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>
            Choose a format to download.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <ExportOption
            icon={<FileJson />}
            title="JSON"
            description="Diagrammer document. Re-openable in this viewer."
            onClick={onExportJson}
            disabled={busy}
          />
          <ExportOption
            icon={
              <span className="relative inline-flex">
                <ImageIcon />
                <Sun className="absolute -bottom-1 -right-1 size-3" />
              </span>
            }
            title="PNG · Light"
            description="Rendered with the light theme."
            onClick={onExportPngLight}
            disabled={busy}
          />
          <ExportOption
            icon={
              <span className="relative inline-flex">
                <ImageIcon />
                <Moon className="absolute -bottom-1 -right-1 size-3" />
              </span>
            }
            title="PNG · Dark"
            description="Rendered with the dark theme."
            onClick={onExportPngDark}
            disabled={busy}
          />
        </div>
        {busy ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Rendering image…
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ExportOption({
  icon,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-left transition-colors hover:border-[var(--color-foreground)]/40 hover:bg-[var(--color-muted)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-[var(--color-muted-foreground)]">
          {description}
        </span>
      </span>
    </button>
  )
}
