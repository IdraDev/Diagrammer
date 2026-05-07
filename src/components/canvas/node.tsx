import type { LaidOutNode } from '@/lib/layouts'
import { tokensFor } from '@/lib/palette'
import { NodeShape } from './node-shape'

interface NodeProps {
  node: LaidOutNode
  isDark: boolean
}

/**
 * Wrap label text into multiple <tspan> rows so long labels don't escape
 * the shape. We measure approximately by character count.
 */
function wrapLabel(label: string, maxChars: number): string[] {
  if (label.length <= maxChars) return [label]
  const words = label.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxChars) {
      current = (current + ' ' + w).trim()
    } else {
      if (current) lines.push(current)
      current = w
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 3) // cap at 3 lines
}

export function NodeView({ node, isDark }: NodeProps) {
  const tokens = tokensFor(node.color, isDark)
  const charBudget = Math.max(8, Math.floor((node.width - 40) / 7.4))
  const lines = wrapLabel(node.label, charBudget)
  const lineHeight = 16
  const totalH = lines.length * lineHeight
  const labelStartY = -totalH / 2 + lineHeight / 2 - (node.description ? 8 : 0)

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ pointerEvents: 'auto' }}
    >
      <NodeShape node={node} tokens={tokens} />
      <g style={{ pointerEvents: 'none' }}>
        {lines.map((line, i) => (
          <text
            key={i}
            x={0}
            y={labelStartY + i * lineHeight}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={14}
            fontWeight={node.emphasis === 'strong' ? 600 : 500}
            fill={tokens.text}
            fontFamily="var(--font-sans)"
          >
            {line}
          </text>
        ))}
        {node.description ? (
          <text
            x={0}
            y={labelStartY + lines.length * lineHeight + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill={tokens.accent}
            fontFamily="var(--font-sans)"
          >
            {truncate(node.description, charBudget + 4)}
          </text>
        ) : null}
      </g>
    </g>
  )
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s
  return s.slice(0, n - 1).trimEnd() + '…'
}
