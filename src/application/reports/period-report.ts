import type { Snapshot } from '../indexing/read-model';
import type { Flow, LocatedEntry } from '../../domain/entry';
import { precision } from '../../domain/money';
import { fixed } from '../../domain/rational';
import { missingRates } from '../../domain/rates';
import { categoryLabel } from '../indexing/entry-rows';
import { categoryColor, flowValue, largest, nativeSubtotals, percentage } from './aggregates';
export interface ReportQuery {
  period: string;
  range: 'month' | 'year';
  accounts: string[] | null;
  flow: Flow;
  currency: string;
  converted: boolean;
}
export interface Report {
  native: Record<string, { spent: string; received: string }>;
  entries: LocatedEntry[];
  groups: Array<{ key: string; label: string; amount: string; share: number; color: string }>;
  months: Array<{ period: string; amount: string; share: number }>;
  total: string | null;
  missing: string[];
  incomplete: boolean;
}
export function periodReport(snapshot: Snapshot, query: ReportQuery): Report {
  const accounts = query.accounts ?? Object.keys(snapshot.accounts);
  const currencies = [
    ...new Set(
      accounts.flatMap((key) => (snapshot.accounts[key] ? [snapshot.accounts[key].currency] : [])),
    ),
  ];
  const prefix = query.range === 'year' ? query.period.slice(0, 4) : query.period;
  const entries = snapshot.entries.filter(
    (row) => accounts.includes(row.entry.account) && row.entry.date.startsWith(prefix),
  );
  const missing = requiredRates(snapshot, query, currencies);
  const result: Report = {
    native: nativeSubtotals(snapshot, entries, currencies),
    entries,
    groups: [],
    months: [],
    total: null,
    missing,
    incomplete: isIncomplete(snapshot, prefix),
  };
  if (missing.length) return result;
  result.total = fixed(flowValue(snapshot, entries, query), precision(query.currency));
  result.groups = categoryGroups(snapshot, entries, query);
  if (query.range === 'year') result.months = monthlyValues(snapshot, entries, query);
  return result;
}
function requiredRates(snapshot: Snapshot, query: ReportQuery, currencies: string[]) {
  if (!query.converted) return [];
  if (!snapshot.rates) return [...new Set([...currencies, query.currency])].sort();
  return missingRates(currencies, query.currency, snapshot.rates);
}
function isIncomplete(snapshot: Snapshot, prefix: string): boolean {
  return snapshot.diagnostics.some((item) => {
    if (!item.monetary) return false;
    const match = /\/Ledger\/(\d{4})\/(\d{2})\.md$/u.exec(item.path);
    if (!match) return true;
    return `${match[1]}-${match[2]}`.startsWith(prefix);
  });
}
function categoryGroups(
  snapshot: Snapshot,
  entries: LocatedEntry[],
  query: ReportQuery,
): Report['groups'] {
  const groups = new Map<string, LocatedEntry[]>();
  for (const row of entries) {
    if (row.entry.type !== query.flow) continue;
    if (!query.converted && snapshot.accounts[row.entry.account]!.currency !== query.currency)
      continue;
    const key = row.entry.category ?? '__uncategorized';
    const identity =
      row.entry.category && !snapshot.categories[query.flow][row.entry.category]
        ? '__unknown'
        : key;
    groups.set(identity, [...(groups.get(identity) ?? []), row]);
  }
  const total = flowValue(snapshot, entries, query);
  return [...groups]
    .map(([key, rows]) => {
      const value = flowValue(snapshot, rows, query);
      return {
        key,
        label: categoryLabel(snapshot, rows[0]!.entry),
        amount: fixed(value, precision(query.currency)),
        share: percentage(value, total),
        color: categoryColor(key, snapshot.categories[query.flow][key]?.color),
      };
    })
    .sort((a, b) => b.share - a.share || a.label.localeCompare(b.label));
}
function monthlyValues(
  snapshot: Snapshot,
  entries: LocatedEntry[],
  query: ReportQuery,
): Report['months'] {
  const values = Array.from({ length: 12 }, (_, position) => {
    const period = `${query.period.slice(0, 4)}-${String(position + 1).padStart(2, '0')}`;
    return {
      period,
      value: flowValue(
        snapshot,
        entries.filter((row) => row.entry.date.startsWith(period)),
        query,
      ),
    };
  });
  const max = largest(values.map((item) => item.value));
  return values.map(({ period, value }) => ({
    period,
    amount: fixed(value, precision(query.currency)),
    share: percentage(value, max),
  }));
}
