import { expect, it } from 'vitest';
import { emptySnapshot } from './read-model';
import { entryRows } from './entry-rows';

const baseEntry = {
  id: '019949d2-89e7-7f12-8d44-0dc85e414342',
  type: 'expense' as const,
  account: 'cash',
  date: '2026-09-13',
  amount: '12.00',
};

it('uses a valid category name before the entry type when description is empty', () => {
  const snapshot = {
    ...emptySnapshot(),
    phase: 'ready' as const,
    accounts: { cash: { name: 'Cash', currency: 'GEL' } },
    categories: { expense: { food: { name: 'Food' } }, income: {} },
  };

  const categorized = entryRows(snapshot, [
    { entry: { ...baseEntry, category: 'food' }, path: 'Money/Ledger/2026/09.md', position: 0 },
  ])[0]!;
  const uncategorized = entryRows(snapshot, [
    { entry: baseEntry, path: 'Money/Ledger/2026/09.md', position: 0 },
  ])[0]!;

  expect(categorized.label).toBe('Food');
  expect(categorized.category).toBe('Food');
  expect(uncategorized.label).toBe('Expense');
  expect(uncategorized.category).toBe('Uncategorized');
});
