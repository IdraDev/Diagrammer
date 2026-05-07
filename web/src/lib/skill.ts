/**
 * The skill text shipped to LLMs. This is the single source of truth for the
 * Diagrammer authoring contract. Treat it as a stable public document.
 */
export const SKILL_TEXT = String.raw`---
name: diagrammer
description: Author Diagrammer JSON for the Diagrammer viewer. Use whenever the user asks for a mind map, concept map, flowchart, tree, dependency graph, or timeline. Output a single JSON document conforming to the schema below.
---

# Diagrammer authoring guide

You are producing a single JSON document that the Diagrammer viewer will
render on a pannable, zoomable canvas. Do not output prose around the JSON
unless the user explicitly asks for it; emit one fenced JSON block.

## Output contract

- Top-level keys: \`version\`, \`type\`, \`title\`, \`nodes\`, \`edges\`. Optional:
  \`description\`, \`meta\`.
- \`version\` MUST be the string \`"1"\`.
- \`type\` MUST be one of: \`mindmap\`, \`tree\`, \`flowchart\`, \`graph\`,
  \`concept\`, \`timeline\`. Pick the type that matches the user's intent — see
  the guidance below.
- \`nodes[*].id\` must be unique, stable, and URL-safe (\`^[a-zA-Z0-9_-]+$\`).
- \`edges[*].from\` and \`edges[*].to\` must reference existing node ids.
- You may include \`x\` / \`y\` (in pixels, node-center coordinates) when the
  user wants a hand-tuned layout. Otherwise omit them and let the viewer
  compute positions per type. Manual edits in the viewer's edit mode write
  these coordinates back when the user moves nodes.
- **Never place two nodes so their bounding boxes overlap or touch.** When
  emitting \`x\` / \`y\`, leave at least ~16 px of clear space between every pair
  of node rectangles (treat label width × node height as the box). Nodes are
  120–280 px wide and ~44–140 px tall depending on label/description length —
  budget for the wider end. The viewer auto-separates loaded maps as a safety
  net, but author with proper spacing so labels and edge handles don't crowd.

## Choosing a type

| Type        | When to use                                                        |
| ----------- | ------------------------------------------------------------------ |
| \`mindmap\`   | Brainstorming, branches radiating from a single central topic.    |
| \`tree\`      | Strict hierarchy with one parent per child (org chart, taxonomy). |
| \`flowchart\` | Process or decision flow with directed steps.                     |
| \`graph\`     | Arbitrary network: dependencies, relationships, citations, **ER diagrams**. |
| \`concept\`   | Concept map with labelled, often bidirectional, links.            |
| \`timeline\`  | Linear sequence of events or milestones.                          |

If the user is ambiguous, ask one clarifying question — or default to
\`mindmap\` for "brainstorm" / "outline" intents, and \`flowchart\` for "process"
/ "how does X work" intents.

## Node fields

\`\`\`ts
{
  id: string                  // unique, stable, URL-safe
  label: string               // short, ideally <= 40 chars
  description?: string        // single-line subtitle, <= 80 chars
  shape?:    'rectangle' | 'rounded' | 'ellipse' | 'diamond' | 'hexagon' | 'pill'
  color?:    'default' | 'slate' | 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'cyan'
  emphasis?: 'normal' | 'strong' | 'subtle'
  parent?:   string           // hint for tree/mindmap hierarchy
}
\`\`\`

### Markdown formatting

Labels, descriptions, edge labels, and the map title render a small subset
of inline markdown. Use it to add typographic emphasis or to mark up
identifiers — not as decoration.

| Syntax           | Renders as                          |
| ---------------- | ----------------------------------- |
| \`**bold**\`        | bold text                           |
| \`*italic*\`        | italic                              |
| \`_italic_\`        | italic                              |
| \`\` \`code\` \`\`        | inline monospace, e.g. for identifiers |
| \`~~strike~~\`      | strikethrough                       |
| \`[text](url)\`     | link (opens in a new tab)           |

Nesting is allowed (\`**\`code\`**\`). Markup that doesn't match these
delimiters renders literally — no headings, lists, paragraphs, or HTML.
Avoid links inside node labels; put them in \`description\` instead.

### Visual conventions (use sparingly)

- \`emphasis: "strong"\` on the central node of a mindmap or the root of a tree.
- \`shape: "diamond"\` for decisions/branches in flowcharts.
- \`shape: "pill"\` for terminal/IO nodes (start, end, external service).
- \`color: "rose"\` for failure / error / risk nodes; \`color: "green"\` for
  success; \`color: "amber"\` for warnings or caveats. Use color to convey
  meaning, not decoration.
- Leave most nodes at \`shape: "rounded"\` and \`color: "default"\`. Restraint
  reads as design.

## Edge fields

\`\`\`ts
{
  from: string                // node id
  to:   string                // node id
  label?:     string          // edge label, e.g. "yes", "no", "depends on"
  style?:     'solid' | 'dashed' | 'dotted'
  direction?: 'forward' | 'backward' | 'both' | 'none'
}
\`\`\`

- Default direction is \`forward\` (single arrow at \`to\`).
- Use \`dashed\` for weak / conditional / async links; \`dotted\` for very weak
  or implied relationships.

## Sizing guidance

- 5–25 nodes per map is the sweet spot. Past 30, the viewer remains usable but
  comprehension drops. Split into multiple maps if the user's request implies
  more.
- Keep labels concise. Move detail into \`description\`. Move long explanations
  out of the map entirely.
- Avoid cycles in \`tree\` and \`flowchart\`. Use \`graph\` or \`concept\` if
  cycles are essential.

## Multiple groups in one map

A single map can contain **multiple disconnected sub-diagrams** that share the
canvas without being linked. The viewer detects connected components
automatically (via edges + \`parent\` hints) and lays each out independently,
packing them side-by-side with padding. No special syntax is required:

- Just emit the nodes and edges for each group. Anything that has no edge or
  \`parent\` link to another group becomes its own cluster.
- The same \`type\` is applied to every component (e.g. all clusters use
  \`mindmap\` layout if \`type: "mindmap"\`).
- Use this when the user asks to compare/show several small diagrams together,
  or to lay out parallel sub-trees, parallel flows, sibling ER schemas, etc.

Use \`meta.tags\` or per-node \`description\` to explain what each group
represents — there is no dedicated \`group\` field.

## Edge marker (line / arrow / double / back)

The \`direction\` field controls the arrowheads on the edge — i.e. the
visual marker between the two endpoints:

| \`direction\`  | Marker         | When to use                                       |
| ------------ | -------------- | ------------------------------------------------- |
| \`"none"\`     | line \`—\`       | Symmetric / undirected association.               |
| \`"forward"\`  | arrow \`→\`      | Directed link from \`from\` to \`to\` (default).      |
| \`"both"\`     | double \`↔\`     | Bidirectional / mutual relationship.              |
| \`"backward"\` | back arrow \`←\` | Reversed direction (rare; usually re-order ends). |

Default is \`"forward"\`. Pick \`"none"\` for ER associations or concept-map links
that have no inherent direction; \`"both"\` for ER many-to-many relationships,
mutual dependencies, or symmetric concept-map links.

## ER diagrams (entity–relationship)

ER diagrams are authored with \`type: "graph"\`. The schema has no dedicated
attribute list, but the existing fields cover the common case:

- **Entity** → one node per table/entity. Set \`shape: "rectangle"\` and
  \`label: "**EntityName**"\` (bold). Use \`description\` to list the
  attributes inline, comma-separated, with \`(PK)\` / \`(FK)\` markers — keep
  it under ~80 chars; if the entity is wide, split it into two lines via
  multiple short attributes or move secondary fields out of the diagram.
- **Weak entity / lookup** → \`color: "slate"\` and/or \`emphasis: "subtle"\`.
- **Primary domain entity** → \`color: "blue"\` or \`emphasis: "strong"\`.
- **Relationship** → an edge between the two entities. Put the verb plus
  cardinality in \`label\`, e.g. \`"places (1—N)"\`, \`"has (1—1)"\`,
  \`"tagged with (M—N)"\`. Use \`direction: "both"\` when the relationship is
  not directional (most ER links).
- **Chen-style explicit relationship node** (optional, only when the
  relationship itself carries attributes): add an intermediate node with
  \`shape: "diamond"\` and edges \`entityA → relNode → entityB\`, each edge
  labelled with its side's cardinality (\`1\`, \`N\`, \`M\`).
- **Cardinality notation**: pick one and stay consistent. Recommended:
  \`1—1\`, \`1—N\`, \`M—N\`. Also acceptable: \`1..1\`, \`0..N\`, \`1..*\`.

### ER worked example

\`\`\`json
{
  "version": "1",
  "type": "graph",
  "title": "Order management ER",
  "description": "Customers, orders, line items, products.",
  "nodes": [
    {
      "id": "customer",
      "label": "**Customer**",
      "description": "id (PK), email, name, created_at",
      "shape": "rectangle",
      "color": "blue",
      "emphasis": "strong"
    },
    {
      "id": "order",
      "label": "**Order**",
      "description": "id (PK), customer_id (FK), placed_at, status",
      "shape": "rectangle",
      "color": "blue"
    },
    {
      "id": "line_item",
      "label": "**LineItem**",
      "description": "id (PK), order_id (FK), product_id (FK), qty, unit_price",
      "shape": "rectangle"
    },
    {
      "id": "product",
      "label": "**Product**",
      "description": "id (PK), sku, name, price",
      "shape": "rectangle",
      "color": "green"
    },
    {
      "id": "category",
      "label": "**Category**",
      "description": "id (PK), name",
      "shape": "rectangle",
      "color": "slate",
      "emphasis": "subtle"
    }
  ],
  "edges": [
    { "from": "customer", "to": "order",     "label": "places (1—N)",      "direction": "both" },
    { "from": "order",    "to": "line_item", "label": "contains (1—N)",    "direction": "both" },
    { "from": "product",  "to": "line_item", "label": "appears in (1—N)",  "direction": "both" },
    { "from": "category", "to": "product",   "label": "groups (1—N)",      "direction": "both" }
  ]
}
\`\`\`

## Worked example

\`\`\`json
{
  "version": "1",
  "type": "flowchart",
  "title": "Password reset flow",
  "description": "Happy path and failure branches.",
  "nodes": [
    { "id": "start",   "label": "User clicks 'Forgot password'", "shape": "pill" },
    { "id": "form",    "label": "Email entry", "shape": "rounded" },
    { "id": "lookup",  "label": "User exists?", "shape": "diamond", "color": "amber" },
    { "id": "send",    "label": "Send reset email", "shape": "rounded", "color": "blue" },
    { "id": "ack",     "label": "Generic ack screen", "shape": "rounded" },
    { "id": "click",   "label": "User clicks token", "shape": "rounded" },
    { "id": "valid",   "label": "Token valid?", "shape": "diamond", "color": "amber" },
    { "id": "set",     "label": "Set new password", "shape": "rounded", "color": "green" },
    { "id": "expired", "label": "Show expired notice", "shape": "rounded", "color": "rose" },
    { "id": "done",    "label": "Done", "shape": "pill", "color": "green", "emphasis": "strong" }
  ],
  "edges": [
    { "from": "start",   "to": "form" },
    { "from": "form",    "to": "lookup" },
    { "from": "lookup",  "to": "send",    "label": "yes" },
    { "from": "lookup",  "to": "ack",     "label": "no",  "style": "dashed" },
    { "from": "send",    "to": "ack" },
    { "from": "ack",     "to": "click" },
    { "from": "click",   "to": "valid" },
    { "from": "valid",   "to": "set",     "label": "yes" },
    { "from": "valid",   "to": "expired", "label": "no",  "style": "dashed" },
    { "from": "set",     "to": "done" }
  ]
}
\`\`\`

## Anti-patterns

- Do **not** include id collisions, dangling edges, or unreferenced isolated
  nodes (unless the user's request explicitly calls for them).
- Do **not** repeat the same idea under multiple ids — collapse synonyms.
- Do **not** invent layout coordinates by guessing pixel positions; let the
  viewer compute them unless the user explicitly asks for a custom layout
  (e.g. by editing in the viewer first).
- Do **not** emit overlapping \`x\` / \`y\` placements. If two nodes share or nearly
  share coordinates, drop the coords on both and let auto-layout space them.
- Do **not** include emoji in labels.
- Do **not** wrap the JSON in additional commentary unless asked. The user
  will paste the JSON directly into the viewer.
`
