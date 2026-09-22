import { normalizeRoot } from '../../domain/workspace-document';
import type { MoneyDocuments } from './workspace';
import type { SettingsWorkflow } from './settings';
import { MoneyIndex } from '../indexing/money-index';
export class WorkspaceConnection {
  index: MoneyIndex;
  private listeners = new Set<() => void>();
  private unsubscribe: () => void;
  private tail: Promise<unknown> = Promise.resolve();
  private closed = false;
  constructor(
    private readonly documents: MoneyDocuments,
    private readonly settings: SettingsWorkflow,
    private readonly today: () => string,
  ) {
    this.index = new MoneyIndex(documents, settings.current.workspaceRoot, today);
    this.unsubscribe = this.index.subscribe(this.notify);
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.index.getSnapshot();
  private notify = () => {
    for (const listener of this.listeners) listener();
  };
  connect(root: string): Promise<void> {
    const task = this.tail.then(() => this.adopt(normalizeRoot(root)));
    this.tail = task.catch(() => undefined);
    return task;
  }
  private async adopt(root: string) {
    if (this.closed) throw new Error('Workspace closed');
    const candidate = new MoneyIndex(this.documents, root, this.today);
    try {
      await candidate.refresh();
      const errors = candidate.getSnapshot().diagnostics;
      if (errors.length)
        throw new Error(errors.map((error) => `${error.path}: ${error.message}`).join('\n'));
      await this.index.mutate(async () => {
        await this.settings.update({ ...this.settings.current, workspaceRoot: root });
        this.unsubscribe();
        this.index.dispose();
        this.index = candidate;
        this.unsubscribe = candidate.subscribe(this.notify);
        this.notify();
      });
    } catch (error) {
      candidate.dispose();
      throw error;
    }
  }
  dispose() {
    this.closed = true;
    this.unsubscribe();
    this.index.dispose();
    this.listeners.clear();
  }
}
