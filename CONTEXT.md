# Money Manager

Money Manager is a personal financial ledger that records money moving into or
out of named Accounts and derives current balances and period summaries from
those facts.

## Workspace and Accounts

**Money Workspace**:
One coherent collection of a person's Accounts, Categories, Manual Rates, and
Ledger.
_Avoid_: Vault, portfolio, database

**Account**:
One named holder of money in exactly one Currency whose balance is described by
Ledger Entries.
_Avoid_: Bank, card, wallet, balance

**Account Key**:
A stable, human-readable identity for one Account that remains unchanged when
the Account's display name changes.
_Avoid_: Account name, account number

**Currency**:
The ISO 4217 fiat unit in which one Account and all of its Entries are recorded.
_Avoid_: Asset, coin, display currency

**Account Balance**:
The amount derived for one Account from its latest Balance Checkpoint and the
later Expenses and Income.
_Avoid_: Stored balance, opening balance

## Ledger

**Ledger**:
The complete ordered collection of Ledger Entries in a Money Workspace.
_Avoid_: Transaction database, history cache

**Ledger Entry**:
One dated financial fact belonging to exactly one Account: an Expense, Income,
or Balance Checkpoint.
_Avoid_: Transaction, operation, row

**Expense**:
A positive Native Amount that left one Account for an optional Category and
description.
_Avoid_: Negative Income, debit

**Income**:
A positive Native Amount that entered one Account for an optional Category and
description.
_Avoid_: Negative Expense, credit

**Balance Checkpoint**:
A dated statement of an Account's observed absolute balance that becomes the
new basis for later balance calculation.
_Avoid_: Adjustment, delta, edited balance

## Classification and Reporting

**Category**:
A reusable, stable classification for either Expenses or Income, with a display
name and optional color.
_Avoid_: Tag, account, budget

**Uncategorized**:
The explicit report group for Expenses or Income that intentionally has no
Category.
_Avoid_: Unknown Category, invalid Entry

**Period Report**:
A projection of Expenses or Income for one calendar Month or Year and a selected
set of Accounts.
_Avoid_: Ledger, Balance History, net-worth report

**Native Amount**:
An Entry amount expressed in the Currency of its Account and never changed by a
Manual Rate.
_Avoid_: Converted amount, base amount

**Reference Currency**:
The Currency against which Manual Rates are stated so every configured pair has
one unambiguous derived conversion.
_Avoid_: Account Currency, mandatory report currency

**Manual Rate**:
The user's current positive valuation of one Currency in units of the Reference
Currency.
_Avoid_: Bank rate, historical rate, market rate

**Converted Total**:
An optional derived valuation of selected Native Amounts in one chosen Currency
using the current Manual Rates.
_Avoid_: Native total, historical exchange value
