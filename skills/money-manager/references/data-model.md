# Markdown Data Model

Status: implemented V1 storage contract. This is the authoritative Markdown
format reference for both the plugin and the companion skill.

## Canonical workspace layout

One configured vault-relative root contains every durable Money Manager datum:

```text
Money Manager/
├── ACCOUNTS.md
├── CATEGORIES.md
├── RATES.md
└── Ledger/
    ├── 2026/
    │   ├── 01.md
    │   └── 09.md
    └── 2027/
        └── 01.md
```

`Money Manager` is the default root, not a fixed path. The three catalog file
names and the `Ledger/YYYY/MM.md` topology are stable within the configured
root. Arbitrary nested Ledger paths are non-canonical.

The calendar path is organization over canonical Entries, not a separate
archive or report authority. A Month Report is projected from Entry dates; the
path is a visible, repairable invariant that makes ordinary vault navigation
predictable.

## Document ownership

Every managed document has YAML frontmatter with one `money_manager` mapping.
Money Manager owns the documented fields beneath that mapping. It preserves:

- unrelated top-level frontmatter keys;
- unknown extension fields beneath known records;
- the entire Markdown body, including headings, links, tags, comments, block
  IDs, embeds, and formatting.

All documents carry `schema_version: 1` and a role-specific `type`. A missing,
invalid, or newer schema is read-only until explicitly repaired or migrated.
The plugin never treats its settings data, runtime index, Storybook fixtures, or
generated charts as financial authority.

## Accounts document

`ACCOUNTS.md` contains a mapping keyed by stable Account Key:

```markdown
---
aliases:
  - My accounts
money_manager:
  schema_version: 1
  type: accounts
  accounts:
    tbc-gel:
      name: TBC everyday
      currency: GEL
    savings-usd:
      name: Dollar savings
      currency: USD
---

# Accounts

These accounts are managed by Money Manager. Notes below this paragraph are
mine and must be preserved.
```

Each Account has:

| Field | Type | Rule |
| --- | --- | --- |
| map key | Account Key | Unique, stable, human-readable Key |
| `name` | non-empty string | User-facing name; editable |
| `currency` | ISO 4217 code | Fiat Currency for every referenced Entry |

An Account does not store a balance, opening amount, bank identifier, account
number, provider, or secret. A Key and Currency may change only while no Ledger
Entry references the Account. A referenced Account cannot be deleted.

Account Keys use normalized lowercase Unicode letters or numbers separated by
single hyphens. They match
`^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$` under Unicode-aware validation. A display
name may contain any ordinary user text and does not need to match its Key.

## Categories document

`CATEGORIES.md` keeps Expense and Income namespaces separate:

```markdown
---
money_manager:
  schema_version: 1
  type: categories
  categories:
    expense:
      groceries:
        name: Groceries
        color: "#0F766E"
      transport:
        name: Transport
    income:
      salary:
        name: Salary
        color: "#6750A4"
---

# Categories

The catalog starts empty. These values are examples, not installation defaults.
```

Each Category has:

| Field | Type | Rule |
| --- | --- | --- |
| map key | Category Key | Unique within its Expense or Income namespace |
| `name` | non-empty string | User-facing name; editable |
| `color` | optional `#RRGGBB` | Recognition aid, never the only visible label |

Category Keys follow the Account Key format. Expense and Income may use the
same Key because their namespaces are distinct. A Key is immutable once an
Entry references it. A referenced Category cannot be deleted until the
references are cleared or reassigned.

An Entry with no `category` is valid and belongs to **Uncategorized**. An Entry
with a missing or wrong-type Category reference remains included in its Native
Amount totals, appears under **Unknown category**, and produces a diagnostic.

## Rates document

`RATES.md` stores one current, user-authored valuation table:

```markdown
---
money_manager:
  schema_version: 1
  type: rates
  reference_currency: GEL
  rates:
    USD: "2.7000"
    EUR: "3.1600"
---

# Manual rates

Each value says how many GEL one unit of the named Currency is worth to me.
```

`reference_currency` is an ISO 4217 fiat code with an implicit rate of exactly
one. Every explicit rate is a positive base-10 decimal string stating:

```text
1 unit of source Currency = rate units of Reference Currency
```

