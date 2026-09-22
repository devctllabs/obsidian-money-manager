import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { MemoryDocuments } from '../../test/memory-documents';
import { WorkspaceWorkflow } from './workspace';

describe('workspace setup', () => {
  it('creates only empty canonical catalogs in the chosen root', async () => {
    const documents = new MemoryDocuments();
    await new WorkspaceWorkflow(documents).setup('Money Manager', 'GEL');
    expect([...documents.files.keys()]).toEqual([
      'Money Manager/ACCOUNTS.md',
      'Money Manager/CATEGORIES.md',
      'Money Manager/RATES.md',
    ]);
    const accountYaml = documents.files.get('Money Manager/ACCOUNTS.md')!.split('---')[1]!;
    expect(parse(accountYaml)).toEqual({
      money_manager: { schema_version: 1, type: 'accounts', accounts: {} },
    });
    expect(documents.files.get('Money Manager/RATES.md')).toContain('reference_currency: GEL');
  });
  it('preflights all catalogs before creating anything', async () => {
    const documents = new MemoryDocuments();
    documents.files.set('Money/CATEGORIES.md', '# My note');
    await expect(new WorkspaceWorkflow(documents).setup('Money', 'USD')).rejects.toThrow(
      'CATEGORIES.md',
    );
    expect([...documents.files]).toEqual([['Money/CATEGORIES.md', '# My note']]);
  });
  it('resumes compatible empty setup after a partial write', async () => {
    const documents = new MemoryDocuments();
    const workflow = new WorkspaceWorkflow(documents);
    documents.failPath = 'Money/CATEGORIES.md';
    await expect(workflow.setup('Money', 'GEL')).rejects.toThrow('CATEGORIES.md');
    const first = documents.files.get('Money/ACCOUNTS.md');
    documents.failPath = null;
    await workflow.setup('Money', 'GEL');
    expect(documents.files.size).toBe(3);
    expect(documents.files.get('Money/ACCOUNTS.md')).toBe(first);
    await expect(workflow.setup('Money', 'USD')).rejects.toThrow('RATES.md');
  });
  it.each(['', '../Money', '/Money', 'Money/../Other', '.hidden', 'Money\\Other'])(
    'rejects unsafe root %s',
    async (root) => {
      await expect(new WorkspaceWorkflow(new MemoryDocuments()).setup(root, 'USD')).rejects.toThrow(
        'root',
      );
    },
  );
});

it(
  'preserves empty catalog extensions on retry and rejects a non-fiat reference before ' +
    'writing',
  async () => {
    const documents = new MemoryDocuments();
    const workflow = new WorkspaceWorkflow(documents);
    await expect(workflow.setup('Money', 'BTC')).rejects.toThrow('currency');
    expect(documents.files.size).toBe(0);
    await workflow.setup('Money', 'GEL');
    const path = 'Money/ACCOUNTS.md';
    const text =
      documents.files
        .get(path)!
        .replace('  accounts: {}', '  accounts: {}\n  extension: preserved') +
      '\n# Personal notes\n';
    documents.files.set(path, text);
    await workflow.setup('Money', 'GEL');
    expect(documents.files.get(path)).toBe(text);
  },
);
