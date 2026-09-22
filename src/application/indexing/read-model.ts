import {
  checkedDocument,
  diagnostic,
  excludeDuplicates,
  validateAccount,
  validateCategory,
  validateEntry,
  validateRates,
} from '../../domain/validation';
import { mapping } from '../../domain/workspace-document';
import { formatMinor, minor } from '../../domain/money';
import type { Account, Category, Diagnostic, Flow, LocatedEntry } from '../../domain/entry';

export interface Snapshot {
  phase: 'loading' | 'ready';
  revision: number;
  accounts: Record<string, Account>;
  categories: Record<Flow, Record<string, Category>>;
  rates: { reference: string; rates: Record<string, string> } | null;
  balances: Record<string, string>;
  checkpoints: Record<string, LocatedEntry | undefined>;
  entries: LocatedEntry[];
  diagnostics: Diagnostic[];
  incomplete: boolean;
}
export function emptySnapshot(): Snapshot {
  return {
    phase: 'loading',
    revision: 0,
    accounts: {},
    categories: { expense: {}, income: {} },
    rates: null,
    balances: {},
    checkpoints: {},
    entries: [],
    diagnostics: [],
    incomplete: false,
  };
}
export type DocumentCache = Map<
  string,
  { text: string; document: ReturnType<typeof checkedDocument> | Error }
>;
function parseCached(text: string, path: string, root: string, cache: DocumentCache) {
  let cached = cache.get(path);
  if (!cached || cached.text !== text) {
    try {
      cached = { text, document: checkedDocument(text, path, root) };
    } catch (error) {
      cached = {
        text,
        document: error instanceof Error ? error : new Error('Cannot parse document'),
      };
    }
    cache.set(path, cached);
  }
  if (cached.document instanceof Error) throw cached.document;
  return cached.document;
}
export function buildSnapshot(
  sources: ReadonlyMap<string, string | null>,
  root: string,
  today: string,
  cache: DocumentCache = new Map(),
): Snapshot {
  const snapshot = emptySnapshot();
  snapshot.phase = 'ready';
  for (const path of cache.keys()) if (!sources.has(path)) cache.delete(path);
  readCatalogs(sources, root, snapshot, cache);
  const entries: LocatedEntry[] = [];
  const identities: Array<{ id: string; path: string }> = [];
  for (const [path, content] of sources) {
    if (!path.startsWith(`${root}/Ledger/`)) continue;
    try {
      const doc = parseCached(content ?? '', path, root, cache);
      const rawEntries = doc.managed.entries as unknown[];
      rawEntries.forEach((raw, position) => {
        const id = recordId(raw);
        if (id) identities.push({ id, path });
        try {
          const entry = validateEntry(raw, {
            period: String(doc.managed.period),
            today,
            accounts: snapshot.accounts,
          });
          entries.push({ entry, path, position });
          checkCategory(entry, path, snapshot);
        } catch (error) {
          snapshot.diagnostics.push(diagnostic(error, path, recordId(raw)));
        }
      });
    } catch (error) {
      snapshot.diagnostics.push(diagnostic(error, path));
    }
  }
  snapshot.entries = excludeDuplicates(entries, snapshot.diagnostics, identities).sort(
    (a, b) => a.entry.date.localeCompare(b.entry.date) || a.position - b.position,
  );
  replayBalances(snapshot);
  snapshot.incomplete = snapshot.diagnostics.some((item) => item.monetary);
  return snapshot;
}
function recordId(raw: unknown): string | undefined {
  if (raw && typeof raw === 'object' && 'id' in raw && typeof raw.id === 'string') return raw.id;
  return undefined;
}
function readCatalogs(
  sources: ReadonlyMap<string, string | null>,
  root: string,
  snapshot: Snapshot,
  cache: DocumentCache,
) {
  for (const name of ['ACCOUNTS', 'CATEGORIES', 'RATES']) {
    const path = `${root}/${name}.md`;
    try {
      const { managed } = parseCached(sources.get(path) ?? '', path, root, cache);
      if (name === 'ACCOUNTS')
        snapshot.accounts = Object.fromEntries(
          Object.entries(mapping(managed.accounts)).map(([key, raw]) => [
            key,
            validateAccount(key, raw),
          ]),
        );
      if (name === 'CATEGORIES') {
        const categories = mapping(managed.categories);
        const parsed = { expense: {}, income: {} } as Snapshot['categories'];
        for (const flow of ['expense', 'income'] as const)
          parsed[flow] = Object.fromEntries(
            Object.entries(mapping(categories[flow])).map(([key, raw]) => [
              key,
              validateCategory(key, raw),
            ]),
          );
        snapshot.categories = parsed;
      }
      if (name === 'RATES') snapshot.rates = validateRates(managed);
    } catch (error) {
      const issue = diagnostic(error, path);
      issue.monetary = name === 'ACCOUNTS';
      snapshot.diagnostics.push(issue);
    }
  }
}
function checkCategory(entry: LocatedEntry['entry'], path: string, snapshot: Snapshot) {
  if (entry.type === 'balance_checkpoint' || entry.category === undefined) return;
  if (!snapshot.categories[entry.type][entry.category])
    snapshot.diagnostics.push({
      path,
      record: entry.id,
      field: 'category',
      message: 'Unknown category',
      monetary: false,
    });
}
function replayBalances(snapshot: Snapshot) {
  const values = new Map(Object.keys(snapshot.accounts).map((key) => [key, 0n]));
  for (const row of snapshot.entries) {
    const { entry } = row;
    const currency = snapshot.accounts[entry.account]!.currency;
    if (entry.type === 'balance_checkpoint') {
      values.set(entry.account, minor(entry.balance!, currency));
      snapshot.checkpoints[entry.account] = row;
    } else
      values.set(
        entry.account,
        values.get(entry.account)! +
          minor(entry.amount!, currency) * (entry.type === 'income' ? 1n : -1n),
      );
  }
  snapshot.balances = Object.fromEntries(
    [...values].map(([key, value]) => [key, formatMinor(value, snapshot.accounts[key]!.currency)]),
  );
}
