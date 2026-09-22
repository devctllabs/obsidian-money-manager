# Money Manager

Money Manager is a personal, Markdown-first money ledger for Obsidian. It is
designed to make expenses easy to capture and review by month or year while
keeping accounts, income, categories, and user-defined currency rates in files
the user owns.

## Product at a glance

- Ordinary Markdown in the vault is the durable source of truth.
- Expenses and income are stored in one calendar-month ledger note.
- Account balances are derived from ledger entries and explicit balance
  checkpoints, never from a hidden plugin database.
- Reports can keep native-currency totals separate or optionally value selected
  accounts in any configured currency using current manual rates.
- One Obsidian view provides **Overview** and **Accounts** modes on desktop and
  mobile.
- The plugin is local-only: no account, server, telemetry, bank connection,
  remote exchange-rate feed, or AI runtime.

## Workspace

```text
Money Manager/
├── ACCOUNTS.md
├── CATEGORIES.md
├── RATES.md
└── Ledger/
    └── YYYY/
        └── MM.md
```

Every file remains readable and editable without the plugin. Runtime indexes,
charts, filters, and converted totals are disposable projections of these
notes.

## Documentation

- [Documentation index](./docs/README.md)
- [User guide](./docs/user-guide.md)
- [Product context](./PRODUCT.md)
- [Domain language](./CONTEXT.md)
- [Current product capabilities](./docs/product/README.md)
- [Markdown data model](./skills/money-manager/references/data-model.md)
- [Architecture](./docs/architecture/overview.md)
- [Implemented interface system](./DESIGN.md)
- [Interface brief](./.impeccable/surfaces/money-manager.md)
- [Architecture decisions](./docs/adr/README.md)

## V1 boundary

V1 includes expenses, income, accounts, balance reconciliation, flat typed
categories, manual exchange rates, month/year reports, and entry CRUD. It does
not include transfers, budgets, recurring or scheduled entries, historical
net-worth charts, bank sync, remote rates, crypto assets, attachments, importers,
collaboration, or localization beyond English.

## Agent skill and CLI

The companion skill helps an external agent maintain the same Markdown files:
dictate Expenses or Income, review the proposed dates, Accounts and Categories,
and confirm the whole batch before it is saved. Invoke it explicitly as
`$money-manager`. The CLI validates files; the agent makes the confirmed edits.
The Obsidian plugin itself has no AI runtime or dependency on this CLI.

### Install from GitHub

With Node.js 22+, npm, and Git installed:

```sh
npm install -g --install-links 'github:devctllabs/obsidian-money-manager'
money-manager --version
money-manager validate "/path/to/vault/Money Manager"
```

On npm versions that otherwise link a prepared Git checkout to a temporary
directory, `--install-links` keeps the installed CLI independent of that
temporary checkout. This command installs the current HEAD of the repository's
default branch.
Installation downloads the repository and its build dependencies and runs
`prepare` to build the CLI. npm registry publication and a separate pnpm
installation are not required. CLI validation runs locally without network
requests. Repeat the install command to update, then check `--version`.

### Install from a local checkout

```sh
pnpm install --frozen-lockfile
npm install -g .
money-manager --version
```

`pnpm install` runs `prepare`; `pnpm build:cli` rebuilds after source changes.
The global local-directory installation links to this checkout, so keep it
available. Without global installation, run `node dist/money-manager.mjs`.
The generated `dist/` bundle includes its runtime dependencies and is ignored
by Git.

Maintainers can run `pnpm test:cli:install` to verify Git installation, `prepare`,
the global command and that the installed package does not contain skill
resources in an isolated temporary npm prefix. This check downloads
dependencies and does not change your global installation. Its temporary
artifacts are retained on failure for diagnosis.

### Install the skill

Copy the complete `skills/money-manager/` directory from a repository checkout
into the skill directory used by your agent. The npm CLI package does not
include the skill. Keep its `references/` and `agents/` subdirectories. The
skill uses the installed `money-manager` command; it does not need access to
this source checkout after installation.

### Commands and results

```sh
money-manager validate "/path/to/Money Manager" --json --today 2026-09-13
money-manager new-id
money-manager --help
```

`validate` scans the three catalogs and all Markdown below `Ledger/`; a missing
Ledger directory is valid. It checks the whole Workspace, not just the last
edited file. `--today` defaults to the local system date. `new-id` prints one
UUIDv7. Neither command modifies files. Symbolic links inside managed document
paths are rejected rather than followed.

Exit codes are `0` for success, `1` for data diagnostics, and `2` for invalid
arguments or filesystem errors. JSON is one document on stdout with `status`
(`valid`, `invalid`, or `error`) and `diagnostics`; execution errors add `error`.
Diagnostics contain `path`, optional `record`, `field`, `message`, and `monetary`.
Every diagnostic blocks normal skill authoring, including unknown Categories.
Validation cannot detect a mistaken but structurally valid financial fact.

### CLI release maintenance

Keep `bin` and the CLI's commands and JSON contract compatible across updates
selected from the repository's default branch. Build and test the package
before merging changes to that branch. Use a version tag or commit when a
fixed installation is needed.

## Development

```sh
pnpm install --frozen-lockfile
PLAYWRIGHT_BROWSERS_PATH=.cache/playwright pnpm exec playwright install chromium
pnpm format
pnpm check
pnpm check:full
pnpm test:e2e:headless
pnpm test:e2e:mobile:headless
pnpm verify:release
pnpm package:release
```

`pnpm check` runs formatting, lint, architecture/dead-code quality checks,
strict TypeScript, unit/application/component tests, performance checks,
Storybook browser tests and static build, production build, CLI build and
release verification. `pnpm check:full` adds desktop E2E through Docker and
Xvfb with disposable vaults and separate application state. No real user vault
is used.

Commit messages and pull request titles use Conventional Commits. Maintainers
can preview release notes with the **Preview release** workflow, run the
supported Obsidian desktop/mobile matrix, and publish a draft release with the
**Release** workflow. Release tags use the exact plugin version without a `v`
prefix.

`pnpm format` formats the hand-written TypeScript and JavaScript code. Use
`pnpm format:check` to verify formatting without changing files.

Use `pnpm dev` for an esbuild watch or `pnpm storybook` for isolated UI work.
Run `pnpm build` before `pnpm package:release`; the release directory contains
only `main.js`, `manifest.json`, and `styles.css`.
Public plugin-directory publication is outside this implementation.

## Interactive workspace preview

Run `pnpm storybook` and open **Features → Shell → Money Manager → Loaded**
([direct story](http://localhost:6006/?path=/story/features-shell-money-manager--loaded)).
The complete application is interactive: navigate Overview/Accounts/Settings,
create or edit Entries and Categories, reconcile Accounts, and change Rates.
It uses production workflows with isolated in-memory Markdown. Reload the story
to reset synthetic data; the preview date is September 13, 2026.
Use **First Run** for setup and the theme/frame toolbar for dark or narrow views.
