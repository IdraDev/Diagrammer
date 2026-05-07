import type { MapEdge, MapNode, MapDocument } from './schema'

export interface LaidOutNode extends MapNode {
  x: number
  y: number
  width: number
  height: number
}

export interface LaidOutMap {
  nodes: LaidOutNode[]
  edges: MapEdge[]
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

const NODE_PAD_X = 24
const MIN_NODE_WIDTH = 120
const NODE_HEIGHT_BASE = 44
const DESCRIPTION_LINE_HEIGHT = 16

/** Approximate text width based on character heuristic; adequate for layout. */
function approxLabelWidth(label: string): number {
  // average ~7.6px/char for 14px Inter
  return Math.ceil(label.length * 7.6)
}

export function measureNode(n: MapNode): { width: number; height: number } {
  const labelWidth = approxLabelWidth(n.label)
  const descWidth = n.description ? approxLabelWidth(n.description) : 0
  const width = Math.max(
    MIN_NODE_WIDTH,
    Math.min(280, Math.max(labelWidth, descWidth) + NODE_PAD_X * 2),
  )
  const descLines = n.description
    ? Math.ceil(approxLabelWidth(n.description) / (width - NODE_PAD_X * 2))
    : 0
  const height =
    NODE_HEIGHT_BASE + (descLines > 0 ? descLines * DESCRIPTION_LINE_HEIGHT + 8 : 0)
  return { width, height: Math.min(height, 140) }
}

interface Adjacency {
  outgoing: Map<string, string[]>
  incoming: Map<string, string[]>
  byId: Map<string, MapNode>
}

function buildAdjacency(map: MapDocument): Adjacency {
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  const byId = new Map<string, MapNode>()
  for (const n of map.nodes) {
    byId.set(n.id, n)
    outgoing.set(n.id, [])
    incoming.set(n.id, [])
  }
  for (const e of map.edges) {
    if (!byId.has(e.from) || !byId.has(e.to)) continue
    outgoing.get(e.from)!.push(e.to)
    incoming.get(e.to)!.push(e.from)
  }
  return { outgoing, incoming, byId }
}

function findRoots(map: MapDocument, adj: Adjacency): string[] {
  // Prefer nodes with no incoming edges. If none (cycle), pick the first node.
  const roots: string[] = []
  for (const n of map.nodes) {
    if ((adj.incoming.get(n.id) ?? []).length === 0) {
      roots.push(n.id)
    }
  }
  if (roots.length === 0 && map.nodes.length > 0) roots.push(map.nodes[0].id)
  return roots
}

function buildHierarchy(map: MapDocument, adj: Adjacency) {
  // Tree/mindmap: children inferred from `parent` hint or first incoming/outgoing edges.
  const children = new Map<string, string[]>()
  for (const n of map.nodes) children.set(n.id, [])

  const explicitParent = new Map<string, string>()
  for (const n of map.nodes) {
    if (n.parent && adj.byId.has(n.parent)) {
      explicitParent.set(n.id, n.parent)
      children.get(n.parent)!.push(n.id)
    }
  }

  const visited = new Set<string>()
  // Use BFS from roots, attaching unvisited via outgoing edges.
  const roots = findRoots(map, adj)
  const queue: string[] = [...roots]
  for (const r of roots) visited.add(r)

  while (queue.length > 0) {
    const id = queue.shift()!
    const outs = adj.outgoing.get(id) ?? []
    for (const child of outs) {
      if (visited.has(child)) continue
      if (!explicitParent.has(child)) {
        children.get(id)!.push(child)
      }
      visited.add(child)
      queue.push(child)
    }
  }

  // Any leftover (disconnected) nodes attach to the first root.
  for (const n of map.nodes) {
    if (!visited.has(n.id) && !explicitParent.has(n.id)) {
      const r = roots[0]
      if (r && r !== n.id) {
        children.get(r)!.push(n.id)
        visited.add(n.id)
      }
    }
  }

  return { roots, children }
}

// ---- Tree (top-down) ----
function layoutTree(map: MapDocument, adj: Adjacency): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const { roots, children } = buildHierarchy(map, adj)

