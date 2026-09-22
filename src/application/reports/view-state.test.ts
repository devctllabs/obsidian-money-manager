import { expect, it } from 'vitest';
import { normalizeViewState, shiftPeriod } from './view-state';
it('normalizes untrusted restored state and chooses a visible native currency', () => {
  const accounts = { cash: { name: 'Cash', currency: 'GEL' } };
  const state = normalizeViewState(
    {
      period: '2026-99',
      range: 'year',
      accounts: ['cash', 'deleted', 'cash'],
      currency: 'USD',
      flow: 'wrong',
    },
    '2026-09-13',
    accounts,
  );
  expect(state).toMatchObject({
    period: '2026-09',
    range: 'year',
    accounts: ['cash'],
    currency: 'GEL',
    flow: 'expense',
  });
  expect(
    normalizeViewState({ converted: true, currency: 'USD' }, '2026-09-13', accounts).currency,
  ).toBe('USD');
  expect(shiftPeriod('2026-01', -1)).toBe('2025-12');
  expect(shiftPeriod('2024-02', 12)).toBe('2025-02');
});
it('retains restored account selection while the index is still loading', () => {
  const pending = normalizeViewState(
    { accounts: ['cash'], currency: 'GEL' },
    '2026-09-13',
    {},
    false,
  );
  expect(pending.accounts).toEqual(['cash']);
  expect(pending.currency).toBe('GEL');
  expect(
    normalizeViewState(pending, '2026-09-13', { cash: { name: 'Cash', currency: 'GEL' } }).accounts,
  ).toEqual(['cash']);
});

it('restores the embedded settings mode without persisting a settings section', () => {
  const state = normalizeViewState(
    { mode: 'settings', period: '2025-02', range: 'year' },
    '2026-09-13',
    {},
  );

  expect(state).toMatchObject({
    mode: 'settings',
    period: '2025-02',
    range: 'year',
  });
});
