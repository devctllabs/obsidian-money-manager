# Apply confirmed YAML batches through the companion CLI

Status: Accepted
Date: 2026-11-23
Supersedes: [PDR-0005](./0005-keep-agent-assisted-authoring-external-and-confirmation-gated.md)

The companion CLI can append a validated YAML batch of new Expenses and Income for an existing
Account. The CLI previews by default and writes with explicit apply. Agent-assisted authoring stays
external to Obsidian and requires the user's confirmation of the proposed batch.

## Consequences

The tool owns ID generation and Month-file writes for an import. An exact match in the Ledger
requires explicit allowance, and an invalid Workspace blocks import. The external skill resolves
financial intent and uses the existing confirmed Markdown workflow for other edits.
