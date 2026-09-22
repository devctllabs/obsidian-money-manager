export interface Rational {
  n: bigint;
  d: bigint;
}
function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a < 0n ? -a : a;
}
export function rational(n: bigint, d = 1n): Rational {
  if (d === 0n) throw new Error('Division by zero');
  const factor = gcd(n, d) * (d < 0n ? -1n : 1n);
  return { n: n / factor, d: d / factor };
}
export function decimal(text: string): Rational {
  if (!/^-?\d+(?:\.\d+)?$/u.test(text)) throw new Error('Expected an exact decimal string');
  const [whole = '', fraction = ''] = text.replace('-', '').split('.');
  return rational(
    BigInt(whole + fraction) * (text.startsWith('-') ? -1n : 1n),
    10n ** BigInt(fraction.length),
  );
}
export function add(a: Rational, b: Rational): Rational {
  return rational(a.n * b.d + b.n * a.d, a.d * b.d);
}
export function multiply(a: Rational, b: Rational): Rational {
  return rational(a.n * b.n, a.d * b.d);
}
export function divide(a: Rational, b: Rational): Rational {
  return rational(a.n * b.d, a.d * b.n);
}
function round(value: Rational, digits: number): bigint {
  const unsigned = (value.n < 0n ? -value.n : value.n) * 10n ** BigInt(digits);
  return (
    (unsigned / value.d + ((unsigned % value.d) * 2n >= value.d ? 1n : 0n)) *
    (value.n < 0n ? -1n : 1n)
  );
}
export function fixed(value: Rational, digits: number): string {
  const units = round(value, digits);
  const text = (units < 0n ? -units : units).toString().padStart(digits + 1, '0');
  const sign = units < 0n ? '-' : '';
  const amount = digits ? `${text.slice(0, -digits)}.${text.slice(-digits)}` : text;
  return `${sign}${amount}`;
}
