import type { LaidOutNode } from '@/lib/layouts'
import type { MapEdge } from '@/lib/schema'

interface EdgeProps {
  edge: MapEdge
  from: LaidOutNode
  to: LaidOutNode
  stroke: string
  textColor: string
}

function trimToBox(
  cx: number,
  cy: number,
  w: number,
  h: number,
  tx: number,
  ty: number,
): { x: number; y: number } {
  const dx = tx - cx
  const dy = ty - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const halfW = w / 2 + 4
  const halfH = h / 2 + 4
  const sx = dx === 0 ? Infinity : halfW / Math.abs(dx)
  const sy = dy === 0 ? Infinity : halfH / Math.abs(dy)
  const t = Math.min(sx, sy)
  return { x: cx + dx * t, y: cy + dy * t }
}

export function Edge({ edge, from, to, stroke, textColor }: EdgeProps) {
  const start = trimToBox(from.x, from.y, from.width, from.height, to.x, to.y)
  const end = trimToBox(to.x, to.y, to.width, to.height, from.x, from.y)

  const direction = edge.direction ?? 'forward'
  const style = edge.style ?? 'solid'
  const dash =
    style === 'dashed' ? '6 4' : style === 'dotted' ? '1.5 4' : undefined

  const id = `${edge.from}-${edge.to}-${edge.id ?? ''}`
  const markerStart =
    direction === 'backward' || direction === 'both' ? `url(#arrow-${id})` : undefined
  const markerEnd =
    direction === 'forward' || direction === 'both' ? `url(#arrow-${id})` : undefined

  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2

  return (
    <g>
      <defs>
        <marker
          id={`arrow-${id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
        </marker>
      </defs>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={stroke}
        strokeWidth={1.4}
        strokeDasharray={dash}
        markerStart={markerStart}
        markerEnd={markerEnd}
        strokeLinecap="round"
      />
      {edge.label ? (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-edge.label.length * 3.4 - 6}
            y={-9}
            width={edge.label.length * 6.8 + 12}
            height={18}
            rx={4}
            fill="var(--color-background)"
            opacity={0.92}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill={textColor}
            fontFamily="var(--font-sans)"
          >
            {edge.label}
          </text>
        </g>
      ) : null}
    </g>
  )
}