  const sizes = new Map<string, { width: number; height: number }>()
  for (const n of map.nodes) sizes.set(n.id, measureNode(n))

  const H_GAP = 32
  const V_GAP = 80

  function subtreeWidth(id: string): number {
    const kids = children.get(id) ?? []
    if (kids.length === 0) return sizes.get(id)!.width
    const sum = kids.reduce((acc, c) => acc + subtreeWidth(c), 0) + H_GAP * (kids.length - 1)
    return Math.max(sum, sizes.get(id)!.width)
  }

  function place(id: string, leftX: number, depth: number) {
    const kids = children.get(id) ?? []
    const w = subtreeWidth(id)
    const ownW = sizes.get(id)!.width
    const ownH = sizes.get(id)!.height

    if (kids.length === 0) {
      positions.set(id, {
        x: leftX + (w - ownW) / 2 + ownW / 2,
        y: depth * (V_GAP + ownH) + ownH / 2,
      })
      return
    }

    let cursor = leftX
    for (const c of kids) {
      const cw = subtreeWidth(c)
      place(c, cursor, depth + 1)
      cursor += cw + H_GAP
    }

    const first = positions.get(kids[0])!
    const last = positions.get(kids[kids.length - 1])!
    positions.set(id, {
      x: (first.x + last.x) / 2,
      y: depth * (V_GAP + ownH) + ownH / 2,
    })
  }

  let x = 0
  for (const r of roots) {
    place(r, x, 0)
    x += subtreeWidth(r) + 80
  }
  return positions
}

// ---- Mindmap (radial) ----
function layoutMindmap(map: MapDocument, adj: Adjacency): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const { roots, children } = buildHierarchy(map, adj)

  // Use first root as the centre; if multiple, lay them out as siblings of a virtual centre.
  const root = roots[0]
  if (!root) return positions

  positions.set(root, { x: 0, y: 0 })

  function leafCount(id: string): number {
    const kids = children.get(id) ?? []
    if (kids.length === 0) return 1
    return kids.reduce((acc, c) => acc + leafCount(c), 0)
  }

  function place(id: string, startAngle: number, endAngle: number, radius: number, depth: number) {
    const kids = children.get(id) ?? []
    if (kids.length === 0) return

    const totalLeaves = kids.reduce((acc, c) => acc + leafCount(c), 0) || 1
    let cursor = startAngle
    for (const c of kids) {
      const span = ((endAngle - startAngle) * leafCount(c)) / totalLeaves
      const angle = cursor + span / 2
      const r = radius
      positions.set(c, { x: Math.cos(angle) * r, y: Math.sin(angle) * r })
      const childRadius = radius + 200 + depth * 40
      place(c, cursor, cursor + span, childRadius, depth + 1)
      cursor += span
    }
  }

  // Lay out the first root's children all around (full circle).
  place(root, -Math.PI, Math.PI, 220, 0)

  // Any extra roots: stack them off to the side.
  for (let i = 1; i < roots.length; i++) {
    const r = roots[i]
    positions.set(r, { x: 0, y: 600 + (i - 1) * 320 })
    place(r, -Math.PI, Math.PI, 220, 0)
  }
  return positions
}

