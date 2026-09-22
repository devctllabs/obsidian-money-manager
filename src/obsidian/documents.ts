import { TFile, TFolder, normalizePath, type Vault } from 'obsidian';
import type { MoneyDocuments } from '../application/workspace/workspace';
export class VaultDocuments implements MoneyDocuments {
  constructor(private readonly vault: Vault) {}
  async read(path: string): Promise<string | null> {
    const file = this.vault.getAbstractFileByPath(normalizePath(path));
    if (file === null) return null;
    if (!(file instanceof TFile)) throw new Error(`Expected a Markdown file: ${path}`);
    return this.vault.read(file);
  }
  async list(root: string): Promise<string[]> {
    const folder = this.vault.getAbstractFileByPath(normalizePath(root));
    if (folder === null) return [];
    if (!(folder instanceof TFolder)) throw new Error(`Expected a folder: ${root}`);
    const files: string[] = [];
    const visit = (current: TFolder) => {
      for (const item of current.children) {
        if (item instanceof TFolder) visit(item);
        else if (item instanceof TFile && item.extension === 'md') files.push(item.path);
      }
    };
    visit(folder);
    return files;
  }
  async create(path: string, content: string): Promise<void> {
    const normalized = normalizePath(path);
    const segments = normalized.split('/');
    segments.pop();
    let parent = '';
    for (const segment of segments) {
      parent = parent ? `${parent}/${segment}` : segment;
      const existing = this.vault.getAbstractFileByPath(parent);
      if (existing === null) await this.vault.createFolder(parent);
      else if (!(existing instanceof TFolder)) throw new Error(`Expected a folder: ${parent}`);
    }
    await this.vault.create(normalized, content);
  }
  async process(path: string, update: (content: string) => string): Promise<void> {
    const file = this.vault.getAbstractFileByPath(normalizePath(path));
    if (!(file instanceof TFile)) throw new Error(`File missing: ${path}`);
    await this.vault.process(file, update);
  }
}
