import { CategoryWorkflow } from '../categories/category-workflow';
import { normalizeKey } from '../../domain/validation';
import type { Entry, LocatedEntry } from '../../domain/entry';
import type { MoneyDocuments } from '../workspace/workspace';
import type { MoneyIndex } from '../indexing/money-index';
import { checkedDocument, validateEntry } from '../../domain/validation';
import { encodeDocument, newDocument } from '../../domain/workspace-document';

export class EntryWorkflow {
  constructor(
    private readonly documents: MoneyDocuments,
    private readonly index: MoneyIndex,
  ) {}
  async createWithCategory(entry: Entry, name: string, original?: LocatedEntry): Promise<void> {
    if (entry.type === 'balance_checkpoint') throw new Error('Checkpoint cannot have a Category');
    const key = normalizeKey(name);
    try {
      await this.index.refresh();
      const existing = this.index.getSnapshot().categories[entry.type][key];
      if (existing && existing.name !== name.trim())
        throw new Error('Category key already exists; select the existing category');
      if (!existing)
        await new CategoryWorkflow(this.documents, this.index).create(entry.type, key, {
          name: name.trim(),
        });
    } catch (error) {
      throw new Error(`Category not saved. ${error instanceof Error ? error.message : 'Retry.'}`);
    }
    try {
      const next = { ...entry, category: key };
      if (original) await this.edit(original, next);
      else await this.create(next);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Retry.';
      throw new Error(`Category saved; entry not saved. Your draft is retained. ${detail}`);
    }
  }
  create(entry: Entry): Promise<void> {
    return this.index.mutate(async () => {
      this.validate(entry);
      if (this.index.getSnapshot().entries.some((row) => row.entry.id === entry.id))
        throw new Error('Duplicate UUID');
      await this.append(entry);
    });
  }
  edit(original: LocatedEntry, entry: Entry): Promise<void> {
    return this.index.mutate(async () => {
      this.validate(entry);
      this.validateEdit(original, entry);
      await this.assertSource(original);
      const destination = this.path(entry);
      if (destination === original.path) await this.update(original, entry);
      else {
        await this.append(entry);
        try {
          await this.update(original, null);
        } catch {
          throw new Error(
            `Both copies remain in ${original.path} and ${destination}. ` +
              'Resolve the duplicate UUID in Markdown.',
          );
        }
      }
    });
  }
  delete(original: LocatedEntry): Promise<void> {
    return this.index.mutate(() => this.update(original, null));
  }
  private validate(entry: Entry) {
    validateEntry(entry, {
      accounts: this.index.getSnapshot().accounts,
      today: this.index.currentDate(),
      period: entry.date.slice(0, 7),
    });
    if (
      entry.type !== 'balance_checkpoint' &&
      entry.category !== undefined &&
      !this.index.getSnapshot().categories[entry.type][entry.category]
    )
      throw new Error('Category must belong to the selected entry type');
  }
  private validateEdit(original: LocatedEntry, entry: Entry) {
    if (
      (entry.type === 'balance_checkpoint' || original.entry.type === 'balance_checkpoint') &&
      entry.type !== original.entry.type
    )
      throw new Error('Checkpoint type cannot change');
    if (entry.id !== original.entry.id) throw new Error('Entry identity is immutable');
    const accounts = this.index.getSnapshot().accounts;
    if (accounts[entry.account]?.currency !== accounts[original.entry.account]?.currency)
      throw new Error('Account Currency must remain the same');
  }
  private path(entry: Entry) {
    return `${this.index.root}/Ledger/${entry.date.slice(0, 7).replace('-', '/')}.md`;
  }
  private document(text: string, path: string) {
    this.index.assertWritable(path);
    const doc = checkedDocument(text, path, this.index.root);
    for (const raw of doc.managed.entries as unknown[])
      validateEntry(raw, {
        accounts: this.index.getSnapshot().accounts,
        today: this.index.currentDate(),
        period: String(doc.managed.period),
      });
    return doc;
  }
  private async append(entry: Entry) {
    const path = this.path(entry);
    if ((await this.documents.read(path)) === null) {
      await this.documents.create(
        path,
        newDocument({ type: 'ledger_month', period: entry.date.slice(0, 7), entries: [entry] }),
      );
      return;
    }
    await this.documents.process(path, (text) => {
      const doc = this.document(text, path);
      const entries = doc.managed.entries as Entry[];
      if (entries.some((item) => item.id === entry.id)) throw new Error('Duplicate UUID');
      entries.push(entry);
      return encodeDocument(doc);
    });
  }
  private async assertSource(original: LocatedEntry) {
    const text = await this.documents.read(original.path);
    if (text === null) throw new Error('Source document changed');
    this.findOriginal(this.document(text, original.path).managed.entries as Entry[], original);
  }
  private findOriginal(entries: Entry[], original: LocatedEntry): number {
    const position = entries.findIndex((entry) => entry.id === original.entry.id);
    if (position < 0 || JSON.stringify(entries[position]) !== JSON.stringify(original.entry))
      throw new Error('Entry changed; reopen the current entry and retry');
    return position;
  }
  private async update(original: LocatedEntry, entry: Entry | null) {
    await this.documents.process(original.path, (text) => {
      const doc = this.document(text, original.path);
      const entries = doc.managed.entries as Entry[];
      const position = this.findOriginal(entries, original);
      if (entry === null) entries.splice(position, 1);
      else entries[position] = { ...entries[position], ...entry };
      return encodeDocument(doc);
    });
  }
}
