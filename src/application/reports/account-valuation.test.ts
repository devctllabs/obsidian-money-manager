import { expect, it } from 'vitest';
import { emptySnapshot } from '../indexing/read-model';
import { accountValuation } from './account-valuation';
it(
  'values selected balances once from native currency subtotals and retains every native ' +
    'balance',
  () => {
    const snapshot = {
      ...emptySnapshot(),
      accounts: {
        a: { name: 'A', currency: 'USD' },
        b: { name: 'B', currency: 'USD' },
        c: { name: 'C', currency: 'EUR' },
      },
      balances: { a: '0.01', b: '0.01', c: '100.00' },
      rates: { reference: 'GEL', rates: { USD: '0.5' } },
    };
    expect(accountValuation(snapshot, ['a', 'b'], 'GEL')).toEqual({
      total: '0.01',
      missing: [],
      accounts: { a: '0.01', b: '0.01' },
    });
    expect(accountValuation(snapshot, ['a', 'c'], 'GEL').missing).toEqual(['EUR']);
    expect(snapshot.balances.c).toBe('100.00');
  },
);
