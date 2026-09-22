import { expect, it } from 'vitest';
import { MemoryDocuments } from '../../test/memory-documents';
import { WorkspaceWorkflow } from '../workspace/workspace';
import { MoneyIndex } from '../indexing/money-index';
import { RateWorkflow } from './rate-workflow';
import { decodeDocument } from '../../domain/workspace-document';
it(
  'saves a whole table atomically with exact authored precision and rejects stale or ' +
    'invalid changes',
  async () => {
    const documents = new MemoryDocuments();
    await new WorkspaceWorkflow(documents).setup('Money', 'GEL');
    const index = new MoneyIndex(documents, 'Money', () => '2026-09-13');
    const workflow = new RateWorkflow(documents, index);
    const expected = { reference: 'GEL', rates: {} };
    const next = { reference: 'GEL', rates: { USD: '2.700000000000000000001' } };
    await workflow.save(expected, next);
    expect(index.getSnapshot().rates).toEqual(next);
    expect(decodeDocument(documents.files.get('Money/RATES.md')!).managed.rates).toEqual(
      next.rates,
    );
    await expect(
      workflow.save(expected, { reference: 'USD', rates: { GEL: '1' } }),
    ).rejects.toThrow('changed');
    await expect(workflow.save(next, { reference: 'GEL', rates: { GEL: '1' } })).rejects.toThrow(
      'implicit',
    );
    documents.failPath = 'Money/RATES.md';
    await expect(
      workflow.save(next, { reference: 'USD', rates: { GEL: '0.370370370370370370' } }),
    ).rejects.toThrow('Write failed');
    expect(index.getSnapshot().rates).toEqual(next);
  },
);
