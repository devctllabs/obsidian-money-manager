import { expect, it } from 'vitest';
import { MemoryDocuments } from '../../test/memory-documents';
import { WorkspaceWorkflow } from '../workspace/workspace';
import { AccountWorkflow } from '../accounts/account-workflow';
import { MoneyIndex } from '../indexing/money-index';
import { EntryWorkflow } from './entry-workflow';
const entry = {
  id: '019949d2-89e7-7f12-8d44-0dc85e414342',
  type: 'expense' as const,
  account: 'cash',
  date: '2026-09-13',
  amount: '7.00',
};
async function fixture() {
  const documents = new MemoryDocuments();
  await new WorkspaceWorkflow(documents).setup('Money', 'GEL');
  const index = new MoneyIndex(documents, 'Money', () => '2026-09-13');
  await new AccountWorkflow(documents, index, {
    root: 'Money',
    today: () => '2026-09-13',
    id: () => entry.id,
  }).create({ key: 'cash', name: 'Cash', currency: 'GEL', observed: '0' });
  return { documents, index, workflow: new EntryWorkflow(documents, index) };
}
it(
  'records an expense and edits it to income without changing its native currency or ' + 'identity',
  async () => {
    const { index, workflow } = await fixture();
    await workflow.create(entry);
    expect(index.getSnapshot().balances.cash).toBe('-7.00');
    const row = index.getSnapshot().entries[0]!;
    await workflow.edit(row, { ...entry, type: 'income', amount: '20.00' });
    expect(index.getSnapshot().balances.cash).toBe('20.00');
    expect(index.getSnapshot().entries[0]?.entry.id).toBe(entry.id);
    await workflow.delete(index.getSnapshot().entries[0]!);
    expect(index.getSnapshot().balances.cash).toBe('0.00');
  },
);
it('does not convert an expense into a checkpoint or accept an unknown category', async () => {
  const { index, workflow } = await fixture();
  await expect(workflow.create({ ...entry, category: 'missing' })).rejects.toThrow('Category');
  await workflow.create(entry);
  await expect(
    workflow.edit(index.getSnapshot().entries[0]!, {
      id: entry.id,
      type: 'balance_checkpoint',
      account: 'cash',
      date: entry.date,
      balance: '20.00',
    }),
  ).rejects.toThrow('Checkpoint');
});

it('saves a quick category first and reports the exact partial outcome', async () => {
  const { documents, index, workflow } = await fixture();
  documents.failPath = 'Money/CATEGORIES.md';
  await expect(workflow.createWithCategory(entry, 'Food')).rejects.toThrow('Category not saved');
  expect(index.getSnapshot().entries).toHaveLength(0);
  documents.failPath = 'Money/Ledger/2026/09.md';
  await expect(workflow.createWithCategory(entry, 'Food')).rejects.toThrow('Category saved');
  expect(index.getSnapshot().categories.expense.food?.name).toBe('Food');
  expect(index.getSnapshot().entries).toHaveLength(0);
  documents.failPath = null;
  await workflow.createWithCategory(entry, 'Food');
  expect(index.getSnapshot().entries[0]?.entry.category).toBe('food');
  expect(Object.keys(index.getSnapshot().categories.expense)).toEqual(['food']);
});

it(
  'clears an optional category during type change without leaving a null reference in ' +
    'Markdown',
  async () => {
    const { index, workflow } = await fixture();
    await workflow.createWithCategory(entry, 'Food');
    const row = index.getSnapshot().entries[0]!;
    await workflow.edit(row, { ...entry, type: 'income', category: undefined });
    expect(index.getSnapshot().entries[0]?.entry.category).toBeUndefined();
    expect(index.getSnapshot().diagnostics).toHaveLength(0);
  },
);
