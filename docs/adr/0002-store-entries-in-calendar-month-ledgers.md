---
status: accepted
date: 2026-09-12
---

# Store Entries in calendar-month Ledgers

Money Manager stores all Expenses, Income, and Balance Checkpoints for one
calendar Month as typed records in the namespaced YAML frontmatter of
`Ledger/YYYY/MM.md`. Accounts, Categories, and Manual Rates remain separate
role-specific Markdown documents. The calendar topology is a stable navigation
and placement invariant, not an Archive lifecycle or the authority for report
semantics.

## Considered options

- **One Markdown file per Entry** would make each edit naturally atomic but
  create hundreds of small notes and noisy vault navigation for a compact
  personal ledger.
- **One Ledger file for all time** would minimize paths but make every write,
  sync conflict, and manual review converge on one indefinitely growing file.
- **A Markdown table per Month** would look compact when rendered but make
  escaping, optional fields, typed Checkpoints, and safe record-level mutation
  unnecessarily fragile.
- **`Ledger/Archive/YYYY/MM.md`** would copy Focus Flow's path while inventing a
  terminal transition that financial Entries do not have.

## Consequences

Entry Date and Month path must agree, and changing Month becomes a two-document
operation. That move copies the edited Entry with its existing UUID to the
destination before removing the source. A partial failure can therefore create
a duplicate-identity conflict but cannot lose the Entry; both copies remain out
of authoritative projections until manually resolved. Deleting the final Entry
preserves the Month file and any user-authored body.
