/**
 * Makemeamap JSON schema.
 *
 * A map describes a labelled set of nodes connected by edges, plus a
 * `type` hint that the viewer uses to pick a layout.
 *
 * Files written by an LLM should set `version: "1"` and supply at minimum
 * `type`, `title`, `nodes`, and `edges`. Positions (`x`, `y`) are optional;
 * if absent the viewer will compute them automatically.
 */

export const SCHEMA_VERSION = '1' as const

export type MapType =
  | 'mindmap'
  | 'tree'
  | 'flowchart'
  | 'graph'
  | 'concept'
  | 'timeline'

export const MAP_TYPES: readonly MapType[] = [
  'mindmap',
  'tree',
  'flowchart',
  'graph',
  'concept',
  'timeline',
] as const

export type NodeShape =
  | 'rectangle'
  | 'rounded'
  | 'ellipse'
  | 'diamond'
  | 'hexagon'
  | 'pill'

export type NodeColor =
  | 'default'
  | 'slate'
  | 'blue'
  | 'green'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'cyan'

export type NodeEmphasis = 'normal' | 'strong' | 'subtle'

export type EdgeStyle = 'solid' | 'dashed' | 'dotted'
export type EdgeDirection = 'forward' | 'backward' | 'both' | 'none'

export interface MapNode {
  id: string
  label: string
  description?: string
  shape?: NodeShape
  color?: NodeColor
  emphasis?: NodeEmphasis
  x?: number
  y?: number
  /** Hint for hierarchical layouts (mindmap/tree). Ignored otherwise. */
  parent?: string
}

export interface MapEdge {
  id?: string
  from: string
  to: string
  label?: string
  style?: EdgeStyle
  direction?: EdgeDirection
}

export interface MapDocument {
  version: typeof SCHEMA_VERSION
  type: MapType
  title: string
  description?: string
  nodes: MapNode[]
  edges: MapEdge[]
  meta?: {
    author?: string
    createdAt?: string
    tags?: string[]
  }
}

export interface ValidationIssue {
  path: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  map?: MapDocument
  issues: ValidationIssue[]
}

const VALID_SHAPES: ReadonlySet<NodeShape> = new Set([
  'rectangle',
  'rounded',
  'ellipse',
  'diamond',
  'hexagon',
  'pill',
])

const VALID_COLORS: ReadonlySet<NodeColor> = new Set([
  'default',
  'slate',
  'blue',
  'green',
  'amber',
  'rose',
  'violet',
  'cyan',
])

const VALID_EMPHASIS: ReadonlySet<NodeEmphasis> = new Set([
  'normal',
  'strong',
  'subtle',
])

const VALID_STYLES: ReadonlySet<EdgeStyle> = new Set([
  'solid',
  'dashed',
  'dotted',
])

const VALID_DIRECTIONS: ReadonlySet<EdgeDirection> = new Set([
  'forward',
  'backward',
  'both',
  'none',
])

