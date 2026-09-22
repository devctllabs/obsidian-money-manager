import type { MoneyDocuments } from '../workspace/workspace';
import type { MoneyIndex } from '../indexing/money-index';
import type { Rates } from '../../domain/rates';
import { checkedDocument, validateRates } from '../../domain/validation';
import { encodeDocument } from '../../domain/workspace-document';
export class RateWorkflow {
  constructor(
    private readonly documents: MoneyDocuments,
    private readonly index: MoneyIndex,
  ) {}
  save(expected: Rates, next: Rates): Promise<void> {
    return this.index.mutate(() => {
      validateRates({ reference_currency: next.reference, rates: next.rates });
      const path = `${this.index.root}/RATES.md`;
      this.index.assertWritable(path);
      return this.documents.process(path, (text) => {
        const doc = checkedDocument(text, path, this.index.root);
        const current = validateRates(doc.managed);
        if (JSON.stringify(current) !== JSON.stringify(expected))
          throw new Error('Rates changed; reopen the current table and retry');
        doc.managed.reference_currency = next.reference;
        doc.managed.rates = next.rates;
        return encodeDocument(doc);
      });
    });
  }
}
