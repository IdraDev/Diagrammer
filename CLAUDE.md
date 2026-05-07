# CLAUDE.md — Diagrammer

This repo holds:

- `web/` — the Diagrammer web viewer (Vite + React 19 + TypeScript). Run with `cd web && bun install && bun run dev`.
- `skills/diagrammer/SKILL.md` — canonical authoring contract for LLMs.
- Platform-native rule files at root: `.cursor/`, `.windsurf/`, `.clinerules/`, `.codex/`, `.claude-plugin/`, plus `gemini-extension.json` and `AGENTS.md`.

## Authoring rule

When the user asks for a mind map / flowchart / tree / graph / ER diagram /
concept map / timeline, follow [`skills/diagrammer/SKILL.md`](./skills/diagrammer/SKILL.md)
and emit one fenced JSON block conforming to the Diagrammer schema.

## Web app conventions

- Source of truth for the in-app authoring skill is `web/src/lib/skill.ts`. Keep it in sync with `skills/diagrammer/SKILL.md` when the schema changes.
- Schema types live in `web/src/lib/schema.ts` (`MapDocument`).
- Layouts: `web/src/lib/layouts.ts`.
- React Flow adapter: `web/src/lib/flow-adapter.ts`.
- Examples: `web/src/lib/examples.ts` (in-app menu) and `web/examples/*.json` (drag-drop).

## Storage

`localStorage` keys are namespaced `diagrammer:*`. No backend.

## Live

[diagrammer.idra.app](https://diagrammer.idra.app)
