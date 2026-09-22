import { describe, expect, it } from 'vitest';
import { MemoryDocuments } from '../../test/memory-documents';
import { WorkspaceWorkflow } from '../workspace/workspace';
import { MoneyIndex } from '../indexing/money-index';
import { newDocument, decodeDocument } from '../../domain/workspace-document';
import { EntryWorkflow } from './entry-workflow';
const original = {
  id: '019949d2-89e7-7f12-8d44-0dc85e414342',
  type: 'balance_checkpoint' as const,
  date: '2026-09-01',
  account: 'cash',
  balance: '100.00',
  custom: 'preserve me',
};
async function fixture() {
  const documents = new MemoryDocuments();
  await new WorkspaceWorkflow(documents).setup('Money', 'GEL');
  documents.files.set(
    'Money/ACCOUNTS.md',
    newDocument({
      type: 'accounts',
      accounts: {
        cash: { name: 'Cash', currency: 'GEL' },
        other: { name: 'Other', currency: 'USD' },
      },
    }),
  );
  const path = 'Money/Ledger/2026/09.md';
  documents.files.set(
    path,
    newDocument({ type: 'ledger_month', period: '2026-09', entries: [original] }) +
      '\n# Personal body\n[[Link]] ^block\n',
  );
  const index = new MoneyIndex(documents, 'Money', () => '2026-09-13');
  await index.refresh();
  const workflow = new EntryWorkflow(documents, index);
  return { documents, index, workflow, row: index.getSnapshot().entries[0]!, path };
}
describe('checkpoint mutations', () => {
  it('edits the amount and preserves extensions and the exact body', async () => {
    const { documents, index, workflow, row, path } = await fixture();
    await workflow.edit(row, { ...original, balance: '-10.50' });
    expect(index.getSnapshot().balances.cash).toBe('-10.50');
    expect(documents.files.get(path)).toContain('custom: preserve me');
    expect(documents.files.get(path)).toContain('\n# Personal body\n[[Link]] ^block\n');
  });
  it('preserves an empty month after deletion', async () => {
    const { documents, index, workflow, row, path } = await fixture();
    await workflow.delete(row);
    expect(decodeDocument(documents.files.get(path)!).managed.entries).toEqual([]);
    expect(index.getSnapshot().balances.cash).toBe('0.00');
    expect(documents.files.get(path)).toContain('# Personal body');
  });
  it('rejects stale edits and cross-currency reassignment', async () => {
    const { workflow, row } = await fixture();
    await expect(workflow.edit(row, { ...original, account: 'other' })).rejects.toThrow('Currency');
    await workflow.edit(row, { ...original, balance: '50.00' });
    await expect(workflow.delete(row)).rejects.toThrow('changed');
  });
  it('copies before removing source and preserves the UUID', async () => {
    const { documents, index, workflow, row } = await fixture();
    await workflow.edit(row, { ...original, date: '2026-08-31' });
    expect(index.getSnapshot().entries[0]?.entry.id).toBe(original.id);
    expect(index.getSnapshot().entries[0]?.path).toBe('Money/Ledger/2026/08.md');
    expect(documents.files.get('Money/Ledger/2026/09.md')).toContain('entries: []');
  });
  it('leaves source unchanged on destination failure', async () => {
    const { documents, workflow, row, path } = await fixture();
    const source = documents.files.get(path);
    documents.failPath = 'Money/Ledger/2026/08.md';
    await expect(workflow.edit(row, { ...original, date: '2026-08-31' })).rejects.toThrow();
    expect(documents.files.get(path)).toBe(source);
  });
  it('reports both copies after source removal failure and excludes their money', async () => {
    const { documents, index, workflow, row, path } = await fixture();
    documents.failPath = path;
    await expect(workflow.edit(row, { ...original, date: '2026-08-31' })).rejects.toThrow(
      'Both copies',
    );
    expect(index.getSnapshot().entries).toHaveLength(0);
    expect(index.getSnapshot().diagnostics).toHaveLength(2);
  });
});
