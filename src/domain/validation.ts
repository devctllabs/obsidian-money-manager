import type { Account, Category, Diagnostic, Entry, LocatedEntry } from './entry';
import { minor, precision } from './money';
import { decodeDocument, mapping, type Fields } from './workspace-document';

class InvalidField extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
  }
}
function requireValue(condition: unknown, field: string, message: string): asserts condition {
  if (!condition) throw new InvalidField(field, message);
}
function validateKey(key: string): void {
  requireValue(
    key === key.normalize('NFC').toLowerCase() && /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(key),
    'key',
    'Use lowercase letters or numbers separated by single hyphens',
  );
}
export function normalizeKey(name: string): string {
  return name
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/gu, '');
}
export function validDate(date: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date) || date > today) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
export function validateAccount(key: string, raw: unknown): Account {
  validateKey(key);
  const record = mapping(raw);
  requireValue(
    typeof record.name === 'string' && record.name.trim(),
    'name',
    'Account name is required',
  );
  requireValue(typeof record.currency === 'string', 'currency', 'Currency is required');
  precision(record.currency);
  return record as Account;
}
export function validateCategory(key: string, raw: unknown): Category {
  validateKey(key);
  const record = mapping(raw);
  requireValue(
    typeof record.name === 'string' && record.name.trim(),
    'name',
    'Category name is required',
  );
  requireValue(
    record.color === undefined ||
      (typeof record.color === 'string' && /^#[\dA-Fa-f]{6}$/u.test(record.color)),
    'color',
    'Use #RRGGBB',
  );
  return record as Category;
}
export function validateRates(managed: Fields): {
  reference: string;
  rates: Record<string, string>;
} {
  requireValue(
    typeof managed.reference_currency === 'string',
    'reference_currency',
    'Reference currency is required',
  );
  precision(managed.reference_currency);
  const rates = mapping(managed.rates);
  for (const [currency, rate] of Object.entries(rates)) {
    precision(currency);
    requireValue(
      currency !== managed.reference_currency,
      'rates',
      'Reference currency has an implicit rate of 1',
    );
    requireValue(
      typeof rate === 'string' && /^\d+(?:\.\d+)?$/u.test(rate) && /[1-9]/u.test(rate),
      'rates',
      `Invalid positive decimal rate: ${currency}`,
    );
  }
  return { reference: managed.reference_currency, rates: rates as Record<string, string> };
}
export function validateEntry(
  raw: unknown,
  context: { period: string; today: string; accounts: Record<string, Account> },
): Entry {
  const entry = mapping(raw);
  requireValue(
    typeof entry.id === 'string' &&
      /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/iu.test(entry.id),
    'id',
    'Expected UUIDv7',
  );
  requireValue(
    ['expense', 'income', 'balance_checkpoint'].includes(String(entry.type)),
    'type',
    'Unknown entry type',
  );
  requireValue(
    typeof entry.date === 'string' &&
      validDate(entry.date, context.today) &&
      entry.date.startsWith(context.period),
    'date',
    'Date must be valid, not future, and match the Month',
  );
  requireValue(
    typeof entry.account === 'string' &&
      Object.prototype.hasOwnProperty.call(context.accounts, entry.account),
    'account',
    'Unknown account',
  );
  const account = context.accounts[entry.account]!;
  validateEntryAmount(entry, account.currency);
  for (const field of ['description', 'reason', 'category'])
    requireValue(
      entry[field] === undefined || typeof entry[field] === 'string',
      field,
      'Expected text',
    );
  return entry as Entry;
}
function validateEntryAmount(entry: Fields, currency: string) {
  const checkpoint = entry.type === 'balance_checkpoint';
  const field = checkpoint ? 'balance' : 'amount';
  requireValue(typeof entry[field] === 'string', field, 'Expected a quoted decimal string');
  try {
    const amount = minor(entry[field], currency);
    requireValue(checkpoint || amount > 0n, field, 'Amount must be positive');
  } catch (error) {
    throw new InvalidField(field, error instanceof Error ? error.message : 'Invalid amount');
  }
  if (checkpoint)
    requireValue(
      entry.amount === undefined && entry.category === undefined,
      'type',
      'Checkpoint cannot have amount or category',
    );
  else requireValue(entry.balance === undefined, 'balance', 'Expense/Income cannot have balance');
}
function roleForPath(path: string, root: string): string {
  const relative = path.slice(root.length + 1);
  const roles: Record<string, string> = {
    'ACCOUNTS.md': 'accounts',
    'CATEGORIES.md': 'categories',
    'RATES.md': 'rates',
  };
  if (roles[relative]) return roles[relative];
  requireValue(
    /^Ledger\/\d{4}\/(?:0[1-9]|1[0-2])\.md$/u.test(relative),
    'path',
    'Non-canonical Ledger path',
  );
  return 'ledger_month';
}
export function checkedDocument(text: string, path: string, root: string) {
  const document = decodeDocument(text);
  requireValue(
    document.managed.type === roleForPath(path, root),
    'type',
    'Document role does not match path',
  );
  if (document.managed.type === 'ledger_month') {
    const period = path.slice(-10, -3).replace('/', '-');
    requireValue(document.managed.period === period, 'period', 'Period does not match path');
    requireValue(Array.isArray(document.managed.entries), 'entries', 'Expected an entry array');
  }
  return document;
}
export function diagnostic(error: unknown, path: string, record?: string): Diagnostic {
  return {
    path,
    record,
    field: error instanceof InvalidField ? error.field : 'document',
    message: error instanceof Error ? error.message : 'Cannot read document',
    monetary: true,
  };
}
export function excludeDuplicates(
  entries: LocatedEntry[],
  diagnostics: Diagnostic[],
  identities: Array<{ id: string; path: string }>,
): LocatedEntry[] {
  const groups = new Map<string, Array<{ id: string; path: string }>>();
  for (const identity of identities) {
    const key = identity.id.toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), identity]);
  }
  for (const copies of groups.values()) {
    if (copies.length === 1) continue;
    for (const copy of copies)
      diagnostics.push({
        path: copy.path,
        record: copy.id,
        field: 'id',
        message: `Duplicate UUID in ${copies.map((item) => item.path).join(', ')}`,
        monetary: true,
      });
  }
  return entries.filter((row) => groups.get(row.entry.id.toLowerCase())?.length === 1);
}
