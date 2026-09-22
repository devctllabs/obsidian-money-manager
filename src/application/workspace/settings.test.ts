import { expect, it } from 'vitest';
import { normalizeSettings, SettingsWorkflow } from './settings';
it('normalizes untrusted configuration without retaining financial or transient data', () => {
  const result = normalizeSettings({
    schemaVersion: 1,
    workspaceRoot: ' Finance/Personal/ ',
    appearance: { accentMode: 'custom', customAccent: '#123456' },
    accounts: ['secret'],
  });
  expect(result).toEqual({
    schemaVersion: 1,
    workspaceRoot: 'Finance/Personal',
    appearance: { accentMode: 'custom', customAccent: '#123456' },
  });
  expect(normalizeSettings(result)).toEqual(result);
  expect(
    normalizeSettings({
      workspaceRoot: '../unsafe',
      appearance: { accentMode: 'custom', customAccent: 'red' },
    }),
  ).toEqual(normalizeSettings(null));
});
it('keeps active configuration on save failure', async () => {
  const current = normalizeSettings(null);
  const settings = new SettingsWorkflow(current, () => Promise.reject(new Error('Disk full')));
  await expect(settings.update({ ...current, workspaceRoot: 'Other' })).rejects.toThrow(
    'Disk full',
  );
  expect(settings.current).toEqual(current);
});
