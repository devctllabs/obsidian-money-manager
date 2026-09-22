---
status: accepted
date: 2026-09-12
---

# Derive Balances from absolute Checkpoints

An Account stores no mutable balance or opening-balance field. Its current
Balance starts at the latest absolute Balance Checkpoint and replays later
Income and Expenses. Creating an Account with an observed balance and every
later reconciliation append a Checkpoint to the relevant monthly Ledger. This
implements the reconciliation semantics in
[PDR-0002](../product/decisions/0002-reconcile-with-absolute-balance-checkpoints.md)
without maintaining a second canonical balance alongside the Ledger.

## Considered options

- **Rewrite a current balance in `ACCOUNTS.md`** would require every Entry write
  to mutate two canonical files and leave manual or interrupted edits out of
  sync with the Ledger.

## Consequences

Balance and report projections consume the same Ledger with different inclusion
rules defined by PDR-0002. Account writes do not maintain a balance field;
observed balances are persisted as Ledger Entries.
