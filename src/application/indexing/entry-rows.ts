import type { Category, Entry, LocatedEntry } from '../../domain/entry';
import { formatMinor, minor } from '../../domain/money';
import type { Snapshot } from './read-model';
export function entryRows(snapshot: Snapshot, entries: LocatedEntry[]) {
  return entries
    .slice()
    .reverse()
    .map((row) => {
      const entry = row.entry;
      const account = snapshot.accounts[entry.account]!;
      const category = categoryLabel(snapshot, entry);
      const validCategory = entryCategory(snapshot, entry);
      return {
        row,
        id: entry.id,
        date: entry.date,
        label: entryLabel(entry, validCategory),
        account: account.name,
        category,
        categoryColor: validCategory?.color,
        amount: entryAmount(entry, account.currency),
      };
    });
}
export type EntryRow = ReturnType<typeof entryRows>[number];

export function categoryLabel(snapshot: Snapshot, entry: Entry): string {
  if (entry.type === 'balance_checkpoint') return '';
  if (entry.category === undefined) return 'Uncategorized';
  return snapshot.categories[entry.type][entry.category]?.name ?? 'Unknown category';
}

function entryCategory(snapshot: Snapshot, entry: Entry): Category | undefined {
  if (entry.type === 'balance_checkpoint' || entry.category === undefined) return undefined;
  return snapshot.categories[entry.type][entry.category];
}

function entryLabel(entry: Entry, category?: Category): string {
  if (entry.type === 'balance_checkpoint') return entry.reason || 'Balance checkpoint';
  return entry.description || category?.name || (entry.type === 'expense' ? 'Expense' : 'Income');
}

function entryAmount(entry: Entry, currency: string): string {
  const value = entry.type === 'balance_checkpoint' ? entry.balance! : entry.amount!;
  const sign = entry.type === 'expense' ? '−' : entry.type === 'income' ? '+' : '';
  return `${sign}${formatMinor(minor(value, currency), currency)} ${currency}`;
}