// ---- Flowchart (layered) ----
function layoutFlowchart(map: MapDocument, adj: Adjacency): Map<string, { x: number; y: number }> {
  const layer = new Map<string, number>()
  for (const id of adj.byId.keys()) layer.set(id, 0)

  // Topological-ish: longest path from any root. Cap per-node layer at N-1
  // so cyclic graphs (e.g. flowchart with retry edges) terminate cleanly.
  const roots = findRoots(map, adj)
  const queue: string[] = [...roots]
  const maxLayer = Math.max(0, map.nodes.length - 1)
  while (queue.length > 0) {
    const id = queue.shift()!
    const cur = layer.get(id)!
    if (cur >= maxLayer) continue
    const candidate = cur + 1
    for (const out of adj.outgoing.get(id) ?? []) {
      if (candidate > (layer.get(out) ?? 0)) {
        layer.set(out, candidate)
        queue.push(out)
      }
    }
  }

  // Group by layer, preserving insertion order.
  const layers = new Map<number, string[]>()
  for (const n of map.nodes) {
    const l = layer.get(n.id) ?? 0
    if (!layers.has(l)) layers.set(l, [])
    layers.get(l)!.push(n.id)
  }

  const sizes = new Map<string, { width: number; height: number }>()
  for (const n of map.nodes) sizes.set(n.id, measureNode(n))

  const H_GAP = 40
  const V_GAP = 80

  const positions = new Map<string, { x: number; y: number }>()
  const sortedLayers = [...layers.keys()].sort((a, b) => a - b)

  // Compute the y per layer using max height in layer.
  let y = 0
  for (const l of sortedLayers) {
    const ids = layers.get(l)!
    const maxH = Math.max(...ids.map((id) => sizes.get(id)!.height))
    const widths = ids.map((id) => sizes.get(id)!.width)
    const totalW = widths.reduce((a, b) => a + b, 0) + H_GAP * (ids.length - 1)
    let x = -totalW / 2
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      const w = widths[i]
      positions.set(id, { x: x + w / 2, y: y + maxH / 2 })
      x += w + H_GAP
    }
    y += maxH + V_GAP
  }

  return positions
}

// ---- Timeline (linear) ----
function layoutTimeline(map: MapDocument, adj: Adjacency): Map<string, { x: number; y: number }> {
  // Order by topological order if possible, else original order.
  const order: string[] = []
  const remaining = new Set(map.nodes.map((n) => n.id))
  const indeg = new Map<string, number>()
  for (const id of remaining) indeg.set(id, (adj.incoming.get(id) ?? []).length)

  const queue: string[] = []
  for (const n of map.nodes) {
    if ((indeg.get(n.id) ?? 0) === 0) queue.push(n.id)
  }
  while (queue.length > 0) {
    const id = queue.shift()!
    if (!remaining.has(id)) continue
    remaining.delete(id)
    order.push(id)
    for (const out of adj.outgoing.get(id) ?? []) {
      indeg.set(out, (indeg.get(out) ?? 0) - 1)
      if ((indeg.get(out) ?? 0) === 0) queue.push(out)
    }
  }
  // Append any remaining in original order (cycles).
  for (const n of map.nodes) {
    if (remaining.has(n.id)) order.push(n.id)
  }

  const positions = new Map<string, { x: number; y: number }>()
  const sizes = new Map<string, { width: number; height: number }>()
  for (const n of map.nodes) sizes.set(n.id, measureNode(n))

  const H_GAP = 56
  let x = 0
  for (const id of order) {
    const s = sizes.get(id)!
    positions.set(id, { x: x + s.width / 2, y: 0 })
    x += s.width + H_GAP
  }
  return positions
}

