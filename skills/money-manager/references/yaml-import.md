# YAML batch import

Use this format to add new Expenses and Income for one existing Account. Point
`<workspace-root>` at the folder containing `ACCOUNTS.md`, `CATEGORIES.md`,
`RATES.md`, and the optional `Ledger/` folder.

```yaml
version: 1
account: tbc-gel
entries:
  - type: expense
    date: "2026-09-03"
    amount: "19.50"
    category: groceries
    description: Weekly groceries
  - type: income
    date: "2026-09-04T14:35"
    amount: "100.00"
```

Supply one YAML 1.2 document with exactly `version: 1`, the Account Key in
`account`, and a non-empty `entries` sequence. Each entry requires `type`
(`expense` or `income`), `date`, and a positive quoted decimal `amount` at the
Account Currency's precision. Optionally supply an existing `category` Key
of the matching type and a string `description`. Omit unused optional fields.
Use quoted strings for amounts and dates. Dates use local calendar
`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`. A date without time counts as midnight.
The tool rejects unknown fields, including `id` and `currency`, plus duplicate
YAML keys, aliases, nulls, incompatible types, and invalid references.

```sh
money-manager import "<workspace-root>" "<batch.yaml>" --json
money-manager import "<workspace-root>" "<batch.yaml>" --json --apply
```

Both calls accept `--today YYYY-MM-DD` to set the calendar date used for
validation. By default the tool uses the computer's local date. The first call
returns `status: "preview"` with resolved facts, destination paths, and each
row's effect relative to the latest Balance Checkpoint, if present. Same-minute
order depends on the UUIDv7 assigned during apply. The second call revalidates,
writes, and returns `status: "applied"` with `applied` items containing
`index` (zero-based YAML entry position), `id`, and `path`.

An exact repeat has the same type, Account, normalized minute, Native Amount,
Category, and Description. Date-only and explicit midnight are equivalent.
Within the file an exact repeat is a data error. A match in the Ledger is
reported with its UUID and path and blocks apply by default. Include
`--allow-duplicates` only for an intentionally repeated Ledger match. The flag
still runs all schema and Workspace checks.

Exit `1` reports invalid data and leaves the Workspace untouched. Exit `2`
reports an invocation, filesystem, or final verification error. If only some
Months were written, `status: "partial"` identifies `applied` and `pending`
entries. Inspect the result and validate the Workspace. A later import should
contain only the remaining approved facts, with a fresh preview and confirmation.
