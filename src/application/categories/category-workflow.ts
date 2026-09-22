import type { MoneyDocuments } from '../workspace/workspace';
import type { MoneyIndex } from '../indexing/money-index';
import type { Category, Flow } from '../../domain/entry';
import { checkedDocument, validateCategory } from '../../domain/validation';
import { encodeDocument, mapping } from '../../domain/workspace-document';
export class CategoryWorkflow {
  constructor(
    private readonly documents: MoneyDocuments,
    private readonly index: MoneyIndex,
  ) {}
  create(flow: Flow, key: string, category: Category): Promise<void> {
    return this.index.mutate(() =>
      this.change(flow, (categories) => {
        validateCategory(key, category);
        if (Object.prototype.hasOwnProperty.call(categories, key))
          throw new Error('Category key already exists');
        categories[key] = category;
      }),
    );
  }
  edit(
    flow: Flow,
    request: { key: string; expected: Category; nextKey: string; category: Category },
  ): Promise<void> {
    return this.index.mutate(() => {
      const { key, expected, nextKey, category } = request;
      validateCategory(nextKey, category);
      if (key !== nextKey) this.assertUnreferenced(flow, key);
      return this.change(flow, (categories) => {
        this.assertExpected(categories, key, expected);
        if (key !== nextKey && Object.prototype.hasOwnProperty.call(categories, nextKey))
          throw new Error('Category key already exists');
        const record = { ...mapping(categories[key]), ...category };
        delete categories[key];
        categories[nextKey] = record;
      });
    });
  }
  delete(flow: Flow, key: string, expected: Category): Promise<void> {
    return this.index.mutate(() => {
      this.assertUnreferenced(flow, key);
      return this.change(flow, (categories) => {
        this.assertExpected(categories, key, expected);
        delete categories[key];
      });
    });
  }
  private assertUnreferenced(flow: Flow, key: string) {
    const snapshot = this.index.getSnapshot();
    const references = snapshot.entries
      .filter((row) => row.entry.type === flow && row.entry.category === key)
      .map((row) => row.path);
    const uncertain = snapshot.diagnostics.filter((item) => item.monetary).map((item) => item.path);
    const paths = [...new Set([...references, ...uncertain])];
    if (paths.length) throw new Error(`Category references cannot be cleared: ${paths.join(', ')}`);
  }
  private assertExpected(categories: Record<string, unknown>, key: string, expected: Category) {
    if (JSON.stringify(categories[key]) !== JSON.stringify(expected))
      throw new Error('Category changed; reopen and retry');
  }
  private change(flow: Flow, update: (categories: Record<string, unknown>) => void) {
    const path = `${this.index.root}/CATEGORIES.md`;
    this.index.assertWritable(path);
    return this.documents.process(path, (text) => {
      const doc = checkedDocument(text, path, this.index.root);
      const categories = mapping(doc.managed.categories);
      for (const namespace of ['expense', 'income'])
        for (const [key, raw] of Object.entries(mapping(categories[namespace])))
          validateCategory(key, raw);
      update(mapping(categories[flow]));
      return encodeDocument(doc);
    });
  }
}
