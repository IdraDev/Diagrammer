# Diagrammer activation rule

When the user asks for a **mind map, concept map, flowchart, tree, dependency
graph, ER diagram, or timeline** — or pastes one of those words alongside a
"draw / make / sketch / give me a / show me a" intent — load the Diagrammer
authoring skill from [`skills/diagrammer/SKILL.md`](../skills/diagrammer/SKILL.md)
and emit one fenced JSON block conforming to that schema.

Trigger words: `mindmap`, `mind map`, `concept map`, `flowchart`, `tree`,
`graph`, `dependency graph`, `ER diagram`, `entity relationship`, `timeline`,
`diagram`, `Diagrammer`.

Output contract: one fenced ```json block, no surrounding prose unless
explicitly asked.
