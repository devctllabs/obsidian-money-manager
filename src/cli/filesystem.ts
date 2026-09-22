import { lstat, readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

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
  for (const name of ['ACCOUNTS.md', 'CATEGORIES.md', 'RATES.md'])
    sources.set(`${root}/${name}`, await readOptional(join(resolved, name)));
  for (const path of (await listLedger(join(resolved, 'Ledger'))).sort())
    sources.set(path.split(sep).join('/'), await readOptional(path));
  return { sources, root };
}