The reference code must not also appear in `rates`. The table has no effective
date and no history. Replacing a rate changes future Converted Total projections,
including projections of old periods, but never changes a Native Amount.

Reference Currency and rates are one mutation. When the UI changes the
Reference Currency, it can rebase only a complete valid table: it derives every
proposed new rate from the old cross-rates, presents the complete result, and
saves only after confirmation. Direct Markdown edits must already provide a
self-consistent table; the plugin never guesses missing values.

For source Currency `S`, target Currency `T`, and Native Amount `A`:

```text
rate(reference) = 1
convert(A, S, T) = A × rate(S) ÷ rate(T)
```

Conversion remains unavailable if either required rate is missing or invalid.
Money Manager never substitutes a market rate, a rate from another Account, or
zero.

## Monthly Ledger document

One file owns all Entries whose local Date falls in the corresponding calendar
Month. `Ledger/2026/09.md` has `period: 2026-09`, and every Entry date begins
with `2026-09`.

```markdown
---
cssclasses:
  - personal-ledger
money_manager:
  schema_version: 1
  type: ledger_month
  period: 2026-09
  entries:
    - id: 019949d2-89e7-7f12-8d44-0dc85e414342
      type: balance_checkpoint
      date: "2026-09-01"
      account: tbc-gel
      balance: "1250.00"
      reason: Matched the bank app
    - id: 019949d3-51e4-7497-9a43-b7114b013f48
      type: expense
      date: "2026-09-02"
      account: tbc-gel
      amount: "42.30"
      category: groceries
      description: Weekly groceries
    - id: 019949d4-2adb-7c89-b192-7a6f46ad0ca3
      type: income
      date: "2026-09-05"
      account: savings-usd
      amount: "500.00"
      category: salary
      description: September payment
    - id: 019949d5-697b-71cc-a507-84aef78660b2
      type: expense
      date: "2026-09-08"
      account: savings-usd
      amount: "18.75"
---

# September 2026

This body is user-owned Markdown. Money Manager changes only its namespaced
frontmatter.
```

A Month file is created lazily with its first Entry. Deleting its last Entry
leaves a valid empty file so the plugin never destroys a user-owned body.

### Common fields

| Field | Type | Rule |
| --- | --- | --- |
| `id` | UUIDv7 string | Globally unique and immutable |
| `type` | discriminator | `expense`, `income`, or `balance_checkpoint` |
| `date` | quoted `YYYY-MM-DD` | Valid local calendar Date, not in the future |
| `account` | Account Key | Must resolve to one Account |

Array position is the stable tie-breaker for Entries with the same Date. UI
creation appends after existing same-day Entries. Sorting for display may be
newest-first, but serialization preserves canonical array order unless an
explicit edit changes it.

### Expense and Income

| Field | Type | Rule |
| --- | --- | --- |
| `amount` | quoted decimal | Strictly positive Native Amount |
| `category` | optional Category Key | Must belong to the Entry type when present |
| `description` | optional string | Trimmed user description |

Currency is deliberately absent because it is owned by the referenced Account.
Changing an Account Currency after it has Entries would reinterpret history and
is therefore forbidden.

### Balance Checkpoint

| Field | Type | Rule |
| --- | --- | --- |
| `balance` | quoted signed decimal | Absolute observed Account Balance |
| `reason` | optional string | User explanation; never required |

A Checkpoint has no `amount` or `category`. Its absolute `balance` may be zero
or negative. It is part of Account Balance replay and Account activity, but it
is excluded from Expense, Income, Category, and monthly-flow aggregates.

## Decimal and Currency rules

Financial amounts are base-10 strings and are never parsed through binary
floating-point arithmetic. Expense, Income, and Checkpoint scale must not exceed
the standard minor-unit precision of the Account's ISO 4217 Currency. Manual
Rates may carry additional decimal precision.

Native totals are summed exactly per Currency. A Converted Total converts each
Currency subtotal at high precision, sums those converted subtotals, and rounds
once to the target Currency's minor unit for display. Chart percentages use
unrounded values and labels always show rounded display amounts explicitly.

Negative Account Balances are valid. Negative Expense or Income amounts and
zero Expense or Income amounts are invalid; direction is expressed only by the
Entry discriminator.

