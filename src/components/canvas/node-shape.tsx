import type { LaidOutNode } from '@/lib/layouts'
import type { ColorTokens } from '@/lib/palette'

interface NodeShapeProps {
  node: LaidOutNode
  tokens: ColorTokens
}

/**
 * Renders the SVG shape outline for a node, centred at (0, 0) in its own
 * group. The Node component handles positioning and label.
 */
export function NodeShape({ node, tokens }: NodeShapeProps) {
  const { width: w, height: h } = node
  const shape = node.shape ?? defaultShapeFor(node)
  const emphasis = node.emphasis ?? 'normal'

  const strokeWidth = emphasis === 'strong' ? 2 : 1.25
  const fillOpacity = emphasis === 'subtle' ? 0.6 : 1

  const common = {
    fill: tokens.fill,
    stroke: tokens.stroke,
    strokeWidth,
    fillOpacity,
  }

  switch (shape) {
    case 'ellipse':
      return <ellipse rx={w / 2} ry={h / 2} {...common} />
    case 'pill':
      return (
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={h / 2}
          ry={h / 2}
          {...common}
        />
      )
    case 'rounded':
      return (
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={12}
          ry={12}
          {...common}
        />
      )
    case 'diamond': {
      const points = `0,${-h / 2} ${w / 2},0 0,${h / 2} ${-w / 2},0`
      return <polygon points={points} {...common} />
    }
    case 'hexagon': {
      const dx = h / 2
      const points = [
        [-w / 2 + dx, -h / 2],
        [w / 2 - dx, -h / 2],
        [w / 2, 0],
        [w / 2 - dx, h / 2],
        [-w / 2 + dx, h / 2],
        [-w / 2, 0],
      ]
        .map((p) => p.join(','))
        .join(' ')
      return <polygon points={points} {...common} />
    }
    case 'rectangle':
    default:
      return (
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={4}
          ry={4}
          {...common}
        />
      )
  }
}

function defaultShapeFor(node: LaidOutNode) {
  if (node.emphasis === 'strong') return 'rounded'
  return 'rounded'
}
