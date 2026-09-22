# Using Money Manager

Money Manager stores your financial record in Markdown inside your Obsidian vault.
It works offline and makes no network requests. The interface is English-only.

To dictate financial facts to an external agent, install the optional
[Money Manager skill and CLI](../README.md#agent-skill-and-cli). The agent shows
one preview for confirmation before editing your Markdown, then validates the
result. Existing data errors must be repaired before adding new facts. The CLI
checks file consistency; you confirm the intended financial facts.

## Install a local build

Run `pnpm install --frozen-lockfile`, then `pnpm build` and `pnpm package:release`.
Copy `main.js`, `manifest.json`, and `styles.css` from `release/` into your vault's
plugin directory under `obsidian-money-manager`, then enable Money Manager in
Obsidian Community plugins. In a default vault, that directory is
`.obsidian/plugins/obsidian-money-manager/`.

## Create or connect a workspace

Use **Money Manager: Open** from the command palette or the **Open Money Manager** wallet ribbon
button.
Choose a vault-relative root and a Reference Currency. **Review setup** lists the
three catalog documents; **Use this workspace** creates empty catalogs. No sample
accounts, categories, or ledger months are installed.

To use an existing Money Workspace, select **Connect existing workspace**. To
switch later, use Money Manager's settings. All candidate documents are checked
before the root changes. Switching never moves files or alters your previous
workspace. If setup stops after a partial write, correct the reported problem
and retry with the same root and Reference Currency; compatible empty catalogs
are reused. Conflicting documents are never overwritten.

## Accounts and checkpoints

Open **Accounts**, then **Add account**. Name the account and choose its ISO fiat
Currency. Its readable Key defaults from the name. A nonzero observed balance
creates a Balance Checkpoint after the Account is saved; zero creates no Entry.
If only the Account was saved, **Retry checkpoint** repeats the second step.

**Reconcile balance** shows the calculated balance, observed balance, difference,
Date, and optional reason. Saving records a new absolute Balance Checkpoint.
The latest Checkpoint becomes the basis for later Income and Expenses. Earlier
Entries still appear in their period reports, so adding a backdated Expense
before that Checkpoint does not change a later reconciled balance.

Expand **Balance checkpoints** to edit or delete individual Checkpoints. These
actions recalculate the current balance. A Checkpoint cannot become an Expense
or Income. Same-day replay follows the saved array order.

Rename an Account freely. Changing its Key or Currency, or deleting it, is
blocked while Ledger Entries reference it. If damaged documents prevent checking
references, repair the listed documents first.

## Capture and maintain entries

Use **Add entry** from the view or command palette. The form starts with Expense,
today's Date, and focus on Amount. Select an Account, enter a positive Native
Amount, and optionally choose a Category and Description. Future dates, zero or
negative flow amounts, and excess currency precision are rejected. JPY permits
zero decimal places; USD and GEL permit two; KWD permits three.

The searchable Category field accepts an existing name or a new Category name.
The form explains when saving will create a Category. A new Category is saved
first, without a color. If the Entry write then fails, the Category remains and
the form keeps your draft. Retrying reuses that Category.

Use the explicit **Edit** or **Delete** actions on a row. Changing Expense to
Income clears its Category. Account reassignment requires the same Currency.
Deletion requires confirmation and preserves the Month document and its body,
even when the last Entry is removed. Recovery uses your existing Obsidian file
recovery, sync history, or backups; Money Manager adds no private trash or log.

Changing an Entry's Date to another Month first copies it with the same UUID,
then removes the original. A destination failure leaves the original unchanged.
A source-removal failure leaves both copies and a diagnostic naming both files;
neither contributes to authoritative totals until you resolve the duplicate in
Markdown. The plugin never chooses a winner automatically.

## Categories

Money Manager Settings has separate Expense and Income lists. Create or edit a
Category's display name and optional `#RRGGBB` color. An unset color is derived
consistently for display and is never written back automatically. Referenced
Keys cannot change or be deleted. Changing a name or color does not rewrite the
Ledger.

**Uncategorized** means you intentionally left Category empty. **Unknown
category** means a saved reference cannot be resolved for that Entry type. An
unknown Category produces a diagnostic but does not remove the Native Amount
from totals.

## Month and Year reports

Overview defaults to the current calendar Month and all Accounts. Use Previous,
Next, the period input, and Month/Year controls. On desktop, open the period to
type a complete four-digit year, browse twelve years, or choose from the month
grid. A partial year stays in the field without refreshing the report. A
complete year immediately changes the report and keeps the current month until
you select another one. Entry dates use
the same picker with a Monday-first day grid; mobile uses the system picker. The Account selector supports
keyboard checkboxes, select-all, and clear-selection. Empty selection means no
Accounts, not all Accounts.

Spent and Received remain separate for each Native Currency. Flow and Currency
controls choose the single category chart. Every segment has a text label,
amount, and percentage; hover, focus, or tap a segment to show all three in a
tooltip. Neutral Categories receive stable fallback colors, Uncategorized uses
a neutral slate, and equal explicit colors remain separated. Categories are never silently combined into Other.
Year shows twelve monthly values, including zeros, and expandable Months with
the same Entry actions. Checkpoints appear in the Ledger but never in flow
summaries, category shares, or monthly bars.

Each open leaf keeps its own navigational state. Leaves share the same indexed
financial data. Close and reopen a view to recover from a rendering error.

## Manual rates and conversion

In Settings, each rate means **1 unit of its Currency equals this many units of
the Reference Currency**. The Reference Currency has an implicit rate of 1 and
must not also appear in the explicit table. Blank means no rate. Rates must be
positive decimal strings; the plugin never downloads rates.

Choose **All in Currency** explicitly for a report or selected Account balances.
The result is labeled **At current manual rates**. Missing source or target
rates are all listed and prevent only the combined valuation; Native Amounts
remain visible. Editing a current rate changes Converted Totals for old periods
as well as new ones, without changing any Native Amount.

Conversion sums exact Native Currency subtotals using rational arithmetic and
rounds once to the target Currency's minor unit. Final rounding is half-up;
negative ties round away from zero. Individual secondary account values can
therefore differ slightly in summed rounding from the combined total.

Changing Reference Currency requires a complete valid table for the configured
and used Currencies. **Review rebase** shows every proposed rate and its rounding
warning. **Confirm rebase** saves the whole table atomically. Rebased values use
18 decimal places, half-up, and a positive rate that would round to zero is
blocked. Ordinary rate edits preserve all authored precision.

## Direct Markdown edits and diagnostics

The three catalogs and `Ledger/YYYY/MM.md` files are canonical. Money Manager
owns only its documented `money_manager` fields. Writes preserve unrelated
frontmatter values, extension fields, and your entire Markdown body. YAML
formatting inside frontmatter may change when it is serialized.

Create, modify, rename, and delete events update the index. Invalid records are
excluded with their path, identity when available, field, and reason. Valid
siblings remain visible. A malformed or newer-schema document is read-only
until repaired; the plugin does not silently migrate or repair financial data.

Incomplete balances and reports are visibly marked as partial. They must not be
read as reliable zeros or complete totals. Open the diagnostic's document,
repair the Markdown, and the view refreshes without a restart.

## Appearance and supported hosts

Use Obsidian's accent, Indigo, or a custom `#RRGGBB` accent in Settings. Layouts
respond to the leaf width and support keyboard operation, light/dark host
variables, forced colors, and reduced motion.

The runtime uses public Vault APIs and has no Node/Electron dependency.

## Compact controls and colors

Open an Entry, Account, Checkpoint or Category's **…** menu for Edit/Delete.
Search Currency by its code or English name in the currency dialog; arrows and
Enter select, Escape closes and restores focus. Accounts opens a searchable
checkbox list with All accounts, Clear selection and Done.

Category legends and Settings catalogs show six rows per page. The chart and
Total always include every matching category, including categories on other
pages. Settings also provides category search.

Expand **Accent color** to select the Focus Flow palette, use a custom HEX, or
return to Obsidian. Palette choices save immediately; **Apply HEX** saves a
changed valid custom value. Custom accent contrast adapts to light/dark themes. Category
forms offer matching color swatches and HEX; Automatic stores no custom color.

## Workspace creation and catalog editing

In Settings, select **Change…** beside Workspace folder. The Focus Flow folder
picker lets you browse or search for a parent, enter a folder name, and inspect
Destination before **Create workspace**. New empty catalogs inherit the current
reference currency. Existing folders cannot be overwritten.

To connect another root, select **Open an existing workspace instead…**, browse
to it, choose **Use this folder**, then confirm **Use this workspace**. The
catalogs are validated before switching; current files stay where they are.

Categories expand inline like Focus Flow's Tags: search or add, select a row,
change Name/Key, choose a color swatch or HEX, and use its menu for deletion.
Expense and Income namespaces remain separate. Referenced keys are protected.

Entry details paginate at 20 rows. Category selection searches names and keys,
shows at most eight matches, and offers Uncategorized or explicit creation.
Reconcile balance is in the Account's ellipsis menu. **Balance history** explains
saved reconciliations and marks the current starting point for balance replay.
