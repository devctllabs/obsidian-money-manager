# Money Manager Surface Brief

Status: accepted pre-implementation brief. This is not `DESIGN.md`.

## Job and audience

One person opens Money Manager inside an active Obsidian vault to capture a
financial fact, understand spending for a calendar period, or reconcile several
fiat Accounts. This is an **Operate** surface: speed, exact amounts, provenance,
and familiar controls outrank spectacle.

The user should be able to answer, without calculation:

- what was spent or received this Month or Year;
- which Categories produced that amount;
- which selected Accounts and Native Currencies contributed;
- whether a combined number is native or valued at current Manual Rates;
- what each Account's current reconciled Balance is.

Success is a quick Entry followed by a report whose exact Markdown and
calculation assumptions remain inspectable.

## Outcome and proof

The interface proves the product through real ledger structure, not financial
claims. Exact Native Amounts remain visible beside every Converted Total. The
single analytical canvas shows one selected question at a time and always pairs
color with labels, values, and percentages. Account Balance rows expose their
last Checkpoint context instead of presenting unexplained numbers.

Demonstration fixtures may use clearly synthetic Accounts and Entries. They must
not imply bank connectivity, live rates, historical market accuracy, savings
advice, or user outcomes.

## Selected direction

Money Manager is a sibling to Focus Flow's deliberate writing workspace. It
inherits the compact Obsidian shell, host interface typography, quiet dividers,
flat working rows, 7–8 px control character, one restrained accent, progressive
disclosure, lifecycle-safe overlays, and theme-aware accessibility.

It does not clone Focus Flow's work-management hierarchy or kanban composition.
Its own visual material is a precise ledger: aligned amounts, explicit Currency
labels, one thin category ring, and a chronological Entry rhythm. The memorable
element is the two-axis analytical canvas, where flow and Currency can change
without losing native summaries or the source Entries below.

Color strategy is Restrained. Obsidian's accent owns selection, focus, and the
primary action; sibling Indigo or one valid custom accent is optional. Category
colors live only in the chart, legend markers, and small row cues. Green never
means money by default, and red never marks an ordinary Expense as an error.

Use the host sans-serif stack at compact 14 px working density. Financial digits
use tabular numerals from the same family; no decorative display face or generic
monospace dashboard labels. Headings identify task and period through weight and
space rather than oversized typography.

## Scope and boundaries

The brief covers the complete V1 visual surface:

- one ItemView shell with Overview and Accounts modes;
- Month and Year report states;
- Add/edit Entry modal and delete confirmation;
- Account CRUD and Reconcile balance flow;
- React Category and Manual Rate settings;
- first-use, empty, incomplete, pending, and error states;
- full leaf, narrow leaf, pop-out, mobile, light, and dark presentation.

It excludes a marketing page, onboarding tour, net-worth chart, budget UI,
Transfer form, bank connection, recurring-entry editor, custom icon system,
illustration, ornamental imagery, and `DESIGN.md`. The built UI will establish
the final reusable design system after visual review.

## States and design test ranges

These are layout test bounds, not product caps:

- zero Accounts; one Account; 6 typical Accounts; 20 dense Accounts;
- zero Categories; 8 typical Categories; 30 dense Categories;
- no Entries; one Entry; 40 Entries in a Month; 500 grouped Entries in a Year;
- one Native Currency; three typical Currencies; a missing Manual Rate;
- short labels; wrapped names; long unbroken Keys; negative Balances;
- complete data; one invalid Entry; a syntactically unreadable Month;
- initial load; retained data with refresh error; mutation pending and failure;
- duplicate UUID conflict after a partial cross-month move.

An empty state teaches one next action. An incomplete report remains visually
distinct from a valid zero. Retained stale data carries an inline warning and is
never styled as a complete current result.

## Interaction and layout

### Shared shell

Overview and Accounts are compact text tabs in the top shell. A quiet page-menu
action opens Obsidian Settings. The selected mode, visible heading, and first
content edge share one alignment. The primary **Add entry** action remains easy
to find without becoming a floating or oversized call to action.

Desktop/full leaf:

```text
Overview   Accounts                                      Add entry
─────────────────────────────────────────────────────────────────
September 2026   ‹  ›   Month | Year    Accounts: All

GEL   Spent 1,240.30   Received 3,800.00
USD   Spent   190.00   Received   500.00

Expenses | Income              GEL | USD | All in GEL
┌──────────────────────────────┬──────────────────────────────┐
│      thin category donut     │ label            amount  %  │
│      selected exact total    │ label            amount  %  │
└──────────────────────────────┴──────────────────────────────┘

12 monthly bars in Year only
─────────────────────────────────────────────────────────────────
12 Sep  Groceries       TBC everyday   Food       −42.30 GEL  …
```

The summary is a flat typographic ledger, not a row of elevated cards. The donut
and legend form one semantic figure. The ring is restrained and relatively
thin, leaving exact values in the legend as the primary reading path.

**Expenses / Income** and Currency tabs are independent segmented controls.
Native tabs include only selected Accounts in that Currency. **All in _X_** is a
separate tab state with a nearby target Currency control and the persistent copy
**At current manual rates**. Missing rates replace the combined figure with a
specific corrective action while native tabs remain available.

