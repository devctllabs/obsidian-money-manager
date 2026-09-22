import type { MoneyDocuments } from '../application/workspace/workspace';

export class MemoryDocuments implements MoneyDocuments {
  files = new Map<string, string>();
  failPath: string | null = null;
  async read(path: string) {
    return this.files.get(path) ?? null;
  }
  async list(root: string) {
    return [...this.files.keys()].filter((path) => path.startsWith(`${root}/`));
  }
  async create(path: string, content: string) {
    if (this.files.has(path)) throw new Error(`Already exists: ${path}`);
    this.write(path, content);
  }
  async process(path: string, update: (content: string) => string) {
    const current = this.files.get(path);
    if (current === undefined) throw new Error(`Missing: ${path}`);
    this.write(path, update(current));
  }
  private write(path: string, content: string) {
    if (path === this.failPath) throw new Error(`Write failed: ${path}`);
    this.files.set(path, content);
  }
}
