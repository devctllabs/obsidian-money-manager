import { describe, expect, it } from 'vitest';
import { MemoryDocuments } from '../../test/memory-documents';
import { WorkspaceWorkflow } from '../workspace/workspace';
import { MoneyIndex } from '../indexing/money-index';
import { AccountWorkflow } from './account-workflow';

async function fixture() {
  const documents = new MemoryDocuments();
  await new WorkspaceWorkflow(documents).setup('Money', 'GEL');
  const index = new MoneyIndex(documents, 'Money', () => '2026-09-13');
  const workflow = new AccountWorkflow(documents, index, {
    root: 'Money',
    today: () => '2026-09-13',
    id: () => '019949d2-89e7-7f12-8d44-0dc85e414342',
  });
  return { documents, index, workflow };
}
describe('account creation', () => {
  it('saves an account and observed checkpoint, then rebuilds its native balance', async () => {
    const { documents, index, workflow } = await fixture();
    await workflow.create({
      key: 'everyday',
      name: 'Everyday',
      currency: 'GEL',
      observed: '100.00',
    });
    expect(index.getSnapshot().accounts.everyday?.name).toBe('Everyday');
    expect(index.getSnapshot().balances.everyday).toBe('100.00');
    expect(documents.files.get('Money/Ledger/2026/09.md')).toContain('balance_checkpoint');
    const reload = new MoneyIndex(documents, 'Money', () => '2026-09-13');
    await reload.refresh();
    expect(reload.getSnapshot().balances.everyday).toBe('100.00');
  });
  it('creates no checkpoint for zero', async () => {
    const { documents, index, workflow } = await fixture();
    await workflow.create({ key: 'empty', name: 'Empty', currency: 'JPY', observed: '0' });
    expect(documents.files.size).toBe(3);
    expect(index.getSnapshot().balances.empty).toBe('0');
  });
  it('keeps the account when the checkpoint write fails', async () => {
    const { documents, index, workflow } = await fixture();
    documents.failPath = 'Money/Ledger/2026/09.md';
    const result = await workflow.create({
      key: 'everyday',
      name: 'Everyday',
      currency: 'GEL',
      observed: '100.00',
    });
    expect(result.checkpointSaved).toBe(false);
    expect(index.getSnapshot().accounts.everyday).toBeDefined();
    expect(index.getSnapshot().balances.everyday).toBe('0.00');
  });
});

it('blocks referenced account deletion and permits a display rename', async () => {
  const { index, workflow } = await fixture();
  await workflow.create({ key: 'cash', name: 'Cash', currency: 'GEL', observed: '100.00' });
  const account = index.getSnapshot().accounts.cash!;
  await expect(workflow.delete('cash', account)).rejects.toThrow('2026/09.md');
  await expect(
    workflow.edit('cash', account, { key: 'cash', name: 'Cash', currency: 'USD' }),
  ).rejects.toThrow('2026/09.md');
  await workflow.edit('cash', account, { key: 'cash', name: 'Pocket', currency: 'GEL' });
  expect(index.getSnapshot().accounts.cash?.name).toBe('Pocket');
});
it('rejects invalid account inputs before writing and retries only the checkpoint', async () => {
  const { documents, index, workflow } = await fixture();
  await expect(
    workflow.create({ key: 'Invalid KEY', name: 'Cash', currency: 'GEL', observed: '1' }),
  ).rejects.toThrow();
  expect(documents.files.size).toBe(3);
  documents.failPath = 'Money/Ledger/2026/09.md';
  await workflow.create({ key: 'cash', name: 'Cash', currency: 'GEL', observed: '100.00' });
  documents.failPath = null;
  await workflow.retryCheckpoint('cash', '100.00');
  expect(index.getSnapshot().balances.cash).toBe('100.00');
  expect(Object.keys(index.getSnapshot().accounts)).toEqual(['cash']);
});
