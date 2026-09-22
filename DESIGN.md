---
name: Money Manager
description: Focus Flow's compact, quiet workspace design applied to a local financial ledger.
colors:
  primary: "var(--interactive-accent)"
  indigo: "#5B5BD6"
  surface: "#FFFFFF"
  surfaceDark: "#17191E"
  text: "#1D2939"
  textDark: "#EDF0F5"
  muted: "#475467"
  border: "#D9DDE5"
typography:
  body:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  heading:
    fontSize: "28px"
    fontWeight: 650
  label:
    fontSize: "12px"
rounded:
  control: "7px"
  menu: "13px"
  dialog: "15px"
spacing:
  compact: "8px"
  row: "12px"
  section: "16px"
  separation: "24px"
---

## Overview

The user explicitly requested a clone of Obsidian Focus Flow's UX styling on
2026-09-13. Its source is the visual authority: quiet tabs, soft selected states,
flat rows, precise type, compact SVG icons, floating action menus and focused
search dialogs. The earlier generic host-control design is superseded.
Money Manager keeps its own financial model and workflows.

## Colors

Light and dark surfaces use Focus Flow's scoped palette. Obsidian remains the
default accent source. Indigo and custom colors use the same OKLCH contrast
adaptation as Focus Flow, with distinct text, solid, hover, focus and foreground
roles. Presets are Indigo, Blue, Teal, Green, Amber and Rose; custom HEX and
Obsidian reset are available. Category colors use the same swatch controls;
Automatic keeps the existing deterministic color without persisting it.
Uncategorized uses a theme-aware neutral slate, while unknown references use
the warning role. Equal explicit colors remain exact and use slice separation
plus interaction rather than silently changing the user's choice.

## Typography

Use the sibling's interface font stack. Page headings are 28px/650 with -0.03em
tracking; modal headings 23px; section headings 20px; row titles 14px/550;
metadata 12px. Native amounts use tabular numerals, 26px on wide leaves and
22px on narrow leaves. Financial totals remain selectable text.

## Layout

The shell has quiet Overview/Accounts tabs, one Add entry action and a settings
icon. Period navigation uses arrow icons. Accounts opens a searchable multi-
selection dialog. Currency opens a searchable dialog supporting code and name.
The main chart uses a 200px ring beside its legend; narrow leaves stack them.
The legend shows six categories per page, retains every ring segment, and
always displays the overall total. Settings category lists also paginate at
six and offer search. Pagination never changes the selected financial scope.

## Elevation & Depth

Working rows have quiet dividers. Action menus use the Focus Flow soft shadow
and radius; search dialogs use the native modal top layer with a dim backdrop.
Portals copy the originating leaf's tokens and document, including pop-outs.

## Shapes

Controls use 7px corners, menus 13px, dialogs 15px. Category markers and color
swatches are circular. Icons are the sibling's consistent authored SVG set;
there are no decorative bitmap assets or external fonts.

## Components

- `ActionMenu`: labelled ellipsis trigger, Edit/Delete menu items, arrow-key
  navigation, Escape and focus restoration. Shared by Entries, Accounts,
  Checkpoints and Categories.
- `CurrencyField`: code/name search, keyboard selection, empty results and
  retained form values; used consistently in setup, forms, reports and Rates.
- `AccountFilter`: searchable checkboxes, All, Clear, selected count and Done.
- `AccentSetting` / `ColorPalette`: disclosure, preset circles, selected marker,
  `Apply HEX` validation, pending lock, durable-save feedback and failure preservation.
- `CalendarPicker`: native mobile inputs and one anchored desktop popover with
  date, month, direct-year and twelve-year views.
- `MoneySurface` stories: complete in-memory workspace using production
  workflows, including first run and cross-screen changes.

## Do's and Don'ts

- Keep Native Amounts and current-rate provenance visible during conversion.
- Keep every category reachable; totals always include the whole selection.
- Use quiet tabs and ellipsis menus to reduce repetitive action buttons.
- Keep search dialogs and menus usable by keyboard and in a pop-out document.
- Preserve incomplete-data and partial-save messaging; styling does not make
  an incomplete amount authoritative.
- Do not add decorative dashboard cards, financial claims, remote assets or
  color-only meaning.

Storybook interaction/accessibility tests cover the shared shell, menus, search,
palette and pagination. Batched desktop/mobile light/dark review covers the new
design.

### Follow-up UX decisions

Settings now mirrors the sibling's compact disclosure rows. Categories expand
inline like Tags, with search/add, six-row pagination, Name/Key fields, immediate
color swatches, HEX and a deletion menu. Manual rates use a compact Currency /
1 unit in Reference table and a searchable add action.
Workspace folder offers existing-root connection and new-root creation with
parent browsing, name, Reference Currency and explicit catalog-path preview.
Settings remains in the shared shell: Overview and Accounts stay available, the
Settings icon is marked active, and navigation back uses those page controls.

Entry lists paginate at 20, while Category search returns at most eight matches.
Edit/Delete/Reconcile share the dialog vocabulary; entry amount leads the form,
Delete identifies the selected record and uses a destructive action treatment.
Reconcile lives in the Account menu. Balance history shows the record count,
explains checkpoint semantics and marks the current starting point.

Workspace folder uses Focus Flow’s value-first row with Change…, its vault path
picker (search, breadcrumbs, scrollable folders, name, Destination footer), and
the secondary Open an existing workspace instead… action with switch confirmation.