const VALID_TYPES: ReadonlySet<MapType> = new Set(MAP_TYPES)

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function validateMap(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = []

  if (!isObject(input)) {
    return {
      ok: false,
      issues: [{ path: '$', message: 'Map must be a JSON object.' }],
    }
  }

  const root = input

  if (root.version !== SCHEMA_VERSION) {
    issues.push({
      path: 'version',
      message: `Unsupported version: expected "${SCHEMA_VERSION}".`,
    })
  }

  if (typeof root.title !== 'string' || root.title.length === 0) {
    issues.push({ path: 'title', message: 'Title must be a non-empty string.' })
  }

  if (typeof root.type !== 'string' || !VALID_TYPES.has(root.type as MapType)) {
    issues.push({
      path: 'type',
      message: `Type must be one of: ${[...VALID_TYPES].join(', ')}.`,
    })
  }

  if (!Array.isArray(root.nodes)) {
    issues.push({ path: 'nodes', message: 'Nodes must be an array.' })
  }
  if (!Array.isArray(root.edges)) {
    issues.push({ path: 'edges', message: 'Edges must be an array.' })
  }

  if (issues.length > 0) {
    return { ok: false, issues }
  }

  const nodes: MapNode[] = []
  const seen = new Set<string>()

  for (let i = 0; i < (root.nodes as unknown[]).length; i++) {
    const raw = (root.nodes as unknown[])[i]
    const path = `nodes[${i}]`
    if (!isObject(raw)) {
      issues.push({ path, message: 'Node must be an object.' })
      continue
    }
    const id = raw.id
    if (typeof id !== 'string' || id.length === 0) {
      issues.push({ path: `${path}.id`, message: 'Node id must be a non-empty string.' })
      continue
    }
    if (seen.has(id)) {
      issues.push({ path: `${path}.id`, message: `Duplicate node id "${id}".` })
      continue
    }
    seen.add(id)

    const label = raw.label
    if (typeof label !== 'string') {
      issues.push({ path: `${path}.label`, message: 'Node label must be a string.' })
      continue
    }

    const node: MapNode = { id, label }
    if (typeof raw.description === 'string') node.description = raw.description
    if (typeof raw.shape === 'string' && VALID_SHAPES.has(raw.shape as NodeShape))
      node.shape = raw.shape as NodeShape
    if (typeof raw.color === 'string' && VALID_COLORS.has(raw.color as NodeColor))
      node.color = raw.color as NodeColor
    if (
      typeof raw.emphasis === 'string' &&
      VALID_EMPHASIS.has(raw.emphasis as NodeEmphasis)
    )
      node.emphasis = raw.emphasis as NodeEmphasis
    if (typeof raw.x === 'number' && Number.isFinite(raw.x)) node.x = raw.x
    if (typeof raw.y === 'number' && Number.isFinite(raw.y)) node.y = raw.y
    if (typeof raw.parent === 'string') node.parent = raw.parent

    nodes.push(node)
  }

  const edges: MapEdge[] = []
  for (let i = 0; i < (root.edges as unknown[]).length; i++) {
    const raw = (root.edges as unknown[])[i]
    const path = `edges[${i}]`
    if (!isObject(raw)) {
      issues.push({ path, message: 'Edge must be an object.' })
      continue
    }
    const from = raw.from
    const to = raw.to
    if (typeof from !== 'string' || typeof to !== 'string') {
      issues.push({
        path,
        message: 'Edge "from" and "to" must be node id strings.',
      })
      continue
    }
    if (!seen.has(from)) {
      issues.push({
        path: `${path}.from`,
        message: `Edge references missing node "${from}".`,
      })
    }
    if (!seen.has(to)) {
      issues.push({
        path: `${path}.to`,
        message: `Edge references missing node "${to}".`,
      })
    }

    const edge: MapEdge = { from, to }
    if (typeof raw.id === 'string') edge.id = raw.id
    if (typeof raw.label === 'string') edge.label = raw.label
    if (typeof raw.style === 'string' && VALID_STYLES.has(raw.style as EdgeStyle))
      edge.style = raw.style as EdgeStyle
    if (
      typeof raw.direction === 'string' &&
      VALID_DIRECTIONS.has(raw.direction as EdgeDirection)
    )
      edge.direction = raw.direction as EdgeDirection
    edges.push(edge)
  }

  // Parent references
  for (const n of nodes) {
    if (n.parent && !seen.has(n.parent)) {
      issues.push({
        path: `nodes[${n.id}].parent`,
        message: `Parent references missing node "${n.parent}".`,
      })
    }
  }

  if (issues.length > 0 && issues.some((i) => i.message.startsWith('Edge references') || i.message.startsWith('Parent references'))) {
    // Soft errors — keep map but report
  }

  if (issues.filter((i) => !i.message.startsWith('Edge references') && !i.message.startsWith('Parent references') && !i.message.startsWith('Duplicate node id')).length > 0) {
    return { ok: false, issues }
  }

  const meta = isObject(root.meta) ? (root.meta as MapDocument['meta']) : undefined

  const map: MapDocument = {
    version: SCHEMA_VERSION,
    type: root.type as MapType,
    title: root.title as string,
    description:
      typeof root.description === 'string' ? root.description : undefined,
    nodes,
    edges,
    meta,
  }

  return { ok: true, map, issues }
}

export function tryParseMap(text: string): ValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON.'
    return { ok: false, issues: [{ path: '$', message }] }
  }
  return validateMap(parsed)
}
