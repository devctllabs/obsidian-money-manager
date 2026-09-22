// @vitest-environment node
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCli } from './cli';
import pkg from '../../package.json';
import type { CliResult } from './cli';
import type { Diagnostic } from '../domain/entry';

let root: string;
const catalogs = {
  'ACCOUNTS.md': 'type: accounts\naccounts:\n  cash:\n    name: Cash\n    currency: GEL',
  'CATEGORIES.md': 'type: categories\ncategories:\n  expense: {}\n  income: {}',
  'RATES.md': 'type: rates\nreference_currency: GEL\nrates: {}',
};

function markdown(managed: string): string {
  const fields = managed
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
  return (
    '---\naliases: [Personal]\nmoney_manager:\n  schema_version: 1\n' +
    `${fields}\n---\n\nKeep my notes.\n`
  );
}

const id = '019949d3-51e4-7497-9a43-b7114b013f48';
const expense = `    - id: ${id}
      type: expense
      date: "2026-09-02"
      account: cash
      amount: "12.30"`;

function json(result: CliResult) {
  return JSON.parse(result.stdout) as {
    status: string;
    diagnostics: Diagnostic[];
    error?: string;
  };
}

async function ledger(entries = expense, path = 'Ledger/2026/09.md'): Promise<void> {
  const target = join(root, path);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, markdown(`type: ledger_month\nperiod: 2026-09\nentries:\n${entries}`));
}

