import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { decodeDocument, newDocument } from '../domain/workspace-document';
import { runCli } from './cli';

vi.mock('node:fs/promises', { spy: true });

const checkpointId = '019949d2-89e7-7f12-8d44-0dc85e414342';
const expenseId = '019949d2-89e7-7f12-8d44-0dc85e414343';
const header = 'version: 1\naccount: cash\nentries:\n';
const row = '  - type: expense\n    date: "2026-09-02T12:00"\n    amount: "12.30"\n';
const earlier = row.replace('09-02T12:00', '08-31');
let root: string;
let source: string;
let september: string;

beforeEach(async () => {
  root = await fs.mkdtemp(join(tmpdir(), 'money-manager-import-'));
  source = join(root, 'batch.yaml');
  september = join(root, 'Ledger/2026/09.md');
  const catalogs = {
    ACCOUNTS: { type: 'accounts', accounts: { cash: { name: 'Cash', currency: 'GEL' } } },
    CATEGORIES: {
      type: 'categories',
      categories: { expense: { food: { name: 'Food' } }, income: { salary: { name: 'Salary' } } },
    },
    RATES: { type: 'rates', reference_currency: 'GEL', rates: {} },
  };
  for (const [name, data] of Object.entries(catalogs))
    await fs.writeFile(join(root, `${name}.md`), newDocument(data));
});

afterEach(async () => {
  vi.resetAllMocks();
  await fs.rm(root, { recursive: true, force: true });
});

async function batch(yaml: string, ...args: string[]) {
  await fs.writeFile(source, yaml);
  return runCli(['import', root, source, '--json', '--today', '2026-09-13', ...args]);
}

async function ledger(entries: Array<Record<string, string>>) {
  const markdown = newDocument({ type: 'ledger_month', period: '2026-09', entries });
  const original =
    markdown.replace('---\n', '---\naliases: [Personal] # keep this comment\n') + '\n## My notes\n';
  await fs.mkdir(join(root, 'Ledger/2026'), { recursive: true });
  await fs.writeFile(september, original);
  return original;
}

it('previews and applies multiple months while preserving Markdown', async () => {
  const original = await ledger([
    {
      id: checkpointId,
      type: 'balance_checkpoint',
      date: '2026-09-02T12:00',
      account: 'cash',
      balance: '100.00',
      custom: 'keep',
    },
  ]);
  const yaml =
    header + earlier + row + row.replace('T12:00', 'T14:00') + row.replace('T12:00', 'T09:00');
  const preview = await batch(yaml);
  expect(preview.code, preview.stdout || preview.stderr).toBe(0);
  expect(JSON.parse(preview.stdout)).toMatchObject({
    status: 'preview',
    entries: [
      { index: 0, date: '2026-08-31', currency: 'GEL', balanceEffect: 'absorbed' },
      {
        index: 1,
        date: '2026-09-02T12:00',
        balanceEffect: 'same-minute',
        checkpoint: { id: checkpointId },
      },
      { index: 2, date: '2026-09-02T14:00', balanceEffect: 'included' },
      { index: 3, date: '2026-09-02T09:00', balanceEffect: 'absorbed' },
    ],
  });
  expect(preview.stdout).not.toContain('"id":"019949d2-89e7-7f12-8d44-0dc85e414343"');
  expect(await fs.readFile(september, 'utf8')).toBe(original);
  expect(await fs.readdir(join(root, 'Ledger/2026'))).toEqual(['09.md']);

  const result = await batch(yaml, '--apply');
  expect(result.code, result.stdout || result.stderr).toBe(0);
  const report = JSON.parse(result.stdout) as {
    status: string;
    applied: Array<{ id: string; index: number; path: string }>;
  };
  expect(report.status).toBe('applied');
  expect(report.applied).toEqual(
    ['08', '09', '09', '09'].map((month, index) => ({
      index,
      id: expect.stringMatching(
        /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/u,
      ) as unknown,
      path: join(root, `Ledger/2026/${month}.md`),
    })),
  );
  expect(new Set(report.applied.map(({ id }) => id)).size).toBe(4);
  const written = await fs.readFile(september, 'utf8');
  expect(written).toContain('aliases: [Personal] # keep this comment');
  const document = decodeDocument(written);
  expect(document.body).toBe(decodeDocument(original).body);
  expect(document.managed.entries).toMatchObject([
    { id: checkpointId, custom: 'keep' },
    ...report.applied.slice(1).map(({ id }) => ({ id, amount: '12.30' })),
  ]);
  expect((await runCli(['validate', root, '--today', '2026-09-13'])).code).toBe(0);
});

