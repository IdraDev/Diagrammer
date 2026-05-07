#!/usr/bin/env pwsh
# Diagrammer installer (PowerShell). Safe to re-run.

[CmdletBinding()]
param(
    [switch]$All,
    [string]$Only,
    [switch]$List,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Target   = (Get-Location).Path

$Agents = @('cursor','windsurf','cline','codex','claude','gemini','agents')

function Show-Usage {
@"
Diagrammer installer

Usage: install.ps1 [-All] [-Only <agent>] [-List] [-Help]

  -All            Install every supported agent rule into `$PWD
  -Only <agent>   Install only one agent (cursor | windsurf | cline | codex |
                  claude | gemini | agents)
  -List           Print supported agents and exit
  -Help           Show this message
"@
}

if ($Help) { Show-Usage; exit 0 }
if ($List) { $Agents -join "`n"; exit 0 }

function Install-One([string]$agent) {
    switch ($agent) {
        'cursor' {
            New-Item -ItemType Directory -Force -Path "$Target/.cursor/rules" | Out-Null
            Copy-Item "$RepoRoot/.cursor/rules/diagrammer.mdc" "$Target/.cursor/rules/diagrammer.mdc" -Force
            "✓ cursor → .cursor/rules/diagrammer.mdc"
        }
        'windsurf' {
            New-Item -ItemType Directory -Force -Path "$Target/.windsurf/rules" | Out-Null
            Copy-Item "$RepoRoot/.windsurf/rules/diagrammer.md" "$Target/.windsurf/rules/diagrammer.md" -Force
            "✓ windsurf → .windsurf/rules/diagrammer.md"
        }
        'cline' {
            New-Item -ItemType Directory -Force -Path "$Target/.clinerules" | Out-Null
            Copy-Item "$RepoRoot/.clinerules/diagrammer.md" "$Target/.clinerules/diagrammer.md" -Force
            "✓ cline → .clinerules/diagrammer.md"
        }
        'codex' {
            New-Item -ItemType Directory -Force -Path "$Target/.codex" | Out-Null
            Copy-Item "$RepoRoot/.codex/config.toml" "$Target/.codex/config.toml" -Force
            Copy-Item "$RepoRoot/.codex/hooks.json"  "$Target/.codex/hooks.json"  -Force
            "✓ codex → .codex/{config.toml,hooks.json}"
        }
        'claude' {
            New-Item -ItemType Directory -Force -Path "$Target/.claude-plugin" | Out-Null
            Copy-Item "$RepoRoot/.claude-plugin/plugin.json"      "$Target/.claude-plugin/plugin.json"      -Force
            Copy-Item "$RepoRoot/.claude-plugin/marketplace.json" "$Target/.claude-plugin/marketplace.json" -Force
            "✓ claude → .claude-plugin/{plugin,marketplace}.json"
        }
        'gemini' {
            Copy-Item "$RepoRoot/gemini-extension.json" "$Target/gemini-extension.json" -Force
            "✓ gemini → gemini-extension.json"
        }
        'agents' {
            Copy-Item "$RepoRoot/AGENTS.md" "$Target/AGENTS.md" -Force
            "✓ agents → AGENTS.md"
        }
        default { throw "Unknown agent: $agent" }
    }

    New-Item -ItemType Directory -Force -Path "$Target/skills/diagrammer" | Out-Null
    Copy-Item "$RepoRoot/skills/diagrammer/SKILL.md" "$Target/skills/diagrammer/SKILL.md" -Force
}

function Autodetect {
    $found = @()
    if (Test-Path "$Target/.cursor")        { $found += 'cursor' }
    if (Test-Path "$Target/.windsurf")      { $found += 'windsurf' }
    if (Test-Path "$Target/.clinerules")    { $found += 'cline' }
    if (Test-Path "$Target/.codex")         { $found += 'codex' }
    if (Test-Path "$Target/.claude-plugin") { $found += 'claude' }
    if (Test-Path "$Target/AGENTS.md")      { $found += 'agents' }

    if ($found.Count -eq 0) {
        throw "No agent directories detected. Pass -All or -Only <agent>."
    }
    return $found
}

if ($All) {
    foreach ($a in $Agents) { Install-One $a }
}
elseif ($Only) {
    Install-One $Only
}
else {
    foreach ($a in (Autodetect)) { Install-One $a }
}

"Done. Diagrammer skill canonical: skills/diagrammer/SKILL.md"
