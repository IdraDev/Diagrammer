import type { Edge as RFEdge, Node as RFNode } from '@xyflow/react'
import { layoutMap, measureNode, NODE_MIN_GAP } from './layouts'
import type {
  EdgeDirection,
  EdgeStyle,
  MapEdge,
  MapNode,
  NodeColor,
  NodeEmphasis,
  NodeShape,
  MapDocument,
} from './schema'

export interface StandardNodeData {
  label: string
  description?: string
  shape: NodeShape
  color: NodeColor
  emphasis: NodeEmphasis
  width: number
  height: number
  [key: string]: unknown
}

export interface StandardEdgeData {
  style: EdgeStyle
  direction: EdgeDirection
  [key: string]: unknown
}

export type StandardFlowNode = RFNode<StandardNodeData, 'standard'>
export type StandardFlowEdge = RFEdge<StandardEdgeData, 'standard'>

export interface FlowGraph {
  nodes: StandardFlowNode[]
  edges: StandardFlowEdge[]
}

/**
 * Convert a MapDocument (with auto-layout applied) to React Flow nodes/edges.
 * React Flow uses top-left positions; our layout returns node centers.
 */
export function mapToFlow(map: MapDocument): FlowGraph {
  const laid = layoutMap(map)

  const nodes: StandardFlowNode[] = laid.nodes.map((n) => ({
    id: n.id,
    type: 'standard',
    position: { x: n.x - n.width / 2, y: n.y - n.height / 2 },
    width: n.width,
    height: n.height,
    data: {
      label: n.label,
      description: n.description,
      shape: n.shape ?? 'rounded',
      color: n.color ?? 'default',
      emphasis: n.emphasis ?? 'normal',
      width: n.width,
      height: n.height,
    },
  }))

  const edges: StandardFlowEdge[] = laid.edges.map((e, i) => ({
    id: e.id ?? `e_${e.from}__${e.to}__${i}`,
    type: 'standard',
    source: e.from,
    target: e.to,
    label: e.label,
    data: {
      style: e.style ?? 'solid',
      direction: e.direction ?? 'forward',
    },
  }))

  return { nodes, edges }
}

/**
 * Build a fresh MapDocument from a previous map plus the current React Flow
 * state. Used after the user moves nodes / edits labels / connects edges.
 */
export function flowToMap(
  base: MapDocument,
  flowNodes: StandardFlowNode[],
  flowEdges: StandardFlowEdge[],
): MapDocument {
  const nodes: MapNode[] = flowNodes.map((n) => {
    const data = n.data
    const w = n.width ?? n.measured?.width ?? data.width
    const h = n.height ?? n.measured?.height ?? data.height
    const node: MapNode = {
      id: n.id,
      label: data.label,
      x: n.position.x + w / 2,
      y: n.position.y + h / 2,
    }
    if (data.description) node.description = data.description
    if (data.shape && data.shape !== 'rounded') node.shape = data.shape
    if (data.color && data.color !== 'default') node.color = data.color
    if (data.emphasis && data.emphasis !== 'normal') node.emphasis = data.emphasis
    return node
  })

  const edges: MapEdge[] = flowEdges.map((e) => {
    const data = e.data ?? { style: 'solid' as const, direction: 'forward' as const }
    const edge: MapEdge = { from: e.source, to: e.target }
    if (typeof e.id === 'string') edge.id = e.id
    if (typeof e.label === 'string' && e.label.length > 0) edge.label = e.label
    if (data.style && data.style !== 'solid') edge.style = data.style
    if (data.direction && data.direction !== 'forward') edge.direction = data.direction
    return edge
  })

  return { ...base, nodes, edges }
}

/**
 * Push apart any nodes whose AABBs (top-left position + width/height) overlap.
 * Returns a new array only when something moved; otherwise returns the input
 * reference so React can bail out cheaply. Optional `pinId` keeps that node
 * fixed (used when only one node moved — e.g. drag end — so the rest of the
 * canvas absorbs the displacement).
 */
export function deOverlapFlowNodes(
  nodes: StandardFlowNode[],
  pinId?: string,
): StandardFlowNode[] {
  if (nodes.length < 2) return nodes
  const PAD = NODE_MIN_GAP
  const MAX_ITER = 200
  type Box = { id: string; x: number; y: number; w: number; h: number; pinned: boolean }
  const boxes: Box[] = nodes.map((n) => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
    w: n.width ?? n.measured?.width ?? n.data.width,
    h: n.height ?? n.measured?.height ?? n.data.height,
    pinned: n.id === pinId,
  }))
  let anyMoved = false
  for (let iter = 0; iter < MAX_ITER; iter++) {
    let moved = false
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        const acx = a.x + a.w / 2
        const acy = a.y + a.h / 2
        const bcx = b.x + b.w / 2
        const bcy = b.y + b.h / 2
        const dx = bcx - acx
        const dy = bcy - acy
        const minDx = (a.w + b.w) / 2 + PAD
        const minDy = (a.h + b.h) / 2 + PAD
        const overlapX = minDx - Math.abs(dx)
        const overlapY = minDy - Math.abs(dy)
        if (overlapX <= 0 || overlapY <= 0) continue
        moved = true
        anyMoved = true
        // Distribute shift between the two boxes; pinned boxes don't move.
        const aShare = a.pinned ? 0 : b.pinned ? 1 : 0.5
        const bShare = b.pinned ? 0 : a.pinned ? 1 : 0.5
        if (overlapX < overlapY) {
          const sign = dx === 0 ? (i < j ? -1 : 1) : Math.sign(dx)
          a.x -= sign * overlapX * aShare
          b.x += sign * overlapX * bShare
        } else {
          const sign = dy === 0 ? (i < j ? -1 : 1) : Math.sign(dy)
          a.y -= sign * overlapY * aShare
          b.y += sign * overlapY * bShare
        }
      }
    }
    if (!moved) break
  }
  if (!anyMoved) return nodes
  return nodes.map((n, i) => {
    const b = boxes[i]
    if (b.x === n.position.x && b.y === n.position.y) return n
    return { ...n, position: { x: b.x, y: b.y } }
  })
}

/**
 * Build a MapDocument node from raw fields, using measureNode for sizing.
 * Used by the editor when adding new nodes.
 */
export function buildNode(input: {
  id: string
  label: string
  description?: string
  shape?: NodeShape
  color?: NodeColor
  emphasis?: NodeEmphasis
}): MapNode & { width: number; height: number } {
  const node: MapNode = {
    id: input.id,
    label: input.label,
  }
  if (input.description) node.description = input.description
  if (input.shape) node.shape = input.shape
  if (input.color) node.color = input.color
  if (input.emphasis) node.emphasis = input.emphasis
  const { width, height } = measureNode(node)
  return { ...node, width, height }
}
