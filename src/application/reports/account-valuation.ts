import type { Snapshot } from '../indexing/read-model';
import { formatMinor, minor } from '../../domain/money';
import { convert } from '../../domain/rates';
export function accountValuation(
  snapshot: Snapshot,
  keys: string[],
  target: string,
): { total: string | null; missing: string[]; accounts: Record<string, string> } {
  const totals: Record<string, bigint> = {};
  const selected = keys.filter((key) => snapshot.accounts[key] !== undefined);
  for (const key of selected) {
    const currency = snapshot.accounts[key]!.currency;
    totals[currency] = (totals[currency] ?? 0n) + minor(snapshot.balances[key]!, currency);
  }
  if (!snapshot.rates)
    return {
      total: null,
      missing: [...new Set([...Object.keys(totals), target])].sort(),
      accounts: {},
    };
  const result = convert(
    Object.fromEntries(
      Object.entries(totals).map(([currency, value]) => [currency, formatMinor(value, currency)]),
    ),
    target,
    snapshot.rates,
  );
  if (result.amount === null) return { total: null, missing: result.missing, accounts: {} };
  const accounts = Object.fromEntries(
    selected.map((key) => [
      key,
      convert(
        { [snapshot.accounts[key]!.currency]: snapshot.balances[key]! },
        target,
        snapshot.rates!,
      ).amount!,
    ]),
  );
  return { total: result.amount, missing: [], accounts };
}
