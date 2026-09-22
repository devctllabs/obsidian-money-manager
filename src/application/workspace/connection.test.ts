import { expect, it } from 'vitest';
import { MemoryDocuments } from '../../test/memory-documents';
import { WorkspaceWorkflow } from './workspace';
import { normalizeSettings, SettingsWorkflow } from './settings';
import { WorkspaceConnection } from './connection';
import { newDocument } from '../../domain/workspace-document';
it('adopts valid catalogs only after settings save, leaving the old root untouched', async () => {
  const documents = new MemoryDocuments();
  await new WorkspaceWorkflow(documents).setup('Old', 'GEL');
  await new WorkspaceWorkflow(documents).setup('New', 'USD');
  documents.files.set(
    'New/ACCOUNTS.md',
    newDocument({ type: 'accounts', accounts: { new: { name: 'New', currency: 'USD' } } }),
  );
  let fail = true;
  const settings = new SettingsWorkflow(
    { ...normalizeSettings(null), workspaceRoot: 'Old' },
    async () => {
      if (fail) throw new Error('Save failed');
    },
  );
  const connection = new WorkspaceConnection(documents, settings, () => '2026-09-13');
  const old = documents.files.get('Old/ACCOUNTS.md');
  await expect(connection.connect('Missing')).rejects.toThrow('Missing');
  await expect(connection.connect('New')).rejects.toThrow('Save failed');
  expect(connection.index.root).toBe('Old');
  fail = false;
  await connection.connect('New');
  expect(connection.index.root).toBe('New');
  expect(connection.index.getSnapshot().accounts.new?.currency).toBe('USD');
  expect(documents.files.get('Old/ACCOUNTS.md')).toBe(old);
});
