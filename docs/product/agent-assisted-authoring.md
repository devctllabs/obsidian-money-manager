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

The separately installed Node.js CLI validates the complete Workspace and can preview and apply a
YAML batch of new Expenses and Income for one existing Account. Import generates UUIDv7 for
applied Entries, flags exact repeats, and reports any partial write. The agent previews with the
CLI, then applies the same YAML only after confirmation. If needed, it confirms and creates a new
Category in a separate step before previewing the import.

[YAML import format](../../skills/money-manager/references/yaml-import.md).
[PDR-0006](./decisions/0006-apply-confirmed-yaml-batches-through-the-companion-cli.md).

