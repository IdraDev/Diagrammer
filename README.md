# Standard Map

A minimal viewer for LLM-authored mind maps and diagrams. Local-first,
schema-driven, no account, no cloud.

You hand a model the [authoring skill](./SKILL.md), it returns a JSON document
that conforms to a small schema, and the viewer renders it on a pannable,
zoomable canvas — mindmap, tree, flowchart, graph, concept map, or timeline,
auto-laid-out per type.

## Features

- **Six map types** (`mindmap`, `tree`, `flowchart`, `graph`, `concept`,
  `timeline`) with an auto-layout per type — no coordinates required.
- **Pannable, zoomable canvas** powered by React Flow, with smooth fit-to-view.
- **Edit mode**: drag nodes to reposition, connect handles to create edges,
  double-click a node to rename, and use the side panel to change shape,
  color, emphasis, edge style, and direction. Backspace deletes the
  selection.
- **New map** action for building maps by hand on a blank canvas.
- **Recents** stored in `localStorage`. Drag-and-drop or paste JSON to open.
- **Examples** covering each layout type.
- **Light**, dark, and system themes (light by default).

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- Radix UI primitives in shadcn-style wrappers
- React Flow (`@xyflow/react`) for the canvas
- React Compiler

## Develop

```sh
bun install
bun run dev
```

## Try it

The repo ships with a sample map you can drag straight onto the canvas:

```
examples/product-launch.json
```

The in-app **Examples** menu carries one of each layout type if you want to
see them all without authoring anything.

## The authoring skill

The [`SKILL.md`](./SKILL.md) file is the contract LLMs follow to produce maps
this viewer can render. It documents:

- The JSON schema (`version`, `type`, `title`, `nodes`, `edges`, ...).
- When to use each map type.
- Visual conventions for shapes, colors, and emphasis.
- A worked example.
- Anti-patterns.

The home page exposes a "Copy authoring skill" button that copies the same
text to your clipboard — paste it into your model's system prompt, a Claude
Code skill file, a Cursor rule, or any other instruction surface.

## Schema, briefly

```json
{
  "version": "1",
  "type": "mindmap",
  "title": "Untitled",
  "description": "Optional one-liner",
  "nodes": [
    { "id": "root", "label": "Center", "emphasis": "strong" },
    { "id": "a", "label": "Branch A", "color": "blue" }
  ],
  "edges": [
    { "from": "root", "to": "a", "label": "optional" }
  ]
}
```

See [`SKILL.md`](./SKILL.md) for the full reference.

## License

MIT
