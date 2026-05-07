import { memo, useContext } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import type { StandardFlowEdge } from '@/lib/flow-adapter'
import { FlowContext } from './flow-context'
import { InlineMarkdown } from '@/lib/markdown'

function StandardEdgeImpl({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  selected,
}: EdgeProps<StandardFlowEdge>) {
  const { isDark } = useContext(FlowContext)
  const direction = data?.direction ?? 'forward'
  const style = data?.style ?? 'solid'

  const baseColor = isDark ? 'hsl(240 5% 60%)' : 'hsl(240 6% 38%)'
  const stroke = selected ? (isDark ? 'hsl(0 0% 96%)' : 'hsl(240 10% 12%)') : baseColor

  const dasharray =
    style === 'dashed' ? '6 4' : style === 'dotted' ? '1.5 4' : undefined

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.25,
  })

  const showStartArrow = direction === 'backward' || direction === 'both'
  const showEndArrow = direction === 'forward' || direction === 'both'

  return (
    <>
      <defs>
        <marker
          id={`arrow-end-${id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
        </marker>
        <marker
          id={`arrow-start-${id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke,
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray: dasharray,
        }}
        markerStart={showStartArrow ? `url(#arrow-start-${id})` : undefined}
        markerEnd={showEndArrow ? `url(#arrow-end-${id})` : undefined}
      />
      {typeof label === 'string' && label.length > 0 ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: 'var(--color-background)',
              color: 'var(--color-foreground)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
              padding: '1px 6px',
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            <InlineMarkdown text={label} />
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}

export const StandardEdge = memo(StandardEdgeImpl)