// ---- Graph / Concept (force-directed) ----
function layoutForce(map: MapDocument): Map<string, { x: number; y: number }> {
  const ids = map.nodes.map((n) => n.id)
  const N = ids.length
  if (N === 0) return new Map()

  // Initialise on a circle for stable convergence.
  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>()
  const radius = 60 + N * 18
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2
    positions.set(ids[i], {
      x: Math.cos(a) * radius,
      y: Math.sin(a) * radius,
      vx: 0,
      vy: 0,
    })
  }

  const idealLen = 180
  const k = 0.04 // spring stiffness
  const repulsion = 9000

  const iterations = 220
  for (let it = 0; it < iterations; it++) {
    const t = 1 - it / iterations // cooling
    // Repulsion: O(N^2)
    for (let i = 0; i < N; i++) {
      const a = positions.get(ids[i])!
      for (let j = i + 1; j < N; j++) {
        const b = positions.get(ids[j])!
        let dx = a.x - b.x
        let dy = a.y - b.y
        let dsq = dx * dx + dy * dy
        if (dsq < 1) {
          dx = Math.random() - 0.5
          dy = Math.random() - 0.5
          dsq = dx * dx + dy * dy + 0.001
        }
        const force = repulsion / dsq
        const d = Math.sqrt(dsq)
        const fx = (dx / d) * force
        const fy = (dy / d) * force
        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      }
    }
    // Spring attraction along edges
    for (const e of map.edges) {
      const a = positions.get(e.from)
      const b = positions.get(e.to)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const disp = (dist - idealLen) * k
      const fx = (dx / dist) * disp
      const fy = (dy / dist) * disp
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    }
    // Apply with damping; clamp velocities.
    const damping = 0.78
    for (const id of ids) {
      const p = positions.get(id)!
      const vmag = Math.hypot(p.vx, p.vy)
      const cap = 28 * t + 4
      if (vmag > cap) {
        p.vx = (p.vx / vmag) * cap
        p.vy = (p.vy / vmag) * cap
      }
      p.x += p.vx
      p.y += p.vy
      p.vx *= damping
      p.vy *= damping
    }
  }

  const out = new Map<string, { x: number; y: number }>()
  for (const id of ids) {
    const p = positions.get(id)!
    out.set(id, { x: p.x, y: p.y })
  }
  return out
}

function runLayout(map: MapDocument): Map<string, { x: number; y: number }> {
  const adj = buildAdjacency(map)
  switch (map.type) {
    case 'tree':
      return layoutTree(map, adj)
    case 'mindmap':
      return layoutMindmap(map, adj)
    case 'flowchart':
      return layoutFlowchart(map, adj)
    case 'timeline':
      return layoutTimeline(map, adj)
    case 'graph':
    case 'concept':
    default:
      return layoutForce(map)
  }
}

/**
 * Split a map into connected components (treating edges + parent hints as
 * undirected links). Returns one MapDocument per component, in original node
 * order. Returns the original map untouched if there's only one component.
 */
function findComponents(map: MapDocument): MapDocument[] {
  const adj = new Map<string, Set<string>>()
  for (const n of map.nodes) adj.set(n.id, new Set())
  for (const e of map.edges) {
    if (!adj.has(e.from) || !adj.has(e.to)) continue
    adj.get(e.from)!.add(e.to)
    adj.get(e.to)!.add(e.from)
  }
  for (const n of map.nodes) {
    if (n.parent && adj.has(n.parent)) {
      adj.get(n.id)!.add(n.parent)
      adj.get(n.parent)!.add(n.id)
    }
  }

  const visited = new Set<string>()
  const groups: string[][] = []
  for (const n of map.nodes) {
    if (visited.has(n.id)) continue
    const stack = [n.id]
    const grp: string[] = []
    while (stack.length > 0) {
      const id = stack.pop()!
      if (visited.has(id)) continue
      visited.add(id)
      grp.push(id)
      for (const nb of adj.get(id) ?? []) {
        if (!visited.has(nb)) stack.push(nb)
      }
    }
    groups.push(grp)
  }

  if (groups.length <= 1) return [map]

  return groups.map((grp) => {
    const ids = new Set(grp)
    return {
      ...map,
      nodes: map.nodes.filter((n) => ids.has(n.id)),
      edges: map.edges.filter((e) => ids.has(e.from) && ids.has(e.to)),
    }
  })
}

/**
 * Lay out each connected component independently, then pack components in a
 * row with padding so disconnected sub-diagrams coexist on the same canvas
 * without overlap. Vertically centred around y=0.
 */
