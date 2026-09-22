---
status: accepted
date: 2026-09-12
---

# Keep Markdown canonical

Money Manager stores Accounts, Categories, current Manual Rates, and every
Ledger Entry in ordinary Markdown beneath one configured vault root. Runtime
indexes, Account Balances, reports, charts, and Converted Totals are fully
rebuildable projections; plugin settings contain configuration only. This
storage design supports the data-ownership commitment in
[PDR-0001](../product/decisions/0001-own-and-edit-data-without-the-plugin.md).

## Considered options

- **Plugin `data.json` as the Ledger** would make structured writes simple but
  hide the financial record from ordinary Obsidian use and make uninstalling the
  plugin materially different from retaining the data.
- **SQLite as canonical storage** would improve arbitrary queries but introduce
  binary sync reconciliation and a second file format that Obsidian cannot read.
- **Markdown plus a derived database cache** remains possible only after
  profiling proves the in-memory index insufficient; V1 volume does not justify
  invalidation, migration, and mobile complexity.

## Consequences

Writes must preserve unrelated frontmatter values and the user-owned Markdown
body. Direct edits are supported and may produce diagnostics. A future database
may be a disposable read model, never an undeclared authority. Incompatible
schema changes require explicit, reviewable Markdown migrations rather than
silent load-time rewriting.
