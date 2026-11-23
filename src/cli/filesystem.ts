import { randomUUID } from 'node:crypto';
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
} from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';

const catalogs = ['ACCOUNTS.md', 'CATEGORIES.md', 'RATES.md'] as const;

function missing(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function readOptional(path: string): Promise<string | null> {
  try {
    const info = await lstat(path);
    if (!info.isFile()) throw new Error(`Expected a regular file: ${path}`);
    return await readFile(path, 'utf8');
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
}

async function ledgerPaths(directory: string): Promise<string[]> {
  const info = await lstat(directory);
  if (!info.isDirectory()) throw new Error(`Expected a directory: ${directory}`);
  const paths: string[] = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not supported: ${path}`);
    if (entry.isDirectory()) paths.push(...(await ledgerPaths(path)));
    else if (entry.name.endsWith('.md')) paths.push(path);
  }
  return paths;
}

async function listLedger(directory: string): Promise<string[]> {
  try {
    await lstat(directory);
  } catch (error) {
    if (missing(error)) return [];
    throw error;
  }
  return ledgerPaths(directory);
}

export async function readWorkspace(directory: string) {
  const resolved = resolve(directory);
  if (!(await stat(resolved)).isDirectory()) throw new Error(`Expected a directory: ${resolved}`);
  // The domain's calendar paths use '/', including on Windows.
  const root = resolved.split(sep).join('/').replace(/\/$/u, '');
  const sources = new Map<string, string | null>();
  for (const name of catalogs)
    sources.set(`${root}/${name}`, await readOptional(join(resolved, name)));
  for (const path of (await listLedger(join(resolved, 'Ledger'))).sort())
    sources.set(path.split(sep).join('/'), await readOptional(path));
  return { sources, root };
}

async function ensureDirectory(path: string) {
  try {
    await mkdir(path);
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
  }
  await assertDirectory(path);
}

async function assertDirectory(path: string) {
  if (!(await lstat(path)).isDirectory()) throw new Error(`Expected a directory: ${path}`);
}

async function assertUnchanged(path: string, expected: string | null) {
  if ((await readOptional(path)) !== expected)
    throw new Error(`File changed during import: ${path}`);
}

export async function writeMonth(
  { path, original, content }: { path: string; original: string | null; content: string },
  { root, sources }: Awaited<ReturnType<typeof readWorkspace>>,
) {
  const year = dirname(path);
  const ledger = dirname(year);
  await ensureDirectory(ledger);
  await ensureDirectory(year);
  const temp = `${path}.${randomUUID()}.tmp`;
  const staged = await open(temp, 'wx', 0o600);
  try {
    try {
      await staged.writeFile(content);
    } finally {
      await staged.close();
    }
    await assertDirectory(ledger);
    await assertDirectory(year);
    if (original !== null) await chmod(temp, (await lstat(path)).mode & 0o777);
    for (const name of catalogs) {
      const catalog = `${root}/${name}`;
      await assertUnchanged(catalog, sources.get(catalog) ?? null);
    }
    await assertUnchanged(path, original);
    if (original === null) await link(temp, path);
    else await rename(temp, path);
  } finally {
    await rm(temp, { force: true }).catch(() => undefined);
  }
}
