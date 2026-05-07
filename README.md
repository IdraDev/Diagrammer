<p align="center">
  <img src="https://em-content.zobj.net/source/apple/391/triangular-ruler_1f4d0.png" width="120" />
</p>

<h1 align="center">Diagrammer</h1>

<p align="center">
  <strong>tell the model, get the diagram</strong>
</p>

<p align="center">
  <a href="https://diagrammer.idra.app"><img src="https://img.shields.io/badge/live-diagrammer.idra.app-0a84ff?style=flat" alt="Live"></a>
  <a href="https://github.com/IdraDev/diagrammer/stargazers"><img src="https://img.shields.io/github/stars/IdraDev/diagrammer?style=flat&color=yellow" alt="Stars"></a>
  <a href="https://github.com/IdraDev/diagrammer/commits/main"><img src="https://img.shields.io/github/last-commit/IdraDev/diagrammer?style=flat" alt="Last Commit"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/IdraDev/diagrammer?style=flat" alt="License"></a>
</p>

<p align="center">
  <a href="#why">Why</a> •
  <a href="#map-types">Map Types</a> •
  <a href="#install">Install</a> •
  <a href="#authoring-skill">Skill</a> •
  <a href="#schema">Schema</a> •
  <a href="#er-diagrams">ER</a>
</p>

---

A local-first, schema-driven viewer for **LLM-authored diagrams**. Hand a model the [authoring skill](./SKILL.md), it returns a JSON document, and the viewer renders it on a pannable, zoomable canvas — **mindmap, tree, flowchart, graph, ER diagram, concept map, or timeline**, auto-laid-out per type. No account. No cloud. No drag-pixels-by-hand.

## Why

I never found a **truly open-source, zero vendor lock-in** way to take a mind map or technical diagram and just _view it_. Every option pulled me into a SaaS account, a proprietary file format, a paywalled export, or a dialect of someone else's DSL. So Diagrammer: one tiny JSON schema, a static viewer that runs in your browser, no backend, no signup, no lock-in. Your data stays your data — paste it, drop it, export it, host the whole thing yourself in a `dist/` folder.

## Map Types

**Pick by `type`. Layout is automatic.**

<table>
<tr>
<td width="25%">

#### 🧠 mindmap

> Branches radiate from one central topic. Brainstorm, outline, taxonomy of ideas.

</td>
<td width="25%">

#### 🌳 tree

> Strict hierarchy. Org chart, file tree, taxonomy with one parent per child.

</td>
<td width="25%">

#### 🔀 flowchart

> Directed process w/ decision diamonds. Pipelines, state machines, runbooks.

</td>
<td width="25%">

#### 🕸️ graph

> Arbitrary network: deps, citations, **ER diagrams**, knowledge graphs.

</td>
</tr>
<tr>
<td>

#### 💡 concept

> Concept map w/ labelled, often bidirectional links. Reinforcing ideas, not hierarchies.

</td>
<td>

#### 📅 timeline

> Linear sequence of events. Roadmaps, history, milestones.

</td>
<td colspan="2">

#### 🗄️ ER (as `graph`)

> Entities = `shape: "rectangle"` + bold label + attributes in `description` w/ `(PK)`/`(FK)` markers. Edges carry verb + cardinality (`places (1—N)`).

</td>
</tr>
</table>

- **No coordinates** — auto-layout per `type`. Drag if you must, viewer writes positions back.
- **Local-first** — recents in `localStorage`, paste/drop JSON, no upload.
- **Edit mode** — drag nodes, connect handles, double-click rename, side panel for shape/color/emphasis/edge style.
- **Examples** — one of every layout type, including ER, in the in-app menu.
- **Theme** — light, dark, system. Light by default.

## Install

```bash
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Build:** `bun run build` → static `dist/`. Drop on any host.

**Live:** [diagrammer.idra.app](https://diagrammer.idra.app).

### Stack

| Layer      | Tool                              |
| ---------- | --------------------------------- |
| Bundler    | Vite                              |
| UI         | React 19 + TypeScript             |
| Styling    | Tailwind CSS v4                   |
| Primitives | Radix UI in shadcn-style wrappers |
| Canvas     | React Flow (`@xyflow/react`)      |
| Compiler   | React Compiler                    |

## Authoring Skill

[`SKILL.md`](./SKILL.md) is the contract LLMs follow to produce diagrams this viewer can render. It documents the schema, when to use each `type` (incl. ER), visual conventions, worked examples, and anti-patterns.

The home page exposes a **Copy authoring skill** button — paste it into your model's system prompt, a Claude Code skill file, a Cursor rule, or any other instruction surface.

```
"Make me an ER for an order-management DB" → JSON → drop on canvas → done.
```

## Schema

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
  "edges": [{ "from": "root", "to": "a", "label": "optional" }]
}
```

| Field               | Type  | Notes                                                                          |
| ------------------- | ----- | ------------------------------------------------------------------------------ |
| `version`           | `"1"` | Schema version. Always `"1"`.                                                  |
| `type`              | enum  | `mindmap` · `tree` · `flowchart` · `graph` · `concept` · `timeline`.           |
| `nodes[].shape`     | enum  | `rectangle` · `rounded` · `ellipse` · `diamond` · `hexagon` · `pill`.          |
| `nodes[].color`     | enum  | `default` · `slate` · `blue` · `green` · `amber` · `rose` · `violet` · `cyan`. |
| `nodes[].emphasis`  | enum  | `normal` · `strong` · `subtle`.                                                |
| `edges[].style`     | enum  | `solid` · `dashed` · `dotted`.                                                 |
| `edges[].direction` | enum  | `forward` · `backward` · `both` · `none`.                                      |

Full reference: [`SKILL.md`](./SKILL.md).

## ER Diagrams

ER diagrams render as `type: "graph"`. The schema covers the common case without dedicated attribute lists:

| Concept       | Convention                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------- |
| Entity        | `shape: "rectangle"`, `label: "**Name**"`, `description: "id (PK), col1, col2_id (FK), ..."`. |
| Primary       | `color: "blue"` + `emphasis: "strong"`.                                                       |
| Lookup / weak | `color: "slate"` + `emphasis: "subtle"`.                                                      |
| Relationship  | edge with `label: "verb (1—N)"`, `direction: "both"`.                                         |
| Chen-style    | Intermediate `shape: "diamond"` node when relationship has its own attributes.                |
| Cardinality   | Pick one: `1—1` / `1—N` / `M—N` (or `0..N` / `1..*`). Stay consistent.                        |

Worked ER example shipped in the in-app **Examples** menu (`Order management ER`).

## Examples

In-app **Examples** menu carries one of each layout type:

- 🧠 **Launching a SaaS** — mindmap with workstream branches
- 🌳 **Web platform** — tree of HTML, CSS, JS, Web APIs
- 🔀 **Pull request lifecycle** — flowchart w/ CI and review branches
- 🗄️ **Order management ER** — entity–relationship diagram w/ cardinalities
- 💡 **Functional programming** — concept map w/ bidirectional links
- 📅 **Web platform milestones** — timeline 1991 → today

Drop any `*.json` from [`examples/`](./examples) onto the canvas, or paste straight from clipboard.

> [!IMPORTANT]
> Diagrammer doesn't talk to any backend. Everything (recents, prefs, the active map) lives in your browser's `localStorage`. Clear it, lose it. Export your maps if you care.

## Star This Repo

If Diagrammer save you mass clicking — leave mass star. ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=IdraDev/diagrammer&type=Date)](https://star-history.com/#IdraDev/diagrammer&Date)

## License

MIT — by **IdraDev**. Free like a blank canvas.
