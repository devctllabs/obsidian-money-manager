# Product

<!-- impeccable:product-schema 1 -->

## Platform

Obsidian desktop and mobile, with an optional external Node.js companion CLI
and agent skill.

## Stack

Implemented as one strict TypeScript and React Obsidian plugin bundled with
esbuild. Vite is limited to Vitest and Storybook. The separately bundled Node.js
CLI reuses the host-independent validation core, while the optional agent skill
is maintained and installed separately.

## Users

Money Manager is for one person who already keeps important information in an
Obsidian vault and wants to understand personal spending without surrendering
their financial record to a proprietary database or service. The primary user
captures entries frequently, reviews spending monthly and yearly, and manually
reconciles several fiat accounts.

## Product Purpose

Money Manager provides a calm, trustworthy ledger for expenses and income,
current account balances, category analysis, and optional user-controlled
currency valuation. Success means the user can record an entry quickly, inspect
the exact Markdown behind it, reconcile each account, and understand a period
without wondering which hidden state or external rate produced a number.

## Positioning

Money Manager is an Obsidian-native financial ledger whose Markdown remains the
authority. Unlike a generic expense dashboard, it keeps original account
currencies visible and treats cross-currency totals as explicit valuations made
with the user's current manual rates, never as historical banking facts.

## Operating Context

The primary product runs inside one person's Obsidian vault on desktop and mobile.
Financial documents live below one configured vault-relative root and may be
edited directly. One ItemView contains Overview, Accounts, and Settings modes.
Obsidian Settings remains a fallback entry point for the same workspace,
appearance, category, and rate configuration. Vault
sync may replicate the same person's notes across devices, but sync conflicts
and backup history remain Obsidian or vault concerns. Optional agent-assisted
authoring runs outside Obsidian, requires an explicit confirmed preview, and
uses a read-only validation CLI.

## Capabilities and Constraints

- Expenses, income, and balance checkpoints are the only V1 Ledger Entry types.
- Each Expense or Income affects exactly one Account and is recorded in that
  Account's immutable ISO 4217 fiat Currency.
- A Balance Checkpoint records an absolute observed balance. Checkpoints make
  reconciliation and backdated capture possible without rewriting prior Entries.
- Accounts and Categories use stable readable Keys; Ledger Entries use UUIDv7.
- Categories are flat, typed as Expense or Income, optional on Entries, and may
  have one display color. New Workspaces begin with an empty catalog.
- A Category can be created from the Add entry form. Accounts are created only
  in Accounts mode.
- Month and Year Reports can select one or many Accounts. Native Currency totals
  are primary; a Converted Total is opt-in and uses current Manual Rates.
- Markdown is canonical. Runtime indexes and every aggregate are rebuildable.
- The plugin runtime is local-only and has no network client, account, telemetry,
  advertising, secret storage, bank integration, remote rate feed, or AI runtime.
- The optional external agent workflow validates, previews, confirms, writes,
  and validates again; the plugin does not depend on it.
- V1 excludes Transfers, budgets, goals, recurring or scheduled Entries,
  historical account-balance or net-worth charts, attachments, imports, crypto,
  teams, permissions, and realtime collaboration.
- The V1 interface and documentation are English-only.

## Brand Commitments

The product name is **Money Manager** and the permanent plugin identifier is
`obsidian-money-manager`. It is a sibling product to Focus Flow:
compact, quiet, Obsidian-native, and progressively disclosed rather than a
decorative fintech dashboard. Obsidian's accent is the default, with an optional
plugin-specific override. Category colors support recognition but never carry
meaning alone.

## Evidence on Hand

The sibling `obsidian-focus-flow` repository is the confirmed architectural and
visual reference for Markdown ownership, a rebuildable index, React ItemView
lifecycle, accessible SVG charts, settings ownership, responsive density, and
safe vault mutation patterns. This repository contains the implemented plugin,
companion CLI and skill, automated tests, and screenshot review artifacts.
It contains no users, adoption metrics, testimonials, pricing, or market claims;
future work must not invent them.

## Product Principles

1. **Native amounts before valuation.** Preserve the exact amount and Currency
   of each Account before offering a combined estimate.
2. **Markdown remains sovereign.** A user can inspect, edit, sync, back up, and
   retain the complete financial record without the plugin.
3. **Reconciliation is explicit.** A corrected balance becomes a dated fact in
   the Ledger rather than a silent mutation of old history.
4. **Analysis stays calm and legible.** One focused chart and exact textual
   values are preferable to a grid of competing dashboard widgets.
5. **Scope earns complexity.** V1 implements only the entry, balance, category,
   rate, and period workflows already required.

## Accessibility & Inclusion

Every amount, category, selected state, validation failure, and chart value must
remain understandable without color. All actions require keyboard-complete
alternatives, visible focus, programmatic labels, and perceivable pending and
error states. The interface must tolerate narrow leaves, mobile dimensions,
high zoom, long names, light and dark themes, community themes, reduced motion,
forced colors, and pop-out windows.
