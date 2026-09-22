import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Exercise npm's real Git-dependency prepare lifecycle, outside this checkout.
const temporary = await mkdtemp(join(tmpdir(), 'money-manager-install-'));
const repository = join(temporary, 'repository');
const prefix = join(temporary, 'prefix');
const cache = join(temporary, 'npm-cache');
const workspace = join(temporary, 'Money Workspace');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
let passed = false;

function run(command, args, cwd = temporary) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

try {
  await mkdir(repository);
  for (const name of ['src', 'package.json', 'esbuild.cli.config.mjs', '.gitignore'])
    await cp(resolve(name), join(repository, name), { recursive: true });
  await mkdir(join(repository, 'scripts'));
  await cp(resolve('scripts/prepare-cli.mjs'), join(repository, 'scripts/prepare-cli.mjs'));
  run('git', ['init', '--quiet'], repository);
  run('git', ['add', '.'], repository);
  run(
    'git',
    [
      '-c',
      'user.name=CLI installation test',
      '-c',
      'user.email=cli-test@example.invalid',
      'commit',
      '--quiet',
      '-m',
      'CLI installation fixture',
    ],
    repository,
  );

  console.log('Installing the source Git package into an isolated global npm prefix…');
  const spec = `git+${pathToFileURL(repository).href}`;
  run(npm, [
    'install',
    '--global',
    '--prefix',
    prefix,
    '--cache',
    cache,
    '--install-links',
    '--no-audit',
    '--no-fund',
    '--ignore-scripts=false',
    spec,
  ]);

  const modules = run(npm, ['root', '--global', '--prefix', prefix]).trim();
  const installed = join(modules, 'obsidian-money-manager');
  const command = join(
    prefix,
    process.platform === 'win32' ? 'money-manager.cmd' : 'bin/money-manager',
  );
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  assert.equal(run(command, ['--version']).trim(), pkg.version);
  assert.match(
    run(command, ['new-id']).trim(),
    /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/u,
  );
  await assert.rejects(readFile(join(installed, 'skills/money-manager/references/data-model.md')), {
    code: 'ENOENT',
  });

  await mkdir(workspace);
  const catalogs = {
    ACCOUNTS: 'type: accounts\n  accounts: {}',
    CATEGORIES: 'type: categories\n  categories:\n    expense: {}\n    income: {}',
    RATES: 'type: rates\n  reference_currency: GEL\n  rates: {}',
  };
  for (const [name, body] of Object.entries(catalogs))
    await writeFile(
      join(workspace, `${name}.md`),
      `---\nmoney_manager:\n  schema_version: 1\n  ${body}\n---\n`,
    );
  const result = run(command, ['validate', workspace, '--json', '--today', '2026-09-13']);
  assert.deepEqual(JSON.parse(result), { status: 'valid', diagnostics: [] });

  const localPrefix = join(temporary, 'local-prefix');
  run(npm, ['install', '--global', '--prefix', localPrefix, '--cache', cache, '.'], resolve('.'));
  const localCommand = join(
    localPrefix,
    process.platform === 'win32' ? 'money-manager.cmd' : 'bin/money-manager',
  );
  assert.equal(run(localCommand, ['--version']).trim(), pkg.version);
  assert.deepEqual(JSON.parse(run(localCommand, ['validate', workspace, '--json'])), {
    status: 'valid',
    diagnostics: [],
  });
  console.log('Git and local global installation, prepare, UUIDv7 and validation passed.');
  passed = true;
} catch (error) {
  if (error.stderr) console.error(String(error.stderr));
  else console.error(error.message);
  console.error(`Installation check failed; artifacts retained at ${temporary}`);
  process.exitCode = 1;
} finally {
  if (passed) await rm(temporary, { recursive: true, force: true });
}