it.each([
  ['YAML syntax', '[', 'document'],
  ['duplicate keys', header + row + '    amount: "1.00"\n', 'document'],
  ['second document', header + row + '---\n{}\n', 'document'],
  ['alias', header + row.replace('"12.30"', '*unknown'), 'document'],
  ['wrong version', (header + row).replace('version: 1', 'version: "1"'), 'version'],
  ['unknown root field', 'currency: GEL\n' + header + row, 'currency'],
  ['empty batch', 'version: 1\naccount: cash\nentries: []\n', 'entries'],
  ['unknown Account', (header + row).replace('account: cash', 'account: missing'), 'account'],
  ['numeric amount', header + row.replace('"12.30"', '12.30'), 'entries[0].amount'],
  ['extra precision', header + row.replace('"12.30"', '"12.301"'), 'entries[0].amount'],
  ['zero', header + row.replace('"12.30"', '"0"'), 'entries[0].amount'],
  ['negative', header + row.replace('"12.30"', '"-1"'), 'entries[0].amount'],
  ['future', header + row.replace('09-02', '09-14'), 'entries[0].date'],
  ['invalid time', header + row.replace('T12:00', 'T24:00'), 'entries[0].date'],
  ['wrong Category type', header + row + '    category: salary\n', 'entries[0].category'],
  ['null optional field', header + row + '    description: null\n', 'entries[0].description'],
  ['UUID supplied', header + row + `    id: ${expenseId}\n`, 'entries[0].id'],
  ['per-entry account', header + row + '    account: cash\n', 'entries[0].account'],
  ['checkpoint input', header + row.replace('expense', 'balance_checkpoint'), 'entries[0].type'],
])('rejects %s without any writes', async (_case, yaml, field) => {
  const result = await batch(yaml, '--apply', '--allow-duplicates');
  expect(result.code, result.stdout || result.stderr).toBe(1);
  expect(JSON.parse(result.stdout)).toMatchObject({
    status: 'invalid',
    diagnostics: [{ path: source, field }],
  });
  expect(await fs.readdir(root)).not.toContain('Ledger');
});

it('blocks internal duplicates even when Ledger matches are allowed', async () => {
  const midnight = row.replace('T12:00', '');
  const equivalent = row.replace('T12:00', 'T00:00').replace('12.30', '12.3');
  const internal = await batch(header + midnight + equivalent, '--apply', '--allow-duplicates');
  expect(internal.code).toBe(1);
  expect(JSON.parse(internal.stdout)).toMatchObject({
    diagnostics: [
      { field: 'entries[1]', message: expect.stringContaining('entries[0]') as unknown },
    ],
  });
  const original = await ledger([
    { id: expenseId, type: 'expense', date: '2026-09-02', account: 'cash', amount: '12.30' },
  ]);
  const existing = await batch(header + equivalent, '--apply');
  expect(existing.code).toBe(1);
  expect(JSON.parse(existing.stdout)).toMatchObject({
    status: 'invalid',
    duplicates: [{ index: 0, id: expenseId, path: september }],
  });
  expect(await fs.readFile(september, 'utf8')).toBe(original);
  expect((await batch(header + equivalent, '--apply', '--allow-duplicates')).code).toBe(0);
});

it('blocks even non-monetary diagnostics before writing any month', async () => {
  const original = await ledger([
    {
      id: expenseId,
      type: 'expense',
      date: '2026-09-02',
      account: 'cash',
      amount: '12.30',
      category: 'missing',
    },
  ]);
  const result = await batch(header + earlier, '--apply');
  expect(result.code).toBe(1);
  expect(JSON.parse(result.stdout)).toMatchObject({
    status: 'invalid',
    diagnostics: [{ path: september, field: 'category', monetary: false }],
  });
  expect(await fs.readFile(september, 'utf8')).toBe(original);
  expect(await fs.readdir(join(root, 'Ledger/2026'))).toEqual(['09.md']);
});

it('stops at a concurrent edit and reports the previously committed month', async () => {
  const original = await ledger([]);
  const concurrent = original + 'A newer edit.\n';
  const disk = await vi.importActual<typeof fs>('node:fs/promises');
  vi.mocked(fs.open).mockImplementation(async (...args) => {
    const handle = await disk.open(...args);
    if (typeof args[0] === 'string' && args[0].startsWith(september + '.')) {
      await disk.writeFile(september, concurrent);
    }
    return handle;
  });
  const result = await batch(header + row + earlier, '--apply');
  expect(result.code, result.stdout || result.stderr).toBe(2);
  const august = join(root, 'Ledger/2026/08.md');
  expect(JSON.parse(result.stdout)).toMatchObject({
    status: 'partial',
    error: expect.stringContaining('changed') as unknown,
    applied: [{ index: 1, path: august, id: expect.any(String) as unknown }],
    pending: [{ index: 0, path: september }],
  });
  expect(decodeDocument(await fs.readFile(august, 'utf8')).managed.entries).toHaveLength(1);
  expect(await fs.readFile(september, 'utf8')).toBe(concurrent);
  expect((await fs.readdir(join(root, 'Ledger/2026'))).sort()).toEqual(['08.md', '09.md']);
});

it('keeps the destination intact after an I/O failure and lists every unwritten row', async () => {
  const original = await ledger([]);
  vi.mocked(fs.rename).mockRejectedValueOnce(new Error('I/O failure replacing September'));
  const october = row.replace('09-02', '10-02');
  await fs.writeFile(source, header + earlier + row + october);
  const result = await runCli([
    'import',
    root,
    source,
    '--json',
    '--today',
    '2026-10-02',
    '--apply',
  ]);
  expect(result.code).toBe(2);
  expect(JSON.parse(result.stdout)).toMatchObject({
    status: 'partial',
    applied: [
      { index: 0, path: join(root, 'Ledger/2026/08.md'), id: expect.any(String) as unknown },
    ],
    pending: [
      { index: 1, path: september },
      { index: 2, path: join(root, 'Ledger/2026/10.md') },
    ],
    error: 'I/O failure replacing September',
  });
  expect(await fs.readFile(september, 'utf8')).toBe(original);
  expect((await fs.readdir(join(root, 'Ledger/2026'))).sort()).toEqual(['08.md', '09.md']);
});
