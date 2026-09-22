import { expect, it, vi } from 'vitest';
import { TFile, TFolder, type Vault } from 'obsidian';
import { VaultDocuments } from './documents';
it('uses Vault.process on the current file instead of writing a stale read', async () => {
  const file = Object.assign(new TFile(), { path: 'Money/ACCOUNTS.md' });
  let content = 'latest content';
  const process = vi.fn(async (_file: TFile, update: (text: string) => string) => {
    content = update(content);
    return content;
  });
  const documents = new VaultDocuments({
    getAbstractFileByPath: () => file,
    process,
  } as unknown as Vault);
  await documents.process('Money/ACCOUNTS.md', (value) => `${value}\nupdated`);
  expect(content).toBe('latest content\nupdated');
  expect(process).toHaveBeenCalledWith(file, expect.any(Function));
});
it('walks only the requested Ledger subtree and creates missing parent folders', async () => {
  const file = Object.assign(new TFile(), { path: 'Money/Ledger/2026/09.md' });
  const folder = Object.assign(new TFolder(), { path: 'Money/Ledger', children: [file] });
  const paths = new Map<string, TFile | TFolder>([['Money/Ledger', folder]]);
  const createFolder = vi.fn(async (path: string) => {
    const result = Object.assign(new TFolder(), { path });
    paths.set(path, result);
    return result;
  });
  const create = vi.fn(async () => file);
  const source = new VaultDocuments({
    getAbstractFileByPath: (path: string) => paths.get(path) ?? null,
    createFolder,
    create,
  } as unknown as Vault);
  expect(await source.list('Money/Ledger')).toEqual([file.path]);
  await source.create('Other/Ledger/2026/09.md', 'new content');
  expect(createFolder.mock.calls.map((call) => call[0])).toEqual([
    'Other',
    'Other/Ledger',
    'Other/Ledger/2026',
  ]);
  expect(create).toHaveBeenCalledWith('Other/Ledger/2026/09.md', 'new content');
});
