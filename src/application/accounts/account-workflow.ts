import type { MoneyDocuments } from '../workspace/workspace';
import type { MoneyIndex } from '../indexing/money-index';
import type { Account } from '../../domain/entry';
import { encodeDocument, mapping } from '../../domain/workspace-document';
import { checkedDocument, validateAccount } from '../../domain/validation';
import { minor } from '../../domain/money';
import { EntryWorkflow } from '../entries/entry-workflow';

interface AccountDraft {
  key: string;
  name: string;
  currency: string;
}
export class AccountWorkflow {
  constructor(
    private readonly documents: MoneyDocuments,
    private readonly index: MoneyIndex,
    private readonly context: { root: string; today: () => string; id: () => string },
  ) {}
  async create(
    request: AccountDraft & { observed: string },
  ): Promise<{ checkpointSaved: boolean }> {
    validateAccount(request.key, request);
    const amount = minor(request.observed, request.currency);
    await this.index.mutate(() =>
      this.change((accounts) => {
        if (Object.prototype.hasOwnProperty.call(accounts, request.key))
          throw new Error('Account key already exists');
        accounts[request.key] = { name: request.name.trim(), currency: request.currency };
      }),
    );
    if (amount === 0n) return { checkpointSaved: true };
    try {
      await this.retryCheckpoint(request.key, request.observed);
      return { checkpointSaved: true };
    } catch {
      return { checkpointSaved: false };
    }
  }
  retryCheckpoint(key: string, observed: string) {
    return new EntryWorkflow(this.documents, this.index).create({
      id: this.context.id(),
      type: 'balance_checkpoint',
      account: key,
      date: this.context.today(),
      balance: observed,
    });
  }
  edit(key: string, expected: Account, next: AccountDraft): Promise<void> {
    return this.index.mutate(() => {
      validateAccount(next.key, next);
      if (key !== next.key || expected.currency !== next.currency) this.assertUnreferenced(key);
      return this.change((accounts) => {
        this.assertExpected(accounts, key, expected);
        if (key !== next.key && Object.prototype.hasOwnProperty.call(accounts, next.key))
          throw new Error('Account key already exists');
        const record = {
          ...mapping(accounts[key]),
          name: next.name.trim(),
          currency: next.currency,
        };
        delete accounts[key];
        accounts[next.key] = record;
      });
    });
  }
  delete(key: string, expected: Account): Promise<void> {
    return this.index.mutate(() => {
      this.assertUnreferenced(key);
      return this.change((accounts) => {
        this.assertExpected(accounts, key, expected);
        delete accounts[key];
      });
    });
  }
  private assertUnreferenced(key: string) {
    const snapshot = this.index.getSnapshot();
    const references = snapshot.entries
      .filter((row) => row.entry.account === key)
      .map((row) => row.path);
    const uncertain = snapshot.diagnostics.filter((item) => item.monetary).map((item) => item.path);
    const paths = [...new Set([...references, ...uncertain])];
    if (paths.length) throw new Error(`Account references cannot be cleared: ${paths.join(', ')}`);
  }
  private assertExpected(accounts: Record<string, unknown>, key: string, expected: Account) {
    if (JSON.stringify(accounts[key]) !== JSON.stringify(expected))
      throw new Error('Account changed; reopen and retry');
  }
  private change(update: (accounts: Record<string, unknown>) => void) {
    const path = `${this.index.root}/ACCOUNTS.md`;
    this.index.assertWritable(path);
    return this.documents.process(path, (text) => {
      const doc = checkedDocument(text, path, this.index.root);
      const accounts = mapping(doc.managed.accounts);
      for (const [key, raw] of Object.entries(accounts)) validateAccount(key, raw);
      update(accounts);
      return encodeDocument(doc);
    });
  }
}