function validate(...args: string[]) {
  return runCli(['validate', root, '--today', '2026-09-13', ...args]);
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'money manager cli-'));
  for (const [name, managed] of Object.entries(catalogs))
    await writeFile(join(root, name), markdown(managed));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('Money Manager CLI', () => {
  it('validates a workspace without a Ledger and leaves its documents unchanged', async () => {
    const result = await runCli(['validate', root, '--json', '--today', '2026-09-13']);
    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toEqual({ status: 'valid', diagnostics: [] });
    for (const [name, managed] of Object.entries(catalogs))
      expect(await readFile(join(root, name), 'utf8')).toBe(markdown(managed));
    expect((await readdir(root)).sort()).toEqual(Object.keys(catalogs).sort());
  });

  it('validates real Entries and prints a human-readable result', async () => {
    await ledger();
    const before = await readFile(join(root, 'Ledger/2026/09.md'), 'utf8');
    expect(await validate()).toEqual({
      code: 0,
      stdout: 'Money Workspace is valid.\n',
      stderr: '',
    });
    expect(await readFile(join(root, 'Ledger/2026/09.md'), 'utf8')).toBe(before);
  });

  it.each([
    ['unknown account', expense.replace('account: cash', 'account: missing'), 'account'],
    ['unknown category', `${expense}\n      category: missing`, 'category'],
    ['future date', expense.replace('2026-09-02', '2026-09-14'), 'date'],
    ['wrong Month', expense.replace('2026-09-02', '2026-08-02'), 'date'],
    ['excess precision', expense.replace('12.30', '12.301'), 'amount'],
    ['unquoted amount', expense.replace('"12.30"', '12.30'), 'amount'],
  ])('reports %s with the exact path and identity', async (_name, entry, field) => {
    await ledger(entry);
    const result = await validate('--json');
    expect(result.code).toBe(1);
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'invalid',
      diagnostics: [{ path: join(root, 'Ledger/2026/09.md'), record: id, field }],
    });
  });

  it('reports both duplicate identities across months in stable path order', async () => {
    await ledger();
    await mkdir(join(root, 'Ledger/2026'), { recursive: true });
    await writeFile(
      join(root, 'Ledger/2026/08.md'),
      markdown(
        'type: ledger_month\nperiod: 2026-08\nentries:\n' +
          expense.replace('2026-09-02', '2026-08-02'),
      ),
    );
    const result = await validate('--json');
    expect(result.code).toBe(1);
    expect(json(result).diagnostics).toEqual([
      expect.objectContaining({ path: join(root, 'Ledger/2026/08.md'), field: 'id', record: id }),
      expect.objectContaining({ path: join(root, 'Ledger/2026/09.md'), field: 'id', record: id }),
    ]);
  });

  it('reports a malformed sibling and preserves all input bytes', async () => {
    await ledger(
      `${expense}\n${expense.replace(id, id.replace('3f48', '3f49')).replace('12.30', '0')}`,
    );
    const path = join(root, 'Ledger/2026/09.md');
    const before = await readFile(path, 'utf8');
    const result = await validate('--json');
    expect(result.code).toBe(1);
    expect(json(result).diagnostics).toHaveLength(1);
    expect(await readFile(path, 'utf8')).toBe(before);
  });

  it('reports broken YAML and missing catalogs as data diagnostics', async () => {
    await writeFile(join(root, 'ACCOUNTS.md'), '---\nmoney_manager: [\n---\n');
    await rm(join(root, 'RATES.md'));
    const result = await validate('--json');
    expect(result.code).toBe(1);
    expect(json(result).diagnostics).toEqual([
      expect.objectContaining({ path: join(root, 'ACCOUNTS.md'), field: 'document' }),
      expect.objectContaining({ path: join(root, 'RATES.md'), field: 'document' }),
    ]);
  });

  it('scans non-canonical Ledger paths but ignores ordinary notes elsewhere', async () => {
    await ledger(expense, 'Ledger/notes/nested/wrong.md');
    await writeFile(join(root, 'notes.md'), 'A personal note');
    await writeFile(join(root, 'Ledger/receipt.txt'), 'A receipt');
    const result = await validate();
    expect(result.code).toBe(1);
    expect(result.stdout).toContain(join(root, 'Ledger/notes/nested/wrong.md'));
    expect(result.stdout).toContain('Non-canonical Ledger path');
    expect(result.stdout).not.toContain('notes.md');
    expect(result.stdout).not.toContain('receipt.txt');
  });

  it('cannot infer an accidental currency change with compatible precision', async () => {
    await ledger();
    await writeFile(
      join(root, 'ACCOUNTS.md'),
      markdown(catalogs['ACCOUNTS.md'].replace('GEL', 'USD')),
    );
    expect((await validate()).code).toBe(0);
  });

  it('distinguishes file access failures from data diagnostics in JSON', async () => {
    await rm(join(root, 'ACCOUNTS.md'));
    await mkdir(join(root, 'ACCOUNTS.md'));
    const result = await validate('--json');
    expect(result.code).toBe(2);
    expect(result.stderr).toBe('');
    expect(json(result).status).toBe('error');
    expect(json(result).diagnostics).toEqual([]);
    expect(json(result).error).toContain('ACCOUNTS.md');
  });

  it.each([
    [],
    ['unknown'],
    ['validate'],
    ['new-id', '--json'],
    ['--help', 'extra'],
    ['validate', '.', '--today', '2026-02-30'],
    ['validate', '.', '--today'],
    ['validate', '.', '--typo'],
    ['validate', '.', 'extra'],
  ])('rejects invalid arguments: %j', async (...args) => {
    const result = await runCli(args);
    expect(result.code).toBe(2);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  it('reports an absent workspace as an execution error', async () => {
    expect((await runCli(['validate', join(root, 'absent')])).code).toBe(2);
  });

  it('generates distinct UUIDv7 identifiers without changing the workspace', async () => {
    const first = await runCli(['new-id']);
    const second = await runCli(['new-id']);
    expect(first.code).toBe(0);
    expect(first.stdout.trim()).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/u,
    );
    expect(second.stdout).not.toBe(first.stdout);
    expect((await readdir(root)).sort()).toEqual(Object.keys(catalogs).sort());
  });

  it('provides usage and the package version', async () => {
    const help = await runCli(['--help']);
    expect(help.code).toBe(0);
    expect(help.stdout).toContain('validate');
    expect(help.stdout).toContain('new-id');
    expect(await runCli(['--version'])).toEqual({
      code: 0,
      stdout: `${pkg.version}\n`,
      stderr: '',
    });
  });
});
