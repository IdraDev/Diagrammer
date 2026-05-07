# AGENTS.md — Diagrammer authoring guide

When the user asks for a **mind map, concept map, flowchart, tree, dependency
graph, ER diagram, or timeline**, produce a single JSON document conforming to
the Diagrammer schema. The full canonical specification — schema, type
selection, visual conventions, ER conventions, anti-patterns, and worked
examples — lives in [`skills/diagrammer/SKILL.md`](./skills/diagrammer/SKILL.md).

## Quick contract

- Top-level keys: `version` (always `"1"`), `type`, `title`, `nodes`, `edges`. Optional `description`, `meta`.
- `type` ∈ `mindmap` · `tree` · `flowchart` · `graph` · `concept` · `timeline`.
- ER diagrams → `type: "graph"`, entities = `shape: "rectangle"`, attributes in `description`, edge label carries cardinality (`"places (1—N)"`).
- Output one fenced JSON block. No surrounding prose unless explicitly asked.

Render with: [diagrammer.idra.app](https://diagrammer.idra.app).
