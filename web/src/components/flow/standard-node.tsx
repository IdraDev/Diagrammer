import { memo, useContext, useEffect, useRef, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { tokensFor } from '@/lib/palette'
import type { NodeShape } from '@/lib/schema'
import type { StandardFlowNode } from '@/lib/flow-adapter'
import { FlowContext } from './flow-context'
import { cn } from '@/lib/utils'
import { InlineMarkdown } from '@/lib/markdown'

interface ShapeProps {
  width: number
  height: number
  shape: NodeShape
  fill: string
  stroke: string
  strokeWidth: number
  fillOpacity?: number
}

function ShapeSVG({
  width,
  height,
  shape,
  fill,
  stroke,
  strokeWidth,
  fillOpacity = 1,
}: ShapeProps) {
  const w = width
  const h = height
  const halfStroke = strokeWidth / 2
  const inset = halfStroke
  const common = {
    fill,
    stroke,
    strokeWidth,
    fillOpacity,
    vectorEffect: 'non-scaling-stroke' as const,
  }

  let element: React.ReactNode = null
  switch (shape) {
    case 'rectangle':
      element = (
        <rect
          x={inset}
          y={inset}
          width={w - inset * 2}
          height={h - inset * 2}
          rx={4}
          {...common}
        />
      )
      break
    case 'rounded':
      element = (
        <rect
          x={inset}
          y={inset}
          width={w - inset * 2}
          height={h - inset * 2}
          rx={12}
          {...common}
        />
      )
      break
    case 'pill':
      element = (
        <rect
          x={inset}
          y={inset}
          width={w - inset * 2}
          height={h - inset * 2}
          rx={(h - inset * 2) / 2}
          {...common}
        />
      )
      break
    case 'ellipse':
      element = (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={w / 2 - inset}
          ry={h / 2 - inset}
          {...common}
        />
      )
      break
    case 'diamond':
      element = (
        <polygon
          points={`${w / 2},${inset} ${w - inset},${h / 2} ${w / 2},${h - inset} ${inset},${h / 2}`}
          {...common}
        />
      )
      break
    case 'hexagon': {
      const dx = h / 2
      element = (
        <polygon
          points={`${dx},${inset} ${w - dx},${inset} ${w - inset},${h / 2} ${w - dx},${h - inset} ${dx},${h - inset} ${inset},${h / 2}`}
          {...common}
        />
      )
      break
    }
  }

  return (
    <svg
      width={w}
      height={h}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {element}
    </svg>
  )
}

function StandardNodeImpl({
  data,
  selected,
  id,
}: NodeProps<StandardFlowNode>) {
  const { isDark, isEditing, onNodeLabelChange } = useContext(FlowContext)
  const tokens = tokensFor(data.color, isDark)
  const { width, height } = data
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const strokeWidth = data.emphasis === 'strong' ? 2 : 1.4
  const fillOpacity = data.emphasis === 'subtle' ? 0.65 : 1

  const onDoubleClick = () => {
    if (isEditing) setEditing(true)
  }

  const commit = (value: string) => {
    setEditing(false)
    if (value.trim().length > 0 && value !== data.label) {
      onNodeLabelChange?.(id, value.trim())
    }
  }

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        color: tokens.text,
      }}
      className={cn(
        'group/node',
        selected && 'ring-2 ring-offset-2 rounded-md',
      )}
      data-selected={selected ? 'true' : undefined}
      onDoubleClick={onDoubleClick}
    >
      <ShapeSVG
        width={width}
        height={height}
        shape={data.shape}
        fill={tokens.fill}
        stroke={selected ? tokens.accent : tokens.stroke}
        strokeWidth={selected ? strokeWidth + 0.6 : strokeWidth}
        fillOpacity={fillOpacity}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 18px',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            defaultValue={data.label}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
              if (e.key === 'Escape') setEditing(false)
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            style={{
              pointerEvents: 'auto',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              textAlign: 'center',
              color: tokens.text,
              fontWeight: data.emphasis === 'strong' ? 600 : 500,
              fontSize: 14,
              fontFamily: 'inherit',
              width: '100%',
            }}
          />
        ) : (
          <>
            <InlineMarkdown
              text={data.label}
              style={{
                fontSize: 14,
                fontWeight: data.emphasis === 'strong' ? 600 : 500,
                lineHeight: '18px',
                color: tokens.text,
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
            />
            {data.description ? (
              <InlineMarkdown
                text={data.description}
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  color: tokens.accent,
                  lineHeight: '14px',
                }}
              />
            ) : null}
          </>
        )}
      </div>

      {/* Connection handles — visible only in edit mode. */}
      <NodeHandles isEditing={isEditing} accent={tokens.accent} />
    </div>
  )
}

function NodeHandles({
  isEditing,
  accent,
}: {
  isEditing: boolean
  accent: string
}) {
  const handleStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    background: accent,
    border: '1.5px solid var(--color-background)',
    opacity: isEditing ? 1 : 0,
    transition: 'opacity 120ms',
  }
  const positions: Position[] = [
    Position.Top,
    Position.Right,
    Position.Bottom,
    Position.Left,
  ]
  return (
    <>
      {positions.map((p) => (
        <span key={`${p}-pair`}>
          <Handle
            id={`${p}-source`}
            type="source"
            position={p}
            style={handleStyle}
            isConnectable={isEditing}
          />
          <Handle
            id={`${p}-target`}
            type="target"
            position={p}
            style={handleStyle}
            isConnectable={isEditing}
          />
        </span>
      ))}
    </>
  )
}

export const StandardNode = memo(StandardNodeImpl)
