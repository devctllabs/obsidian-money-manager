import { precision } from '../../domain/money';
import { decodeDocument, newDocument, normalizeRoot } from '../../domain/workspace-document';

export interface MoneyDocuments {
  read(path: string): Promise<string | null>;
  list(root: string): Promise<string[]>;
  create(path: string, content: string): Promise<void>;
  process(path: string, update: (content: string) => string): Promise<void>;
}

export class WorkspaceWorkflow {
  constructor(private readonly documents: MoneyDocuments) {}
  async setup(root: string, reference: string): Promise<void> {
    root = normalizeRoot(root);
    precision(reference);
    const catalogs = {
      ACCOUNTS: { type: 'accounts', accounts: {} },
      CATEGORIES: { type: 'categories', categories: { expense: {}, income: {} } },
      RATES: { type: 'rates', reference_currency: reference, rates: {} },
    };
    const missing: Array<[string, string]> = [];
    for (const [name, fields] of Object.entries(catalogs)) {
      const path = `${root}/${name}.md`;
      const content = newDocument(fields);
      const existing = await this.documents.read(path);
      if (existing === null) missing.push([path, content]);
      else {
        try {
          const current = decodeDocument(existing).managed;
          if (
            !Object.entries(decodeDocument(content).managed).every(
              ([key, value]) => JSON.stringify(current[key]) === JSON.stringify(value),
            )
          )
            throw new Error('Expected compatible empty catalog');
        } catch (error) {
          throw new Error(`${path}: ${String(error)}`);
        }
      }
    }
    for (const [path, content] of missing) await this.documents.create(path, content);
  }
}
