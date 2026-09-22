import { spawnSync } from 'node:child_process';
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, expect, it } from 'vitest';
import pkg from '../../package.json';
import { newDocument } from '../domain/workspace-document';

let directory: string;
let executable: string;

beforeAll(async () => {
  const build = spawnSync(process.execPath, ['esbuild.cli.config.mjs'], { encoding: 'utf8' });
  expect(build.status, build.stderr).toBe(0);
  directory = await mkdtemp(join(tmpdir(), 'money manager bundle-'));
  executable = join(directory, 'money-manager.mjs');
  await copyFile(resolve('dist/money-manager.mjs'), executable);
});

afterAll(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});

function execute(...args: string[]) {
  return spawnSync(process.execPath, [executable, ...args], {
    cwd: directory,
    encoding: 'utf8',
  });
}

it('runs the standalone bundle without the repository or installed dependencies', () => {
  const result = execute('--version');
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');
  expect(result.stdout).toBe(`${pkg.version}\n`);
  const identity = execute('new-id');
  expect(identity.status).toBe(0);
  expect(identity.stdout.trim()).toMatch(
    /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/u,
  );
});

it('propagates real process exit codes and JSON for bad data and execution errors', () => {
  const invalid = execute('validate', directory, '--json');
  expect(invalid.status).toBe(1);
  expect(JSON.parse(invalid.stdout)).toMatchObject({ status: 'invalid' });
  const error = execute('validate', join(directory, 'absent'), '--json');
  expect(error.status).toBe(2);
  expect(JSON.parse(error.stdout)).toMatchObject({ status: 'error' });
  expect(execute('unknown').status).toBe(2);
});

it('validates an empty Money Workspace through the packaged entrypoint', async () => {
  const catalogs = {
    ACCOUNTS: { type: 'accounts', accounts: {} },
    CATEGORIES: { type: 'categories', categories: { expense: {}, income: {} } },
    RATES: { type: 'rates', reference_currency: 'GEL', rates: {} },
  };
  for (const [name, fields] of Object.entries(catalogs))
    await writeFile(join(directory, `${name}.md`), newDocument(fields));
  const result = execute('validate', directory, '--json', '--today', '2026-09-13');
  expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({ status: 'valid', diagnostics: [] });
});
