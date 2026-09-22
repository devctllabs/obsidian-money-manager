import { CURRENCIES } from './currencies';
export function precision(currency: string): number {
  const digits = CURRENCIES[currency];
  if (digits === undefined) throw new Error('Unknown ISO fiat currency');
  return digits;
}
export function minor(amount: string, currency: string): bigint {
  const scale = precision(currency);
  if (!/^-?\d+(?:\.\d+)?$/u.test(amount)) throw new Error('Expected a decimal amount');
  const [whole = '', fraction = ''] = amount.replace('-', '').split('.');
  if (fraction.length > scale) throw new Error(`${currency} allows ${scale} decimal places`);
  return BigInt(whole + fraction.padEnd(scale, '0')) * (amount.startsWith('-') ? -1n : 1n);
}
export function formatMinor(value: bigint, currency: string): string {
  const scale = precision(currency);
  const digits = (value < 0n ? -value : value).toString().padStart(scale + 1, '0');
  const amount = scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits;
  return `${value < 0n ? '-' : ''}${amount}`;
}
