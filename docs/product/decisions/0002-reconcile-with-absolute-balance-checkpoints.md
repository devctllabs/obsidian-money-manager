# Reconcile with absolute Balance Checkpoints

Status: Accepted
Date: 2026-09-12

Reconciliation records an observed absolute Account Balance as a dated Balance
Checkpoint. Earlier Entries remain in their Period Reports but do not change a
later confirmed Balance, allowing backdated capture without undoing the user's
reconciliation.

## Considered Options

- **One opening balance and date** would support full historical replay but
  force the user to reconstruct an older opening amount before adding a
  backdated Entry.
- **Reconciliation as a signed delta** would be simple, but later capture of an
  older missing Entry would change a Balance the user had already confirmed.

## Consequences

Checkpoints are visible in Account activity and excluded from Expense and Income
analytics. Historical Balance or net-worth charts remain outside V1 because they
require a separate instant and checkpoint interpretation contract.

[ADR-0003](../../adr/0003-derive-balances-from-absolute-checkpoints.md) records
Checkpoint storage and Balance derivation without a mutable Account balance.
