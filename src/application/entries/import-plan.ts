import { parseDocument } from 'yaml';
import { entryMinute, type Diagnostic, type EntryData } from '../../domain/entry';
import { minor } from '../../domain/money';
import { diagnostic, InvalidField, validateEntryData } from '../../domain/validation';
import { mapping } from '../../domain/workspace-document';
import type { Snapshot } from '../indexing/read-model';

export interface ImportRow {
  index: number;
  path: string;
  entry: EntryData;
  currency: string;
  accountName: string;
  categoryName?: string;
  checkpoint?: { id: string; date: string };
  balanceEffect: 'included' | 'absorbed' | 'same-minute';
}

interface LedgerMatch {
  index: number;
  id: string;
  path: string;
}

export function planImport(
  text: string,
  snapshot: Snapshot,
  {
    file,
    root,
    today,
    allowDuplicates,
  }: {
    file: string;
    root: string;
    today: string;
    allowDuplicates: boolean;
  },
) {
  const rows: ImportRow[] = [];
  const duplicates: LedgerMatch[] = [];
  const diagnostics: Diagnostic[] = [];
  let batch;
  try {
    batch = parseBatch(text, snapshot);
  } catch (error) {
    diagnostics.push(diagnostic(error, file));
    return { rows, duplicates, diagnostics };
  }

  const seen = new Map<string, number>();
  const existing = existingFingerprints(snapshot, batch.account, batch.currency);
  const context = { batch, root, today };
  for (const [index, input] of batch.entries.entries()) {
    const field = `entries[${index}]`;
    try {
      const row = planRow(input, index, context, snapshot);
      const key = fingerprint(row.entry, row.currency);
      const first = seen.get(key);
      if (first !== undefined) throw new Error(`Duplicates entries[${first}] in this YAML batch`);
      seen.set(key, index);
      rows.push(row);
      for (const match of existing.get(key) ?? []) {
        duplicates.push({ index, ...match });
        if (!allowDuplicates)
          diagnostics.push(
            diagnostic(
              new InvalidField(
                field,
                `Matches ${match.path} [${match.id}]; use --allow-duplicates to apply`,
              ),
              file,
            ),
          );
      }
    } catch (error) {
      const issue = diagnostic(error, file);
      diagnostics.push({
        ...issue,
        field: error instanceof InvalidField ? `${field}.${issue.field}` : field,
      });
    }
  }
  return { rows, duplicates, diagnostics };
}

function parseBatch(text: string, snapshot: Snapshot) {
  const document = parseDocument(text, { uniqueKeys: true, stringKeys: true });
  const issue = document.errors[0] ?? document.warnings[0];
  if (issue) throw issue;
  if (document.directives.yaml.version !== '1.2') throw new Error('Use YAML 1.2');
  const batch = strictMapping(document.toJS({ maxAliasCount: 0 }), [
    'version',
    'account',
    'entries',
  ]);
  if (batch.version !== 1) throw new InvalidField('version', 'Expected version: 1');
  if (
    typeof batch.account !== 'string' ||
    !Object.prototype.hasOwnProperty.call(snapshot.accounts, batch.account)
  )
    throw new InvalidField('account', 'Unknown Account Key');
  if (!Array.isArray(batch.entries) || batch.entries.length === 0)
    throw new InvalidField('entries', 'Expected a non-empty sequence');
  const { name, currency } = snapshot.accounts[batch.account]!;
  return { account: batch.account, name, currency, entries: batch.entries as unknown[] };
}

function strictMapping(raw: unknown, allowed: readonly string[]) {
  const fields = mapping(raw);
  const unknown = Object.keys(fields).find((key) => !allowed.includes(key));
  if (unknown !== undefined) throw new InvalidField(unknown, 'Unknown field');
  return fields;
}

function planRow(
  input: unknown,
  index: number,
  { batch, root, today }: { batch: ReturnType<typeof parseBatch>; root: string; today: string },
  snapshot: Snapshot,
): ImportRow {
  const fields = strictMapping(input, ['type', 'date', 'amount', 'category', 'description']);
  if (fields.type !== 'expense' && fields.type !== 'income')
    throw new InvalidField('type', 'Expected expense or income');
  const period = typeof fields.date === 'string' ? fields.date.slice(0, 7) : '';
  const entry = validateEntryData(
    { ...fields, account: batch.account },
    { accounts: snapshot.accounts, today, period },
  );
  const categories = snapshot.categories[fields.type];
  if (
    entry.category !== undefined &&
    !Object.prototype.hasOwnProperty.call(categories, entry.category)
  )
    throw new InvalidField('category', 'Unknown Category Key for this Entry type');

  const checkpoint = snapshot.checkpoints[batch.account]?.entry;
  return {
    index,
    path: `${root}/Ledger/${period.replace('-', '/')}.md`,
    entry,
    currency: batch.currency,
    accountName: batch.name,
    categoryName: entry.category === undefined ? undefined : categories[entry.category]!.name,
    checkpoint: checkpoint && { id: checkpoint.id, date: checkpoint.date },
    balanceEffect: balanceEffect(entry.date, checkpoint?.date),
  };
}

function balanceEffect(date: string, checkpointDate: string | undefined) {
  if (!checkpointDate) return 'included';
  const byMinute = entryMinute(date).localeCompare(entryMinute(checkpointDate));
  return byMinute > 0 ? 'included' : byMinute < 0 ? 'absorbed' : 'same-minute';
}

function fingerprint(entry: EntryData, currency: string) {
  return JSON.stringify([
    entry.type,
    entry.account,
    entryMinute(entry.date),
    minor(entry.amount!, currency).toString(),
    entry.category,
    entry.description,
  ]);
}

function existingFingerprints(snapshot: Snapshot, account: string, currency: string) {
  const result = new Map<string, Array<{ id: string; path: string }>>();
  for (const { entry, path } of snapshot.entries) {
    if (entry.account !== account || entry.type === 'balance_checkpoint') continue;
    const key = fingerprint(entry, currency);
    const match = { id: entry.id, path };
    const matches = result.get(key);
    if (matches) matches.push(match);
    else result.set(key, [match]);
  }
  return result;
}
