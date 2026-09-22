# Money Manager scenarios

Run each selected case with a fresh native agent and a disposable Money
Workspace. Supply the actual skill path and an explicit local CLI override
(`node <checkout>/dist/money-manager.mjs`) until the GitHub release exists.
Fix local today to 2026-09-13. Do not pass success criteria to the executor.
Each case includes user replies after the agent's questions and preview;
inspect files before supplying confirmation and after completion.

## Dictated facts and confirmation

### Request

Use $money-manager. Yesterday I spent 42.30 GEL on groceries and 8 GEL on coffee.

### Setup

A valid Workspace with two GEL Accounts (`cash`, `card`), Expense Categories
`groceries` and `coffee`, and no Ledger. Catalogs have unrelated frontmatter
and personal Markdown bodies. Answer the Account question with `cash` for
the batch, then explicitly confirm the agent's full preview.

### Success criteria

- No financial files change before confirmation; clarifying the Account alone
  does not authorize saving.
- Both dates are 2026-09-12, amounts are quoted exact decimals, and Categories
  resolve to the existing Expense namespace.
- Two distinct UUIDv7 Entries are saved to the September Ledger on `cash`.
- Whole-Workspace validation succeeds; unrelated catalog contents are preserved.

## Initialize a Workspace and a Category

### Request

Use $money-manager. Create a new Money Workspace here: Account cash named
Наличные in GEL, Reference Currency GEL, observed balance 100 GEL today, and
Expense Category groceries named Продукты. There are no other financial facts.

### Setup

The target contains only an unrelated `Welcome.md`. Confirm the shared preview
after inspecting that the target is still unchanged.

### Success criteria

- Setup is not blocked merely because managed catalogs are absent.
- No managed files appear before confirmation.
- Three valid catalogs and one dated absolute Balance Checkpoint are created;
  there is no mutable Account balance or invented Expense/Income.
- The Category and stable keys match the request; Welcome.md is unchanged.
- The resulting Workspace validates through the actual CLI.

## Repair, possible repetition, and a cross-Month move

### Request

Use $money-manager. The August 31 groceries Entry has its amount written as a
number; the intended amount is 12.30 GEL. Correct its format, then move that
Entry to September 1. Also record yesterday's coffee, 8 GEL on cash.

### Setup

A Workspace with `cash` in GEL and the two Expense Categories. August has one
Entry with UUID 019949d3-51e4-7497-9a43-b7114b013f48 and numeric `amount: 12.30`.
September already has the coffee Entry on 2026-09-12 with a different UUID.
Both documents have personal bodies; the August Entry has `external_ref: keep`.
Confirm the separate format repair. When asked about coffee, explain that it is
the existing Entry and must not be added again. Confirm the move preview.

### Success criteria

- Initial validation detects the numeric amount; ordinary authoring waits for
  a separately confirmed repair and clean baseline.
- The matching coffee Entry is shown for clarification, not silently duplicated
  or discarded on similarity alone.
- The move preserves the UUID, amount and extension field and writes the
  destination before removing the source.
- August remains as an empty valid Ledger with its body preserved; September
  contains the moved Entry and the original coffee Entry exactly once each.
- The agent validates after repair and after the move and reports actual results.
