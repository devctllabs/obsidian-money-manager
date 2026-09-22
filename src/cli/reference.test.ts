import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { decodeDocument } from '../domain/workspace-document';
import { runCli } from './cli';

it('accepts the standalone skill storage examples as one coherent Workspace', async () => {
  const reference = await readFile('skills/money-manager/references/data-model.md', 'utf8');
  const directory = await mkdtemp(join(tmpdir(), 'money-manager-reference-'));
  const paths: Record<string, string> = {
    accounts: 'ACCOUNTS.md',
    categories: 'CATEGORIES.md',
    rates: 'RATES.md',
    ledger_month: 'Ledger/2026/09.md',
  };
  try {
    for (const example of reference.matchAll(/```markdown\n([\s\S]*?)\n```/gu)) {
      const text = `${example[1]!}\n`;
      const document = decodeDocument(text);
      const path = join(directory, paths[String(document.managed.type)]!);
      await mkdir(join(path, '..'), { recursive: true });
      await writeFile(path, text);
    }
    const result = await runCli(['validate', directory, '--json', '--today', '2026-09-13']);
    expect(result.code, result.stdout || result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ status: 'valid', diagnostics: [] });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
