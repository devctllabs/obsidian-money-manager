# Ledger management

The Ledger records three kinds of dated financial facts: Expenses, Income, and Balance
Checkpoints. Each belongs to exactly one Account. Expenses and Income store a positive Native
Amount in the Account's immutable ISO 4217 Currency; Checkpoints store an observed absolute
Account Balance.

## Accounts and balances

An Account has a stable readable Key, display name, and Currency. Its current Account Balance is
derived from the latest Balance Checkpoint on or before today and the later Income and Expenses;
without a Checkpoint, replay starts at zero. Earlier Entries remain in their historical Period
Reports. Same-day replay follows stored array order.

Creating an Account can also record a non-zero observed balance. The Account is saved first and
the Checkpoint second; if the second write fails, the Account remains and **Retry checkpoint**
completes the intended balance without recreating it. Reconciliation appends a new Checkpoint after
showing calculated balance, observed balance, difference, date, and optional reason. Checkpoints
can be edited or deleted individually and cannot become Expenses or Income.

Display names may change without rewriting the Ledger. A referenced Account Key or Currency cannot
change, and a referenced Account cannot be deleted. When invalid documents make reference safety
uncertain, the mutation remains blocked.

## Expenses, Income, and Categories

Add entry defaults to Expense, today's local date, and Amount focus. Account, positive Amount, and
non-future Date are required; Category and Description are optional. Amount precision follows the
Account Currency. Editing may change all fields, but moving an Entry to another Account requires
the same Currency, and changing Expense to Income clears its Category.

Expense and Income Categories have separate flat namespaces, stable Keys, editable names, and an
optional color. A Category can be created from Add entry before the Entry is written. A Category
write failure creates no Entry; a later Entry failure leaves the Category saved and retains the
form draft. Referenced Category Keys cannot change or be deleted. **Uncategorized** is intentional
absence; **Unknown category** is an unresolved or wrong-type reference.

Entry deletion requires confirmation and relies on vault recovery or backups rather than a private
audit log. Moving an Entry to another Month copies the edited Entry with its existing UUIDv7 before
removing the source. A destination failure leaves the source unchanged; a source-removal failure
leaves both copies visible as a duplicate conflict, and neither contributes to authoritative
projections until the user resolves it.

