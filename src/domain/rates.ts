import { precision } from './money';
import { add, decimal, divide, fixed, multiply, rational, type Rational } from './rational';
export interface Rates {
  reference: string;
  rates: Record<string, string>;
}
function rateFor(table: Rates, currency: string): Rational | null {
  if (currency === table.reference) return rational(1n);
  const text = table.rates[currency];
  if (text === undefined) return null;
  try {
    const value = decimal(text);
    return value.n > 0n ? value : null;
  } catch {
    return null;
  }
}
export function missingRates(currencies: string[], target: string, table: Rates): string[] {
  return [...new Set([...currencies, target])]
    .filter((currency) => rateFor(table, currency) === null)
    .sort();
}
export function convertedValue(
  amounts: Record<string, string>,
  target: string,
  table: Rates,
): Rational {
  let value = rational(0n);
  const denominator = rateFor(table, target);
  if (!denominator) throw new Error(`Missing rate: ${target}`);
  for (const [currency, amount] of Object.entries(amounts)) {
    const numerator = rateFor(table, currency);
    if (!numerator) throw new Error(`Missing rate: ${currency}`);
    value = add(value, divide(multiply(decimal(amount), numerator), denominator));
  }
  return value;
}
export function convert(
  amounts: Record<string, string>,
  target: string,
  table: Rates,
): { amount: string | null; missing: string[] } {
  const missing = missingRates(Object.keys(amounts), target, table);
  if (missing.length) return { amount: null, missing };
  return { amount: fixed(convertedValue(amounts, target, table), precision(target)), missing };
}
export function rebase(table: Rates, reference: string, required: string[]): Rates {
  const missing = missingRates(
    [...required, table.reference, ...Object.keys(table.rates)],
    reference,
    table,
  );
  if (missing.length) throw new Error(`Missing rates: ${missing.join(', ')}`);
  const denominator = rateFor(table, reference)!;
  const rates: Record<string, string> = {};
  for (const currency of [table.reference, ...Object.keys(table.rates)]) {
    if (currency === reference) continue;
    const text = fixed(divide(rateFor(table, currency)!, denominator), 18);
    if (decimal(text).n === 0n) throw new Error(`${currency} rate would round to zero`);
    rates[currency] = text;
  }
  return { reference, rates };
}
