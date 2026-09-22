import type { MoneyDocuments } from '../workspace/workspace';
import { buildSnapshot, emptySnapshot, type DocumentCache } from './read-model';

export class MoneyIndex {
  private parsed: DocumentCache = new Map();
  private errors = new Map<string, string>();
  private listingError: string | null = null;
  private disposed = false;
  private revision = 0;
  private listeners = new Set<() => void>();
  private reads: Promise<void> = Promise.resolve();
  private snapshot = emptySnapshot();
  private sources = new Map<string, string | null>();
  constructor(
    private readonly documents: MoneyDocuments,
    readonly root: string,
    private readonly today: () => string,
  ) {}
  private tail: Promise<unknown> = Promise.resolve();
  currentDate() {
    return this.today();
  }
  assertWritable(path: string) {
    const errors = this.snapshot.diagnostics.filter((item) => item.path === path);
    if (errors.length)
      throw new Error(errors.map((item) => `${item.path}: ${item.message}`).join('\n'));
  }
  mutate<T>(operation: () => Promise<T>): Promise<T> {
    const task = this.tail.then(async () => {
      if (this.disposed) throw new Error('Workspace closed');
      await this.refresh();
      if (this.disposed) throw new Error('Workspace closed');
      try {
        return await operation();
      } finally {
        await this.refresh();
      }
    });
    this.tail = task.catch(() => undefined);
    return task;
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  dispose() {
    this.disposed = true;
    this.listeners.clear();
    this.parsed.clear();
    this.sources.clear();
    this.errors.clear();
  }
  refresh(): Promise<void> {
    return this.scheduleRead(() => this.readAll());
  }
  refreshPaths(paths: readonly string[]): Promise<void> {
    return this.scheduleRead(async () => {
      if (paths.some((path) => !path.endsWith('.md'))) {
        await this.readAll();
        return;
      }
      for (const path of new Set(paths)) {
        if (!path.startsWith(`${this.root}/`)) continue;
        const content = await this.readDocument(path);
        if (content === null && !this.errors.has(path) && path.includes('/Ledger/'))
          this.sources.delete(path);
        else this.sources.set(path, content);
      }
      this.publish();
    });
  }
  private scheduleRead(read: () => Promise<void>) {
    const task = this.reads.then(async () => {
      if (!this.disposed) await read();
    });
    this.reads = task.catch(() => undefined);
    return task;
  }
  private publish() {
    if (this.disposed) return;
    this.snapshot = {
      ...buildSnapshot(this.sources, this.root, this.today(), this.parsed),
      revision: ++this.revision,
    };
    for (const item of this.snapshot.diagnostics) {
      const error = this.errors.get(item.path);
      if (error) item.message = error;
    }
    if (this.listingError) {
      this.snapshot.diagnostics.push({
        path: `${this.root}/Ledger`,
        field: 'document',
        message: this.listingError,
        monetary: true,
      });
      this.snapshot.incomplete = true;
    }
    freezeSnapshot(this.snapshot);
    for (const listener of this.listeners) listener();
  }
  private async readAll(): Promise<void> {
    let months: string[] = [];
    this.listingError = null;
    try {
      months = await this.documents.list(`${this.root}/Ledger`);
    } catch (error) {
      this.listingError = error instanceof Error ? error.message : 'Cannot read Ledger';
    }
    const paths = [
      `${this.root}/ACCOUNTS.md`,
      `${this.root}/CATEGORIES.md`,
      `${this.root}/RATES.md`,
      ...months,
    ];
    const sources = new Map<string, string | null>();
    for (const path of paths) sources.set(path, await this.readDocument(path));
    this.sources = sources;
    this.publish();
  }
  private async readDocument(path: string): Promise<string | null> {
    try {
      const content = await this.documents.read(path);
      this.errors.delete(path);
      return content;
    } catch (error) {
      this.errors.set(path, error instanceof Error ? error.message : 'Document read failed');
      return null;
    }
  }
}

function freezeSnapshot(value: unknown): void {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return;
  for (const child of Object.values(value)) freezeSnapshot(child);
  Object.freeze(value);
}
