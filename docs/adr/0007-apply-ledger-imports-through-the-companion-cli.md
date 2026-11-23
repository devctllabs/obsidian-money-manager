---
status: accepted
date: 2026-11-23
---

# Apply Ledger imports through the companion CLI

The Node CLI plans a strict YAML batch with the shared Entry validator and Workspace snapshot.
An explicit apply assigns UUIDv7 and writes canonical Month documents, keeping filesystem
operations at the Node adapter. This centralizes validation and serialization for external
Expense and Income capture. [PDR-0006](../product/decisions/0006-apply-confirmed-yaml-batches-through-the-companion-cli.md).

## Consequences

Each Month is staged beside its destination and committed after checking the source and catalogs.
A new Month is published without replacing an existing file. Earlier Month writes are kept if
a later one fails. The result identifies committed and pending Entries, and a successful run
verifies the complete Workspace and all returned UUIDs. Obsidian retains independent Vault
mutations. [ADR-0006](./0006-keep-the-companion-cli-read-only-and-share-validation.md) is superseded.
