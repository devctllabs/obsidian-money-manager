import { buildSnapshot } from '../../application/indexing/read-model';
import { newDocument } from '../../domain/workspace-document';
import type { Entry } from '../../domain/entry';
export function reportFixture(count = 40, categoryCount = 8) {
  return buildSnapshot(reportDocuments(count, categoryCount), 'Money Manager', '2026-09-13');
}
export function reportDocuments(count = 40, categoryCount = 8) {
  const names = [
    'Groceries',
    'Transport',
    'Home',
    'Dining',
    'Health',
    'Subscriptions',
    'Learning',
    'Gifts',
  ];
  const categories = Object.fromEntries(
    Array.from({ length: categoryCount }, (_, index) => [
      `category-${index}`,
      { name: names[index] ?? `Category ${index + 1}` },
    ]),
  );
  const entries: Entry[] = Array.from({ length: count }, (_, index) => ({
    id: `019949d2-89e7-7f12-8d44-${index.toString(16).padStart(12, '0')}`,
    type: index % 9 === 0 ? 'income' : 'expense',
    account: index % 5 === 0 ? 'savings' : 'everyday',
    date: `2026-09-${String((index % 12) + 1).padStart(2, '0')}`,
    amount: index % 9 === 0 ? '500.00' : `${index + 3}.25`,
    category: index % 9 === 0 ? 'salary' : `category-${index % categoryCount}`,
    description: index % 9 === 0 ? 'Monthly salary' : names[index % 8],
  }));
  return new Map([
    [
      'Money Manager/ACCOUNTS.md',
      newDocument({
        type: 'accounts',
        accounts: {
          everyday: { name: 'Everyday spending', currency: 'GEL' },
          savings: { name: 'Dollar savings', currency: 'USD' },
        },
      }),
    ],
    [
      'Money Manager/CATEGORIES.md',
      newDocument({
        type: 'categories',
        categories: { expense: categories, income: { salary: { name: 'Salary' } } },
      }),
    ],
    [
      'Money Manager/RATES.md',
      newDocument({ type: 'rates', reference_currency: 'GEL', rates: { USD: '2.7000' } }),
    ],
    [
      'Money Manager/Ledger/2026/09.md',
      newDocument({ type: 'ledger_month', period: '2026-09', entries }),
    ],
  ]);
}
