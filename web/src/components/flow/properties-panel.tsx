import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { tokensFor } from '@/lib/palette'
import type {
  EdgeDirection,
  EdgeStyle,
  NodeColor,
  NodeEmphasis,
  NodeShape,
} from '@/lib/schema'
import type {
  StandardFlowEdge,
  StandardFlowNode,
} from '@/lib/flow-adapter'

const SHAPES: { value: NodeShape; label: string }[] = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'pill', label: 'Pill' },
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'hexagon', label: 'Hexagon' },
]

const COLORS: NodeColor[] = [
  'default',
  'slate',
  'blue',
  'green',
  'amber',
  'rose',
  'violet',
  'cyan',
]

const EMPHASES: NodeEmphasis[] = ['subtle', 'normal', 'strong']

const EDGE_STYLES: EdgeStyle[] = ['solid', 'dashed', 'dotted']
const EDGE_DIRECTIONS: EdgeDirection[] = ['forward', 'backward', 'both', 'none']

interface NodePanelProps {
  node: StandardFlowNode
  isDark: boolean
  onChange: (patch: Partial<StandardFlowNode['data']>) => void
  onDelete: () => void
}

interface EdgePanelProps {
  edge: StandardFlowEdge
  onChange: (patch: { label?: string; style?: EdgeStyle; direction?: EdgeDirection }) => void
  onDelete: () => void
}

export function NodePropertiesPanel({
  node,
  isDark,
  onChange,
  onDelete,
}: NodePanelProps) {
  const data = node.data
  return (
    <Section title="Node">
      <Field label="Label">
        <Input
          value={data.label}
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={data.description ?? ''}
          rows={2}
          placeholder="Optional subtitle"
          onChange={(e) => onChange({ description: e.target.value || undefined })}
        />
      </Field>
      <Field label="Shape">
        <div className="grid grid-cols-3 gap-1.5">
          {SHAPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange({ shape: s.value })}
              className={cn(
                'rounded-md border px-2 py-1.5 text-xs transition-colors',
                data.shape === s.value
                  ? 'border-[var(--color-foreground)] bg-[var(--color-secondary)]'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Color">
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((c) => {
            const t = tokensFor(c, isDark)
            const active = (data.color ?? 'default') === c
            return (
              <button
                key={c}
                type="button"
                aria-label={c}
                title={c}
                onClick={() => onChange({ color: c })}
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border transition-colors',
                  active
                    ? 'border-[var(--color-foreground)] ring-2 ring-[var(--color-foreground)]/20'
                    : 'border-[var(--color-border)]',
                )}
                style={{ background: t.fill }}
              >
                <span
                  className="block size-3 rounded-full"
                  style={{ background: t.accent }}
                />
              </button>
            )
          })}
        </div>
      </Field>
      <Field label="Emphasis">
        <div className="grid grid-cols-3 gap-1.5">
          {EMPHASES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange({ emphasis: e })}
              className={cn(
                'rounded-md border px-2 py-1.5 text-xs capitalize transition-colors',
                data.emphasis === e
                  ? 'border-[var(--color-foreground)] bg-[var(--color-secondary)]'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]',
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </Field>
      <Separator />
      <Button variant="outline" onClick={onDelete} className="gap-2">
        <Trash2 />
        Delete node
      </Button>
    </Section>
  )
}

export function EdgePropertiesPanel({
  edge,
  onChange,
  onDelete,
}: EdgePanelProps) {
  const data = edge.data
  return (
    <Section title="Edge">
      <Field label="Label">
        <Input
          value={typeof edge.label === 'string' ? edge.label : ''}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Optional"
        />
      </Field>
      <Field label="Style">
        <div className="grid grid-cols-3 gap-1.5">
          {EDGE_STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ style: s })}
              className={cn(
                'rounded-md border px-2 py-1.5 text-xs capitalize transition-colors',
                (data?.style ?? 'solid') === s
                  ? 'border-[var(--color-foreground)] bg-[var(--color-secondary)]'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Direction">
        <div className="grid grid-cols-2 gap-1.5">
          {EDGE_DIRECTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ direction: d })}
              className={cn(
                'rounded-md border px-2 py-1.5 text-xs capitalize transition-colors',
                (data?.direction ?? 'forward') === d
                  ? 'border-[var(--color-foreground)] bg-[var(--color-secondary)]'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </Field>
      <Separator />
      <Button variant="outline" onClick={onDelete} className="gap-2">
        <Trash2 />
        Delete edge
      </Button>
    </Section>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-foreground)]">
      <span>{label}</span>
      {children}
    </label>
  )
}
