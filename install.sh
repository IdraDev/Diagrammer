#!/usr/bin/env bash
# Diagrammer installer — drops the right skill/rule file into the current
# directory based on detected agent tooling. Safe to re-run.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${PWD}"

usage() {
  cat <<EOF
Diagrammer installer

Usage: install.sh [--all] [--only <agent>] [--list] [--help]

Options:
  --all            Install every supported agent rule into \$PWD
  --only <agent>   Install only one agent (cursor | windsurf | cline | codex |
                   claude | gemini | agents)
  --list           Print supported agents and exit
  --help           Show this message

By default, autodetects which agent rule directories already exist in \$PWD
and seeds them. With --all, installs every supported agent.
EOF
}

AGENTS=(cursor windsurf cline codex claude gemini agents)

print_list() {
  printf '%s\n' "${AGENTS[@]}"
}

install_one() {
  local agent="$1"
  case "$agent" in
    cursor)
      mkdir -p "$TARGET/.cursor/rules"
      cp "$REPO_ROOT/.cursor/rules/diagrammer.mdc" "$TARGET/.cursor/rules/diagrammer.mdc"
      echo "✓ cursor → .cursor/rules/diagrammer.mdc"
      ;;
    windsurf)
      mkdir -p "$TARGET/.windsurf/rules"
      cp "$REPO_ROOT/.windsurf/rules/diagrammer.md" "$TARGET/.windsurf/rules/diagrammer.md"
      echo "✓ windsurf → .windsurf/rules/diagrammer.md"
      ;;
    cline)
      mkdir -p "$TARGET/.clinerules"
      cp "$REPO_ROOT/.clinerules/diagrammer.md" "$TARGET/.clinerules/diagrammer.md"
      echo "✓ cline → .clinerules/diagrammer.md"
      ;;
    codex)
      mkdir -p "$TARGET/.codex"
      cp "$REPO_ROOT/.codex/config.toml" "$TARGET/.codex/config.toml"
      cp "$REPO_ROOT/.codex/hooks.json"  "$TARGET/.codex/hooks.json"
      echo "✓ codex → .codex/{config.toml,hooks.json}"
      ;;
    claude)
      mkdir -p "$TARGET/.claude-plugin"
      cp "$REPO_ROOT/.claude-plugin/plugin.json"      "$TARGET/.claude-plugin/plugin.json"
      cp "$REPO_ROOT/.claude-plugin/marketplace.json" "$TARGET/.claude-plugin/marketplace.json"
      echo "✓ claude → .claude-plugin/{plugin,marketplace}.json"
      ;;
    gemini)
      cp "$REPO_ROOT/gemini-extension.json" "$TARGET/gemini-extension.json"
      echo "✓ gemini → gemini-extension.json"
      ;;
    agents)
      cp "$REPO_ROOT/AGENTS.md" "$TARGET/AGENTS.md"
      echo "✓ agents → AGENTS.md"
      ;;
    *)
      echo "✗ unknown agent: $agent" >&2
      return 1
      ;;
  esac

  mkdir -p "$TARGET/skills/diagrammer"
  cp "$REPO_ROOT/skills/diagrammer/SKILL.md" "$TARGET/skills/diagrammer/SKILL.md"
}

autodetect() {
  local found=()
  [[ -d "$TARGET/.cursor"        ]] && found+=(cursor)
  [[ -d "$TARGET/.windsurf"      ]] && found+=(windsurf)
  [[ -d "$TARGET/.clinerules"    ]] && found+=(cline)
  [[ -d "$TARGET/.codex"         ]] && found+=(codex)
  [[ -d "$TARGET/.claude-plugin" ]] && found+=(claude)
  [[ -f "$TARGET/AGENTS.md"      ]] && found+=(agents)

  if [[ ${#found[@]} -eq 0 ]]; then
    echo "No agent directories detected. Pass --all or --only <agent>." >&2
    exit 1
  fi
  printf '%s\n' "${found[@]}"
}

MODE="auto"
ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)    MODE="all"; shift ;;
    --only)   MODE="only"; ONLY="$2"; shift 2 ;;
    --list)   print_list; exit 0 ;;
    --help|-h) usage; exit 0 ;;
    *)        echo "Unknown flag: $1" >&2; usage; exit 1 ;;
  esac
done

case "$MODE" in
  all)
    for a in "${AGENTS[@]}"; do install_one "$a"; done
    ;;
  only)
    install_one "$ONLY"
    ;;
  auto)
    while read -r a; do install_one "$a"; done < <(autodetect)
    ;;
esac

echo "Done. Diagrammer skill canonical: skills/diagrammer/SKILL.md"
