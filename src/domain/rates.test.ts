import { expect, it } from 'vitest';
import { convert, rebase } from './rates';
it('converts exact currency subtotals then rounds only once', () => {
  expect(
    convert({ USD: '0.01', EUR: '0.01' }, 'GEL', {
      reference: 'GEL',
      rates: { USD: '0.5', EUR: '0.5' },
    }),
  ).toEqual({ amount: '0.01', missing: [] });
  expect(convert({ USD: '-0.01' }, 'GEL', { reference: 'GEL', rates: { USD: '0.5' } }).amount).toBe(
    '-0.01',
  );
});
it.each([
  ['JPY', '1.5', '2'],
  ['KWD', '0.0005', '0.001'],
  ['USD', '2.675', '2.68'],
])('rounds %s half-up at its native precision', (target, rate, amount) => {
  expect(convert({ GEL: '1.00' }, target, { reference: target, rates: { GEL: rate } }).amount).toBe(
    amount,
  );
});
it('lists every missing source and target without dropping currencies', () => {
  expect(convert({ USD: '10.00', EUR: '20.00' }, 'JPY', { reference: 'GEL', rates: {} })).toEqual({
    amount: null,
    missing: ['EUR', 'JPY', 'USD'],
  });
});
it('rebases to 18 decimal places and blocks incomplete or rounded-zero proposals', () => {
  expect(rebase({ reference: 'GEL', rates: { USD: '2.7' } }, 'USD', ['GEL', 'USD'])).toEqual({
    reference: 'USD',
    rates: { GEL: '0.370370370370370370' },
  });
  expect(() => rebase({ reference: 'GEL', rates: {} }, 'USD', ['GEL', 'USD'])).toThrow('USD');
  expect(() =>
    rebase({ reference: 'GEL', rates: { USD: '100000000000000000000' } }, 'USD', ['GEL', 'USD']),
  ).toThrow('zero');
});