function deterministicLayout(map: MapDocument): Map<string, { x: number; y: number }> {
  const components = findComponents(map)
  if (components.length === 1) return runLayout(components[0])

  const COMPONENT_GAP = 140
  const final = new Map<string, { x: number; y: number }>()
  let cursorX = 0

  for (const comp of components) {
    const positions = runLayout(comp)
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const n of comp.nodes) {
      const p = positions.get(n.id) ?? { x: 0, y: 0 }
      const s = measureNode(n)
      minX = Math.min(minX, p.x - s.width / 2)
      maxX = Math.max(maxX, p.x + s.width / 2)
      minY = Math.min(minY, p.y - s.height / 2)
      maxY = Math.max(maxY, p.y + s.height / 2)
    }
    if (!isFinite(minX)) {
      minX = 0
      maxX = 0
      minY = 0
      maxY = 0
    }
    const dx = cursorX - minX
    const dy = -(minY + maxY) / 2
    for (const n of comp.nodes) {
      const p = positions.get(n.id) ?? { x: 0, y: 0 }
      final.set(n.id, { x: p.x + dx, y: p.y + dy })
    }
    cursorX += maxX - minX + COMPONENT_GAP
  }
  return final
}

/**
 * Iteratively push apart any nodes whose AABBs overlap. Acts as a safety net
 * over both auto-layout output and hand-authored `x`/`y` coordinates so loaded
 * maps never render with stacked nodes. Smaller-axis separation keeps motion
 * minimal — nodes shift the shortest distance needed to clear.
 */
function resolveOverlaps(nodes: LaidOutNode[]) {
  // Small pad so the safety net only fires on actual overlap or near-touch,
  // and doesn't perturb hand-placed nodes the user spaced tightly on purpose.
  const PAD = 4
  const MAX_ITER = 60
  for (let iter = 0; iter < MAX_ITER; iter++) {
    let moved = false
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const minDx = (a.width + b.width) / 2 + PAD
        const minDy = (a.height + b.height) / 2 + PAD
        const overlapX = minDx - Math.abs(dx)
        const overlapY = minDy - Math.abs(dy)
        if (overlapX <= 0 || overlapY <= 0) continue
        moved = true
        if (overlapX < overlapY) {
          const sign = dx === 0 ? (i < j ? -1 : 1) : Math.sign(dx)
          const shift = overlapX / 2
          a.x -= sign * shift
          b.x += sign * shift
        } else {
          const sign = dy === 0 ? (i < j ? -1 : 1) : Math.sign(dy)
          const shift = overlapY / 2
          a.y -= sign * shift
          b.y += sign * shift
        }
      }
    }
    if (!moved) break
  }
}

export function layoutMap(map: MapDocument): LaidOutMap {
  const computed = deterministicLayout(map)

  const nodes: LaidOutNode[] = map.nodes.map((n) => {
    const { width, height } = measureNode(n)
    const c = computed.get(n.id) ?? { x: 0, y: 0 }
    const x = typeof n.x === 'number' ? n.x : c.x
    const y = typeof n.y === 'number' ? n.y : c.y
    return { ...n, x, y, width, height }
  })

  resolveOverlaps(nodes)

  // Compute bounds with padding.
  const PAD = 80
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    minX = Math.min(minX, n.x - n.width / 2)
    minY = Math.min(minY, n.y - n.height / 2)
    maxX = Math.max(maxX, n.x + n.width / 2)
    maxY = Math.max(maxY, n.y + n.height / 2)
  }
  if (!isFinite(minX)) {
    minX = -200
    minY = -200
    maxX = 200
    maxY = 200
  }

  return {
    nodes,
    edges: map.edges,
    bounds: {
      minX: minX - PAD,
      minY: minY - PAD,
      maxX: maxX + PAD,
      maxY: maxY + PAD,
    },
  }
}
