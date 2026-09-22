import { describe, expect, it } from 'vitest';
import { MemoryDocuments } from '../../test/memory-documents';
import { newDocument } from '../../domain/workspace-document';
import { WorkspaceWorkflow } from '../workspace/workspace';
import { MoneyIndex } from './money-index';
const id = '019949d2-89e7-7f12-8d44-0dc85e414342';
async function fixture(entries: unknown[]) {
  const documents = new MemoryDocuments();
  await new WorkspaceWorkflow(documents).setup('Money', 'GEL');
  documents.files.set(
    'Money/ACCOUNTS.md',
    newDocument({ type: 'accounts', accounts: { cash: { name: 'Cash', currency: 'GEL' } } }),
  );
  documents.files.set(
    'Money/Ledger/2026/09.md',
    newDocument({ type: 'ledger_month', period: '2026-09', entries }),
  );
  const index = new MoneyIndex(documents, 'Money', () => '2026-09-13');
  return { documents, index };
}
const checkpoint = {
  id,
  type: 'balance_checkpoint',
  account: 'cash',
  date: '2026-09-02',
  balance: '100.00',
};
const expense = {
  id: id.replace('4342', '4343'),
  type: 'expense',
  account: 'cash',
  date: '2026-09-03',
  amount: '7.00',
};
describe('Markdown index', () => {
  it('replays stored same-day order and ignores pre-checkpoint expenses for balance', async () => {
    const { index } = await fixture([
      checkpoint,
      expense,
      { ...expense, id: id.replace('4342', '4344'), date: '2026-09-01', amount: '30.00' },
    ]);
    await index.refresh();
    expect(index.getSnapshot().balances.cash).toBe('93.00');
    expect(index.getSnapshot().entries).toHaveLength(3);
  });
  it('keeps valid siblings, excludes malformed amounts and reports the record', async () => {
    const { index } = await fixture([checkpoint, { ...expense, amount: '0' }]);
    await index.refresh();
    expect(index.getSnapshot().entries).toHaveLength(1);
    expect(index.getSnapshot().diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ record: expense.id, field: 'amount' })]),
    );
  });
  it('excludes every duplicate UUID across months and identifies both paths', async () => {
    const { documents, index } = await fixture([checkpoint]);
    documents.files.set(
      'Money/Ledger/2026/08.md',
      newDocument({
        type: 'ledger_month',
        period: '2026-08',
        entries: [{ ...checkpoint, date: '2026-08-02' }],
      }),
    );
    await index.refresh();
    expect(index.getSnapshot().entries).toHaveLength(0);
    expect(
      index
        .getSnapshot()
        .diagnostics.map((item) => item.path)
        .sort(),
    ).toEqual(['Money/Ledger/2026/08.md', 'Money/Ledger/2026/09.md']);
  });
  it('keeps money with unknown categories and excludes unknown accounts', async () => {
    const { index } = await fixture([
      { ...expense, category: 'missing' },
      { ...checkpoint, account: 'missing' },
    ]);
    await index.refresh();
    expect(index.getSnapshot().balances.cash).toBe('-7.00');
    expect(index.getSnapshot().entries).toHaveLength(1);
    expect(index.getSnapshot().diagnostics).toHaveLength(2);
  });
  it.each([
    { ...expense, date: '2026-09-31' },
    { ...expense, date: '2026-09-14' },
    { ...expense, date: '2026-08-01' },
    { ...expense, amount: '1.001' },
    { ...expense, amount: 1 },
    { ...expense, id: 'bad' },
  ])('diagnoses an invalid entry without crashing: %j', async (entry) => {
    const { index } = await fixture([entry]);
    await index.refresh();
    expect(index.getSnapshot().entries).toHaveLength(0);
    expect(index.getSnapshot().diagnostics).toHaveLength(1);
  });
  it('makes unreadable YAML incomplete and recovers after a direct edit', async () => {
    const { documents, index } = await fixture([checkpoint]);
    const path = 'Money/Ledger/2026/09.md';
    const original = documents.files.get(path)!;
    await index.refresh();
    documents.files.set(path, '---\nmoney_manager: [\n---\n');
    await index.refresh();
    expect(index.getSnapshot().entries).toHaveLength(0);
    expect(index.getSnapshot().diagnostics[0]?.path).toBe(path);
    documents.files.set(path, original);
    await index.refresh();
    expect(index.getSnapshot().balances.cash).toBe('100.00');
    expect(index.getSnapshot().diagnostics).toHaveLength(0);
  });
});

it(
  'notifies subscribers, reads only changed paths, and stops publishing after ' + 'disposal',
  async () => {
    const { documents, index } = await fixture([checkpoint]);
    let notifications = 0;
    const unsubscribe = index.subscribe(() => {
      notifications++;
    });
    await index.refresh();
    expect(notifications).toBe(1);
    const originalRead = documents.read.bind(documents);
    const reads: string[] = [];
    documents.read = async (path) => {
      reads.push(path);
      return originalRead(path);
    };
    documents.files.set(
      'Money/Ledger/2026/09.md',
      newDocument({ type: 'ledger_month', period: '2026-09', entries: [checkpoint, expense] }),
    );
    await index.refreshPaths(['Money/Ledger/2026/09.md']);
    expect(reads).toEqual(['Money/Ledger/2026/09.md']);
    expect(index.getSnapshot().balances.cash).toBe('93.00');
    unsubscribe();
    await index.refresh();
    expect(notifications).toBe(2);
    index.dispose();
    const snapshot = index.getSnapshot();
    await index.refresh();
    expect(index.getSnapshot()).toBe(snapshot);
  },
);

it('refreshes folder changes without treating a folder as a document', async () => {
  const { index } = await fixture([checkpoint]);
  await index.refresh();
  await index.refreshPaths(['Money/Ledger/2026']);
  expect(index.getSnapshot().diagnostics).toHaveLength(0);
  expect(index.getSnapshot().balances.cash).toBe('100.00');
});

it('excludes a valid UUID when a malformed sibling has the same identity', async () => {
  const { index } = await fixture([checkpoint, { ...checkpoint, balance: 'broken' }]);
  await index.refresh();
  expect(index.getSnapshot().entries).toHaveLength(0);
  expect(index.getSnapshot().diagnostics.some((item) => item.field === 'id')).toBe(true);
});
it('keeps a failed document read from preventing valid sibling balances', async () => {
  const { documents, index } = await fixture([checkpoint]);
  const original = documents.read.bind(documents);
  documents.read = async (path) => {
    if (path.endsWith('RATES.md')) throw new Error('Read failed');
    return original(path);
  };
  await index.refresh();
  expect(index.getSnapshot().balances.cash).toBe('100.00');
  expect(index.getSnapshot().diagnostics.some((item) => item.path.endsWith('RATES.md'))).toBe(true);
});

it('publishes immutable snapshots so a consumer cannot change the ledger authority', async () => {
  const { index } = await fixture([checkpoint]);
  await index.refresh();
  expect(() => {
    index.getSnapshot().accounts.cash!.currency = 'USD';
  }).toThrow();
  expect(index.getSnapshot().accounts.cash!.currency).toBe('GEL');
});
