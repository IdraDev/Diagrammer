# 🛠️ Contributing

Small project, opinionated rules. Read before PR.

## Ground rules

1. **Local-first.** No backend, telemetry, or runtime fetches.
2. **No vendor lock-in.** Must run from a static `dist/`.
3. **Schema `v1` is frozen.** Additive optional fields OK. Removals → open an RFC issue first.
4. **`skills/diagrammer/SKILL.md` and `web/src/lib/skill.ts` move together.** Same commit.

## Dev

```bash
cd web
bun install
bun run dev    # http://localhost:5173
bun run lint   # must exit 0
bun run build  # must succeed
```

## PR checklist

- [ ] `bun run lint` exits 0
- [ ] `bun run build` succeeds
- [ ] Schema/skill changes mirrored in both files
- [ ] One concern per PR
- [ ] Conventional Commit subject ≤ 50 chars

## Code

- TypeScript strict. No `any` without a one-line reason.
- Comments only for *why*, never *what*.
- No new deps without justification.
- Don't reformat unrelated code.

## Issues

Bugs: steps + smallest JSON repro + browser/OS/SHA.
Features: open issue first. Persistent storage is already roadmapped — wait for the milestone.

MIT. By contributing you accept it.
