import type { LocatedEntry } from '../../domain/entry';
import { formatMinor, minor } from '../../domain/money';
import type { Snapshot } from '../indexing/read-model';
import { convertedValue } from '../../domain/rates';
import { decimal, rational, type Rational } from '../../domain/rational';
import type { ReportQuery } from './period-report';
export function nativeSubtotals(snapshot: Snapshot, entries: LocatedEntry[], currencies: string[]) {
  const totals = Object.fromEntries(
    currencies.map((currency) => [currency, { spent: 0n, received: 0n }]),
  );
  for (const { entry } of entries) {
    if (entry.type === 'balance_checkpoint') continue;
    const currency = snapshot.accounts[entry.account]!.currency;
    totals[currency]![entry.type === 'expense' ? 'spent' : 'received'] += minor(
      entry.amount!,
      currency,
    );
  }
  return Object.fromEntries(
    Object.entries(totals).map(([currency, values]) => [
      currency,
      {
        spent: formatMinor(values.spent, currency),
        received: formatMinor(values.received, currency),
      },
    ]),
  );
}
export function flowValue(
  snapshot: Snapshot,
  entries: LocatedEntry[],
  query: ReportQuery,
): Rational {
  const sums: Record<string, bigint> = {};
  for (const { entry } of entries) {
    if (entry.type !== query.flow) continue;
    const currency = snapshot.accounts[entry.account]!.currency;
    sums[currency] = (sums[currency] ?? 0n) + minor(entry.amount!, currency);
  }
  const amounts = Object.fromEntries(
    Object.entries(sums).map(([currency, value]) => [currency, formatMinor(value, currency)]),
  );
  if (!query.converted) return decimal(amounts[query.currency] ?? '0');
  return convertedValue(amounts, query.currency, snapshot.rates!);
}
export function percentage(value: Rational, total: Rational): number {
  if (total.n === 0n) return 0;
  return Number((value.n * total.d * 1000000n) / (value.d * total.n)) / 10000;
}
export function largest(values: Rational[]): Rational {
  return values.reduce(
    (max, value) => (value.n * max.d > max.n * value.d ? value : max),
    rational(0n),
  );
}
export function categoryColor(key: string, configured?: string): string {
  if (configured) return configured;
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `hsl(${(hash * 137) % 360} 45% 48%)`;
}
