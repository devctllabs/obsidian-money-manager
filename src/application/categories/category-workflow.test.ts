import { expect, it } from 'vitest';
import { MemoryDocuments } from '../../test/memory-documents';
import { WorkspaceWorkflow } from '../workspace/workspace';
import { MoneyIndex } from '../indexing/money-index';
import { CategoryWorkflow } from './category-workflow';
import { newDocument } from '../../domain/workspace-document';
async function fixture() {
  const documents = new MemoryDocuments();
  await new WorkspaceWorkflow(documents).setup('Money', 'USD');
  const index = new MoneyIndex(documents, 'Money', () => '2026-09-13');
  return { documents, index, workflow: new CategoryWorkflow(documents, index) };
}
it('keeps typed namespaces, preserves extensions and blocks stale changes', async () => {
  const { documents, index, workflow } = await fixture();
  await workflow.create('expense', 'food', { name: 'Food', custom: 'notes' });
  await workflow.create('income', 'food', { name: 'Food refund' });
  const expected = index.getSnapshot().categories.expense.food!;
  await workflow.edit('expense', {
    key: 'food',
    expected,
    nextKey: 'food',
    category: { name: 'Groceries', color: '#123456' },
  });
  expect(documents.files.get('Money/CATEGORIES.md')).toContain('custom: notes');
  expect(index.getSnapshot().categories.income.food?.name).toBe('Food refund');
  await expect(workflow.delete('expense', 'food', expected)).rejects.toThrow('changed');
  await workflow.delete('expense', 'food', index.getSnapshot().categories.expense.food!);
  expect(index.getSnapshot().categories.expense.food).toBeUndefined();
});
it(
  'blocks destructive changes if corrupted ledger cannot prove absence of ' + 'references',
  async () => {
    const { documents, index, workflow } = await fixture();
    await workflow.create('expense', 'food', { name: 'Food' });
    documents.files.set(
      'Money/Ledger/2026/09.md',
      newDocument({ type: 'ledger_month', period: '2026-09', entries: [null] }),
    );
    await expect(
      workflow.delete('expense', 'food', index.getSnapshot().categories.expense.food!),
    ).rejects.toThrow('2026/09.md');
  },
);
