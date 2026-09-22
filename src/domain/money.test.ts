import { expect, it } from 'vitest';
import { minor, formatMinor } from './money';
it.each([
  ['JPY', '123', '123'],
  ['USD', '1.2', '1.20'],
  ['KWD', '-1.234', '-1.234'],
  ['USD', '99999999999999999999.99', '99999999999999999999.99'],
])('round trips exact %s minor units', (currency, input, output) => {
  expect(formatMinor(minor(input, currency), currency)).toBe(output);
});
it.each([
  ['JPY', '1.1'],
  ['USD', '0.001'],
  ['KWD', '1.0001'],
  ['USD', '1e3'],
  ['USD', 'NaN'],
  ['BTC', '1'],
])('rejects invalid %s amount %s', (currency, amount) => {
  expect(() => minor(amount, currency)).toThrow();
});
it('sums decimal values without float drift', () => {
  expect(formatMinor(minor('0.1', 'USD') + minor('0.2', 'USD'), 'USD')).toBe('0.30');
});