## Account Balance replay

For Account `A` at today:

1. Read every valid Entry for `A` dated on or before today.
2. Sort by Date ascending, then by stored array position within the Month.
3. Find the last `balance_checkpoint` in that order.
4. Start at its `balance`, or at zero if no Checkpoint exists.
5. Replay only later Entries: add Income, subtract Expenses, and replace the
   running value at every later Checkpoint.

Entries before the selected Checkpoint remain valid Period Report facts but do
not influence the current Account Balance. This is deliberate: an observed
absolute Checkpoint closes uncertainty in earlier balance history without
erasing that history.

Creating an Account with a non-zero observed balance creates a Checkpoint in the
current Month. Reconciliation creates another Checkpoint rather than updating
Account metadata or an old Entry.

V1 does not project historical Account Balances. A future balance-history
feature must define how its requested instant relates to Checkpoints before it
changes this contract.

## Reference integrity

- Duplicate Account or Category Keys invalidate the relevant catalog document.
- Duplicate Entry UUIDs are all excluded from projections until the collision
  is repaired; the index never chooses one silently.
- An unknown Account makes an Entry unusable for amount, Currency, Balance, and
  report projections.
- A missing Category does not lose money: the Entry remains in Native totals and
  uses the explicit **Unknown category** analysis bucket.
- A Category type mismatch is treated as an unknown Category reference.
- An Entry Date that disagrees with the file Month invalidates that Entry. A
  document `period` or role that disagrees with its path invalidates the whole
  Month document.

The index reports exact path, record identity when available, field, and reason.
It never writes while the owning document contains invalid managed records.

## Cross-month Entry move

Changing an Entry Date across a Month boundary affects two canonical files and
uses a copy-first move:

1. Validate the latest source Entry, the destination Month, and both current
   document contents.
2. Append the edited Entry to the destination with the same UUIDv7 identity.
3. Only after that write succeeds, remove the exact source Entry.

A destination-write failure leaves the source unchanged. A later source-remove
failure can leave the same UUID in both Month files, but cannot lose the Entry.
The normal duplicate-identity rule then excludes both copies from authoritative
projections and reports both paths for manual resolution. The plugin never
chooses or deletes one automatically, and it creates no transaction journal or
temporary coordination document.

Single-file creation, ordinary edit, reconciliation, and deletion use the same
current-content preconditions. Quick Category creation intentionally completes
before Entry creation; a later Entry failure may leave an unused but valid
Category and reports that exact partial result.

## Parsing and invalid data

Syntactically valid YAML is decoded from `unknown` and validated record by
record. Valid Ledger siblings remain usable when another Entry is structurally
invalid. Invalid records and duplicate identities are excluded with diagnostics.

Syntactically broken frontmatter makes the document unreadable, so no record can
be recovered from it safely. The index marks the affected projection incomplete
and directs the user to the file. Money Manager never guesses values or rewrites
the document to normalize it.

UI mutations against any document with invalid managed data are blocked until
the file is corrected. Unmanaged frontmatter and Markdown body errors are not
Money Manager diagnostics.

## Settings and view state

Plugin-owned `data.json` is configuration, never financial storage. Its planned
durable shape is limited to:

```yaml
schemaVersion: 1
workspaceRoot: Money Manager
appearance:
  accentMode: obsidian
  customAccent: null
```

`accentMode` is `obsidian`, `indigo`, or `custom`. `customAccent` is persisted
only for custom mode and must be a valid `#RRGGBB` value.

Settings load from `unknown`, normalize defaults, migrate explicit older
versions, serialize current fields only, and save serially. The Reference
Currency, rates, categories, accounts, and balances do not belong in settings.

ItemView state may preserve `mode`, Month/Year selection, period, Account
selection, flow, and Currency view so Obsidian can restore a leaf. This is
navigational state only; losing it never loses or changes financial data.

## Schema evolution

Schema version 1 requires no speculative migration registry. When an actual
incompatible version exists, its implementation must add an explicit
version-by-version migration with preview, affected-file count, backup/sync
warning, serialized writes, interruption recovery, and tests. Opening Obsidian
must never trigger an implicit bulk rewrite.
