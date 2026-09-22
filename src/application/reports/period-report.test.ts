import { expect, it } from 'vitest';
import { buildSnapshot } from '../indexing/read-model';
import { newDocument } from '../../domain/workspace-document';
import { periodReport, type ReportQuery } from './period-report';
const query: ReportQuery = {
  period: '2024-02',
  range: 'month',
  accounts: null,
  flow: 'expense',
  currency: 'GEL',
  converted: false,
};
function snapshot() {
  const id = (last: number) => `019949d2-89e7-7f12-8d44-0dc85e41434${last}`;
  return buildSnapshot(
    new Map([
      [
        'Money/ACCOUNTS.md',
        newDocument({
          type: 'accounts',
          accounts: {
            gel: { name: 'GEL cash', currency: 'GEL' },
            usd: { name: 'USD cash', currency: 'USD' },
          },
        }),
      ],
      [
        'Money/CATEGORIES.md',
        newDocument({
          type: 'categories',
          categories: { expense: { food: { name: 'Food' } }, income: {} },
        }),
      ],
      [
        'Money/RATES.md',
        newDocument({ type: 'rates', reference_currency: 'GEL', rates: { USD: '2.7' } }),
      ],
      [
        'Money/Ledger/2024/02.md',
        newDocument({
          type: 'ledger_month',
          period: '2024-02',
          entries: [
            {
              id: id(1),
              type: 'balance_checkpoint',
              account: 'gel',
              date: '2024-02-01',
              balance: '100.00',
            },
            {
              id: id(2),
              type: 'expense',
              account: 'gel',
              date: '2024-02-29',
              amount: '10.00',
              category: 'food',
            },
            { id: id(3), type: 'expense', account: 'usd', date: '2024-02-29', amount: '5.00' },
            { id: id(4), type: 'income', account: 'gel', date: '2024-02-02', amount: '50.00' },
            {
              id: id(5),
              type: 'expense',
              account: 'gel',
              date: '2024-02-03',
              amount: '2.00',
              category: 'unknown',
            },
          ],
        }),
      ],
    ]),
    'Money',
    '2026-09-13',
  );
}
it('shows native flows per currency and never counts checkpoints in the category chart', () => {
  const result = periodReport(snapshot(), query);
  expect(result.native).toEqual({
    GEL: { spent: '12.00', received: '50.00' },
    USD: { spent: '5.00', received: '0.00' },
  });
  expect(result.total).toBe('12.00');
  expect(result.groups.map((group) => group.label)).toEqual(['Food', 'Unknown category']);
  expect(result.entries).toHaveLength(5);
  expect(result.incomplete).toBe(false);
});
it('values all selected currencies using current manual rates, retaining native summaries', () => {
  const data = snapshot();
  const before = periodReport(data, { ...query, converted: true });
  expect(before.total).toBe('25.50');
  expect(before.groups.map((group) => group.label)).toContain('Uncategorized');
  data.rates!.rates.USD = '3';
  const after = periodReport(data, { ...query, converted: true });
  expect(after.total).toBe('27.00');
  expect(after.native).toEqual(before.native);
});
it(
  'includes twelve year months and zeros, limits accounts, and respects leap-day ' + 'boundaries',
  () => {
    const data = snapshot();
    const year = periodReport(data, { ...query, range: 'year', accounts: ['gel'] });
    expect(year.months).toHaveLength(12);
    expect(year.months[1]).toMatchObject({ period: '2024-02', amount: '12.00' });
    expect(year.months[2]?.amount).toBe('0.00');
    expect(year.native.USD).toBeUndefined();
    expect(periodReport(data, { ...query, period: '2024-03' }).total).toBe('0.00');
  },
);
it(
  'lists missing rates without suppressing native data and marks corrupt periods ' + 'incomplete',
  () => {
    const data = snapshot();
    data.rates!.rates = {};
    data.diagnostics.push({
      path: 'Money/Ledger/2024/02.md',
      field: 'amount',
      message: 'Invalid',
      monetary: true,
    });
    const result = periodReport(data, { ...query, currency: 'JPY', converted: true });
    expect(result.total).toBeNull();
    expect(result.missing).toEqual(['JPY', 'USD']);
    expect(result.native.GEL?.spent).toBe('12.00');
    expect(result.incomplete).toBe(true);
    expect(periodReport(data, { ...query, period: '2024-03' }).incomplete).toBe(false);
  },
);
