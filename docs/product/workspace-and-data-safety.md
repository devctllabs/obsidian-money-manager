# Money Workspace and data safety

A Money Workspace is one configured vault-relative root containing Accounts, Categories, Manual
Rates, and calendar-month Ledger documents. Ordinary Markdown is the only durable financial
authority; settings contain the root and appearance preferences, while indexes, balances, reports,
and charts are rebuildable projections. This implements the ownership commitment in
[PDR-0001](./decisions/0001-own-and-edit-data-without-the-plugin.md).

## Setup and connection

First use creates valid empty `ACCOUNTS.md`, `CATEGORIES.md`, and `RATES.md` documents after the
user chooses a root and Reference Currency. Setup previews those paths, installs no sample data,
preflights all existing catalogs before writing, and can resume after a compatible partial setup.
It never overwrites an incompatible document.

An existing root is connected only after all managed documents pass validation. Changing the
configured root is a connection, not a move: the previous Money Workspace and all its files remain
untouched. A failed validation or settings save leaves the active root unchanged.

## Document ownership and direct edits

Money Manager owns only the documented `money_manager` frontmatter fields. Writes preserve
unrelated frontmatter, extension fields on known records, and the complete Markdown body. Monthly
documents are created with their first Ledger Entry and remain after their last Entry is deleted.
The complete storage contract is in the [Markdown data model](../data-model.md).

Create, modify, rename, and delete events below the active root refresh the shared index. A valid
Ledger Entry remains usable when a sibling record is invalid. Invalid financial records and
unreadable documents are excluded from authoritative projections, identify their source path and
record where possible, and mark affected balances or Period Reports incomplete. An unknown
Category remains in Native Amount totals as **Unknown category**, but still produces a diagnostic.
Money Manager never silently repairs or migrates user-authored financial data.

## Runtime boundary

The Obsidian plugin is local-only, works offline, and supports desktop and mobile through public
Obsidian APIs. It has no account, backend, telemetry, bank connection, remote rate feed, secret
storage, or AI runtime. The optional external agent workflow is a separate capability described in
[Agent-assisted authoring](./agent-assisted-authoring.md); the plugin does not depend on it.

