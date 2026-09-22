# Agent-assisted authoring

Money Manager includes an optional external agent skill for recording Accounts, Categories,
Expenses, Income, Balance Checkpoints, Manual Rates, and requested Markdown body edits from
dictated facts. The user must invoke the skill explicitly. The Obsidian plugin remains fully usable
without the skill or its companion CLI and contains no AI runtime.

## Confirmation and validation

The workflow resolves the target Money Workspace and validates the complete workspace before
ordinary authoring. Existing diagnostics are handled as a separate repair proposal. The agent does
not infer an ambiguous Account, Currency, date, Category, repeated fact, or same-day Checkpoint
ordering when that choice can change financial meaning.

Before writing, the agent presents one preview covering every proposed financial fact, catalog
change, removal, body edit, and affected file. Only explicit confirmation authorizes that exact
batch. It then rereads affected files, preserves unrelated content, applies the confirmed changes,
and validates the complete workspace again. A concurrent edit or partial failure is reported rather
than overwritten.

## Companion CLI

The separately installed Node.js CLI exposes `validate`, `new-id`, `--help`, and `--version`.
`validate` reads the three catalogs and every Markdown document under `Ledger/`, rejects symbolic
links in managed paths, and reports deterministic diagnostics as text or JSON. `new-id` emits one
UUIDv7. Neither command writes Money Workspace files; confirmed Markdown edits remain owned by the
agent workflow.

This boundary is recorded in
[PDR-0005](./decisions/0005-keep-agent-assisted-authoring-external-and-confirmation-gated.md)
and [ADR-0006](../adr/0006-keep-the-companion-cli-read-only-and-share-validation.md).

