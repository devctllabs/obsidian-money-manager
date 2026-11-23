import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { v7 } from 'uuid';
import { planImport, type ImportRow } from '../application/entries/import-plan';
import { buildSnapshot } from '../application/indexing/read-model';
import type { Diagnostic, Entry } from '../domain/entry';
import { appendLedgerEntries, newDocument } from '../domain/workspace-document';
import { readWorkspace, writeMonth } from './filesystem';

interface ImportOptions {
  root: string;
  file: string;
  today: string;
  apply: boolean;
  allowDuplicates: boolean;
}

interface Applied {
  index: number;
  id: string;
  path: string;
}

type ImportReport = {
  status: 'preview' | 'applied' | 'invalid' | 'partial' | 'error';
  diagnostics: Diagnostic[];
  entries?: ReturnType<typeof previewRows>;
  duplicates?: ReturnType<typeof planImport>['duplicates'];
  applied?: Applied[];
  pending?: Array<Pick<Applied, 'index' | 'path'>>;
  error?: string;
};

export async function runImport(options: ImportOptions): Promise<ImportReport> {
  const workspace = await readWorkspace(options.root);
  const { sources, root } = workspace;
  const snapshot = buildSnapshot(sources, root, options.today);
  if (snapshot.diagnostics.length) return { status: 'invalid', diagnostics: snapshot.diagnostics };
  const file = resolve(options.file);
  const plan = planImport(await readFile(file, 'utf8'), snapshot, { ...options, root, file });
  const { duplicates, diagnostics } = plan;
  if (diagnostics.length || !options.apply) {
    const status = diagnostics.length ? 'invalid' : 'preview';
    return { status, entries: previewRows(plan.rows), duplicates, diagnostics };
  }
  const ids = new Set(snapshot.entries.map(({ entry }) => entry.id.toLowerCase()));
  return applyPlan(plan, workspace, ids, options.today);
}

async function applyPlan(
  { rows, duplicates }: ReturnType<typeof planImport>,
  workspace: Awaited<ReturnType<typeof readWorkspace>>,
  ids: Set<string>,
  today: string,
): Promise<ImportReport> {
  const applied: Applied[] = [];
  try {
    for (const month of monthWrites(rows, workspace.sources, ids)) {
      await writeMonth(month, workspace);
      applied.push(...month.identities);
    }
    applied.sort((a, b) => a.index - b.index);
    const diagnostics = await verifyImport(workspace.root, today, rows, applied);
    if (diagnostics.length)
      return {
        status: 'error',
        applied,
        pending: [],
        duplicates,
        error: 'Imported Entries were written, but Workspace validation failed',
        diagnostics,
      };
    return { status: 'applied', applied, duplicates, diagnostics: [] };
  } catch (error) {
    applied.sort((a, b) => a.index - b.index);
    const saved = new Set(applied.map(({ index }) => index));
    const pending = rows
      .filter(({ index }) => !saved.has(index))
      .map(({ index, path }) => ({ index, path }));
    return {
      status: applied.length && pending.length ? 'partial' : 'error',
      applied,
      pending,
      duplicates,
      diagnostics: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function verifyImport(root: string, today: string, rows: ImportRow[], applied: Applied[]) {
  const current = await readWorkspace(root);
  const verified = buildSnapshot(current.sources, root, today);
  if (verified.diagnostics.length) return verified.diagnostics;
  const actual = new Map(verified.entries.map((row) => [row.entry.id, row]));
  for (const { index, id, path } of applied) {
    const written = actual.get(id);
    if (
      written?.path !== path ||
      !Object.entries(rows[index]!.entry).every(([key, value]) => written.entry[key] === value)
    )
      throw new Error(`Could not verify imported Entry ${id} in ${path}`);
  }
  return [];
}

function previewRows(rows: readonly ImportRow[]) {
  return rows.map(({ entry, ...context }) => ({ ...entry, ...context }));
}

function monthWrites(
  rows: readonly ImportRow[],
  sources: ReadonlyMap<string, string | null>,
  ids: Set<string>,
) {
  const months = new Map<string, { entries: Entry[]; identities: Applied[] }>();
  for (const { index, path, entry } of rows) {
    let id = v7();
    while (ids.has(id)) id = v7();
    ids.add(id);
    const month = months.get(path) ?? { entries: [], identities: [] };
    months.set(path, month);
    month.entries.push({ id, ...entry });
    month.identities.push({ index, path, id });
  }
  return [...months.keys()].sort().map((path) => {
    const { entries, identities } = months.get(path)!;
    const original = sources.get(path) ?? null;
    const content =
      original === null
        ? newDocument({ type: 'ledger_month', period: entries[0]!.date.slice(0, 7), entries })
        : appendLedgerEntries(original, entries);
    return { path, original, content, identities };
  });
}

export function describeImport({
  status,
  entries = [],
  duplicates = [],
  applied = [],
  pending = [],
  diagnostics,
  error,
}: ImportReport) {
  const outcome = {
    preview: 'Preview only. Use --apply to write these Entries.',
    applied: 'Money Workspace is valid.',
    invalid: '',
    partial: error,
    error,
  };
  return [
    ...entries.map(describeRow),
    ...duplicates.map(
      ({ index, path, id }) => `entries[${index}] matches Ledger Entry ${id} in ${path}`,
    ),
    ...applied.map(({ index, id, path }) => `Saved entries[${index}] as ${id} in ${path}`),
    ...pending.map(({ index, path }) => `Pending entries[${index}] in ${path}`),
    ...diagnostics.map(describeDiagnostic),
    outcome[status],
  ]
    .filter(Boolean)
    .join('\n');
}

export function describeDiagnostic(item: Diagnostic) {
  return `${item.path}${item.record ? ` [${item.record}]` : ''}: ${item.field}: ${item.message}`;
}

function describeRow(item: ReturnType<typeof previewRows>[number]) {
  const category = item.category ? ` · ${item.categoryName} [${item.category}]` : '';
  const description =
    item.description === undefined ? '' : ` · ${JSON.stringify(item.description)}`;
  const account = `${item.accountName} [${item.account}]`;
  const amount = `${item.amount} ${item.currency}`;
  const line =
    `entries[${item.index}] ${item.date} ${item.type} ${amount} · ${account}` +
    `${category}${description} → ${item.path}`;
  if (!item.checkpoint) return line;
  const { date, id } = item.checkpoint;
  return `${line}\n${describeBalance(item.balanceEffect, date, id)}`;
}

function describeBalance(effect: ImportRow['balanceEffect'], date: string, id: string) {
  const checkpoint = `Balance Checkpoint ${date} [${id}]`;
  if (effect === 'same-minute')
    return `  Same minute as ${checkpoint}. UUIDv7 order at apply determines the balance effect.`;
  return effect === 'included'
    ? `  After ${checkpoint}. Included in the Account Balance.`
    : `  Before ${checkpoint}. Included in Period Reports and absorbed by reconciliation.`;
}