Month renders a flat newest-first Entry list. Year adds compact bars and groups
the list by collapsible Month headings. Edit/Delete belongs to the Entry row's
action menu, never to the Month heading. Row density gives Date, description,
Account, Category, and Native Amount stable scanning positions; optional detail
wraps beneath rather than forcing horizontal scrolling.

### Narrow leaf and mobile

```text
Overview   Accounts                         +
─────────────────────────────────────────────
September 2026     ‹  ›
Month | Year       Accounts (3)

GEL   Spent 1,240.30
      Received 3,800.00
USD   Spent 190.00 · Received 500.00

Expenses | Income
GEL | USD | All in GEL

thin donut
Food                              620.00  50%
Transport                         310.00  25%

12 Sep  Groceries
TBC everyday · Food              −42.30 GEL  …
```

Responsive behavior follows the leaf container, not only the viewport. Controls
wrap in reading order, touch targets remain usable, and row metadata drops to a
second line. The Year plot becomes labeled horizontal month rows when axes would
be unreadable. The donut never shrinks below legibility to preserve a two-column
desktop composition.

### Accounts

Accounts begins with one optional Converted Total in the selected target
Currency, labeled with its current-rate assumption. Account rows stay flat and
show name, Native Balance, Currency, and a secondary converted value only when
conversion is complete. Row actions are **Reconcile balance**, **Edit**, and
**Delete**. A blocked delete explains the referencing Months instead of exposing
a disabled unexplained action.

Reconcile balance is a focused dialog: calculated Balance, observed Balance,
derived difference, Date, optional reason, then **Save checkpoint**. Difference
uses neutral typography unless it represents validation or failure.

### Add entry

The modal uses one compact vertical path:

1. Expense / Income selector.
2. Amount as the strongest input, with Account Currency visible after selection.
3. Account.
4. `Find or create category...`.
5. Date and optional Description.
6. **Add expense** or **Add income**, using the same verb in pending and success
   feedback.

No nested Account editor or full Category editor appears in the modal. Creating
a Category is one combobox option; color remains in Settings. Validation appears
beside its owner and an asynchronous failure keeps every typed value.

### Motion and feedback

Use approximately 160 ms only for user-triggered disclosure, Month expansion,
and the analytical canvas changing data. A changed donut, bars, and legend update
as one event rather than unrelated animations. Reduced motion makes every change
immediate. Loading uses quiet structural placeholders; no centered spinner,
page-load choreography, decorative hover motion, or celebratory finance effect.

## Accessibility and copy

Charts have accessible SVG titles and adjacent complete legends. Color is never
the only Category, selection, warning, positive/negative, or missing-rate cue.
Use tabular numbers, locale-correct formatting, visible minus signs, and explicit
Currency codes where ambiguity is possible.

Every action is a semantic button or control with visible `:focus-visible`.
Segmented controls expose pressed/selected state. Dialogs trap and restore focus,
support Escape, and announce validation and async errors. Forced colors retain
chart boundaries and legend mapping. All controls remain keyboard-complete.

Copy is English, sentence case, direct, and consistent: **Add entry**, **Add
expense**, **Add income**, **Reconcile balance**, **Save checkpoint**, **At
current manual rates**, **Uncategorized**, and **Unknown category**. Errors state
what failed, what remains saved, and the next action;
they do not apologize or say only that something went wrong.

## Direction contract

Mode: Operate. Scope: the complete Money Manager plugin workspace on desktop and mobile.

**THESIS:** Exact native money stays visible while one analytical canvas answers one period question without dashboard-card noise.

**OWN-WORLD:** Focus Flow's compact host type, flat rows, quiet dividers, restrained accent, tabular amounts, and one thin accessible category ring.

**STORY:** Capture an Entry, inspect Month or Year flows, then reconcile Accounts without losing Markdown or valuation assumptions.

**FIRST VIEWPORT:** Mode tabs and Add entry lead into period controls, native Spent/Received lines, one flow × Currency canvas, then Entries. Accounts leads with optional valuation and flat Balance rows.

**FORM:** Sibling deliberate-writing workspace; no seed because the user pinned Focus Flow. Signature: flow and Currency change donut, legend, and Year bars as one 160 ms transition.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## User-directed revision — 2026-09-13

The user replaces the initial UI with Focus Flow's UX styling: quiet tabs,
ellipsis action menus, searchable currency dialog, searchable Account selection,
stronger typographic hierarchy and the same accent/color swatches with HEX.
Category legends and Settings lists paginate at six rows; all categories remain
reachable and chart/overall totals always include the full financial selection.
This explicitly supersedes earlier requirements for simultaneously visible
unpaginated legends and generic native dropdowns.

Final follow-ups: Entries paginate at 20. Categories use a search-first dialog
with at most eight matches, and Settings uses Focus Flow-like inline Tag catalog
editing. Workspace supports browsing, existing-root connection and new-root
creation with a file preview. Manual Rates use compact table rows. Edit/Delete/
Reconcile share the dialog design; reconciliation is in the Account action menu,
and Balance history explains its records. Back is a compact arrow/text control.
