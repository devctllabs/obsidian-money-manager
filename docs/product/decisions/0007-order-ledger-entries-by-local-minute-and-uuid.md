# Order Ledger Entries by local minute and UUIDv7

Status: Accepted
Date: 2026-11-23

Balance Checkpoints can separate earlier and later financial facts on the same calendar date.
Every Ledger Entry accepts an optional local time. Replay treats a date without time as midnight
and orders Entries with the same effective minute by UUIDv7.

## Consequences

The default keeps date-only authoring and older Markdown usable. An Expense entered without time
on the date of an afternoon Checkpoint is absorbed by that Checkpoint. An actual time after the
Checkpoint makes the Expense affect the current balance. UUIDv7 gives a stable tie order based
on identifier assignment, so a later import can sort after an existing Checkpoint at the same
minute. [PDR-0002](./0002-reconcile-with-absolute-balance-checkpoints.md).
