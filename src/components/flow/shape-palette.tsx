import { useEffect, useRef } from 'react'
import { useDrag } from 'react-dnd'
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { NodeShape } from '@/lib/schema'

export const SHAPE_DRAG_TYPE = 'diagrammer/shape'

export interface ShapeDragItem {
  shape: NodeShape
}

interface ShapePaletteProps {
  /** Click handler — adds a node of the given shape at viewport center. */
  onClick: (shape: NodeShape) => void
}

const SHAPES: { shape: NodeShape; label: string }[] = [
  { shape: 'rounded', label: 'Rounded' },
  { shape: 'rectangle', label: 'Rectangle' },
  { shape: 'pill', label: 'Pill' },
  { shape: 'ellipse', label: 'Ellipse' },
  { shape: 'diamond', label: 'Diamond' },
  { shape: 'hexagon', label: 'Hexagon' },
]

export function ShapePalette({ onClick }: ShapePaletteProps) {
  return (
    <TooltipProvider>
      <div
        role="toolbar"
        aria-label="Shape palette"
        className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/90 p-1 shadow-sm backdrop-blur"
      >
        {SHAPES.map((s) => (
          <PaletteItem
            key={s.shape}
            shape={s.shape}
            label={s.label}
            onClick={() => onClick(s.shape)}
          />
        ))}
      </div>
    </TooltipProvider>
  )
}

function PaletteItem({
  shape,
  label,
  onClick,
}: {
  shape: NodeShape
  label: string
  onClick: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [{ isDragging }, drag] = useDrag<
    ShapeDragItem,
    unknown,
    { isDragging: boolean }
  >(
    () => ({
      type: SHAPE_DRAG_TYPE,
      item: { shape },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [shape],
  )

  useEffect(() => {
    drag(ref)
  }, [drag])

  return (
    <Tooltip label={`${label} — drag onto canvas or click`}>
      <button
        ref={ref}
        type="button"
        aria-label={`Add ${label.toLowerCase()} node`}
        onClick={onClick}
        className={cn(
          'flex size-9 cursor-pointer items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
          'active:cursor-grabbing',
          isDragging && 'opacity-40',
        )}
      >
        <ShapeGlyph shape={shape} />
      </button>
    </Tooltip>
  )
}

function ShapeGlyph({ shape }: { shape: NodeShape }) {
  const w = 22
  const h = 14
  const stroke = 'currentColor'
  const strokeWidth = 1.4
  const fill = 'none'
  switch (shape) {
    case 'rectangle':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect
            x={1}
            y={1}
            width={w - 2}
            height={h - 2}
            rx={1.5}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      )
    case 'rounded':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect
            x={1}
            y={1}
            width={w - 2}
            height={h - 2}
            rx={4}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      )
    case 'pill':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect
            x={1}
            y={1}
            width={w - 2}
            height={h - 2}
            rx={(h - 2) / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      )
    case 'ellipse':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w / 2 - 1}
            ry={h / 2 - 1}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      )
    case 'diamond':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <polygon
            points={`${w / 2},1 ${w - 1},${h / 2} ${w / 2},${h - 1} 1,${h / 2}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      )
    case 'hexagon': {
      const dx = (h - 2) / 2
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <polygon
            points={`${dx + 1},1 ${w - dx - 1},1 ${w - 1},${h / 2} ${w - dx - 1},${h - 1} ${dx + 1},${h - 1} 1,${h / 2}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      )
    }
  }
}
