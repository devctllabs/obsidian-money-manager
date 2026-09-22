import { Accent } from '../ui/Accent';
import { EntryForm } from '../entry-form/EntryForm';
import { CategoryForm } from '../settings/CategoryForm';
import { CategoryWorkflow } from '../../application/categories/category-workflow';
import type { Flow } from '../../domain/entry';
import { v7 } from 'uuid';
import type { ReactNode } from 'react';
import type { WorkspaceConnection } from '../../application/workspace/connection';
import type { SettingsWorkflow } from '../../application/workspace/settings';
import type { MoneyDocuments } from '../../application/workspace/workspace';
import { WorkspaceWorkflow } from '../../application/workspace/workspace';
import { AccountWorkflow } from '../../application/accounts/account-workflow';
import { EntryWorkflow } from '../../application/entries/entry-workflow';
import { AccountForm } from '../accounts/AccountForm';
import { CheckpointForm } from '../accounts/CheckpointForm';
import { Confirm } from '../ui/Confirm';
import type { LocatedEntry } from '../../domain/entry';
import { formatMinor, minor } from '../../domain/money';
import type { PickerMode } from '../ui/CalendarPicker';

export function localToday() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
export interface ShellHost {
  pickerMode: PickerMode;
  folders?: () => string[];
  today?: () => string;
  dialog: (title: string, render: (close: () => void) => ReactNode) => void;
  openDocument: (path: string) => void;
}
export class ShellController {
  configured: boolean;
  goAccounts: () => void = () => undefined;
  constructor(
    readonly host: ShellHost,
    readonly documents: MoneyDocuments,
    readonly connection: WorkspaceConnection,
    readonly settings: SettingsWorkflow,
  ) {
    this.configured = false;
  }
  private today() {
    return (this.host.today ?? localToday)();
  }
  get accounts() {
    return new AccountWorkflow(this.documents, this.connection.index, {
      root: this.connection.index.root,
      today: () => this.today(),
      id: v7,
    });
  }
  get checkpoints() {
    return new EntryWorkflow(this.documents, this.connection.index);
  }
  dialog(title: string, render: (close: () => void) => ReactNode) {
    this.host.dialog(title, (close) => (
      <Accent appearance={this.settings.current.appearance}>{render(close)}</Accent>
    ));
  }

  async setup(root: string, reference: string) {
    await this.connection.index.mutate(() =>
      new WorkspaceWorkflow(this.documents).setup(root, reference),
    );
    await this.connect(root);
  }
  async connect(root: string) {
    await this.connection.connect(root);
    this.configured = true;
    await this.connection.index.refresh();
  }
  createAccount = () => {
    const workflow = this.accounts;
    this.dialog('Add account', (close) => (
      <AccountForm
        save={(draft) => workflow.create(draft)}
        retry={(key, observed) => workflow.retryCheckpoint(key, observed)}
        close={close}
      />
    ));
  };
  editAccount = (key: string) => {
    const account = this.connection.getSnapshot().accounts[key]!;
    const workflow = this.accounts;
    this.dialog('Edit account', (close) => (
      <AccountForm
        initial={{ key, name: account.name, currency: account.currency }}
        save={async (draft) => {
          await workflow.edit(key, account, draft);
          return { checkpointSaved: true };
        }}
        retry={() => Promise.resolve()}
        close={close}
      />
    ));
  };
  deleteAccount = (key: string) => {
    const account = this.connection.getSnapshot().accounts[key]!;
    const workflow = this.accounts;
    this.dialog('Delete account', (close) => (
      <Confirm
        close={close}
        message={
          `Delete ${account.name}? Referenced accounts are protected. ` +
          'Recovery depends on your vault recovery or backup.'
        }
        action={() => workflow.delete(key, account)}
      />
    ));
  };
  reconcile = (key: string, row?: LocatedEntry) => {
    const snapshot = this.connection.getSnapshot();
    const calculated = snapshot.balances[key]!;
    const currency = snapshot.accounts[key]!.currency;
    const workflow = this.checkpoints;
    this.dialog(row ? 'Edit balance checkpoint' : 'Reconcile balance', (close) => (
      <CheckpointForm
        accounts={snapshot.accounts}
        account={key}
        calculated={calculated}
        today={this.today()}
        initial={row?.entry}
        close={close}
        difference={(observed) =>
          formatMinor(minor(observed, currency) - minor(calculated, currency), currency)
        }
        save={(draft) => {
          const entry = {
            ...row?.entry,
            ...draft,
            id: row?.entry.id ?? v7(),
            type: 'balance_checkpoint' as const,
          };
          return row ? workflow.edit(row, entry) : workflow.create(entry);
        }}
      />
    ));
  };
  deleteCheckpoint = (row: LocatedEntry) => {
    const workflow = this.checkpoints;
    this.dialog('Delete balance checkpoint', (close) => (
      <Confirm
        close={close}
        message={
          'This recalculates the current balance. The Month document and your notes remain. ' +
          'Restore deleted entries through vault recovery or your backup.'
        }
        action={() => workflow.delete(row)}
      />
    ));
  };
  addEntry = (row?: LocatedEntry) => {
    if (row?.entry.type === 'balance_checkpoint') {
      this.reconcile(row.entry.account, row);
      return;
    }
    const snapshot = this.connection.getSnapshot();
    const workflow = this.checkpoints;
    const identity = row?.entry.id ?? v7();
    this.dialog(row ? 'Edit entry' : 'Add entry', (close) => (
      <EntryForm
        pickerMode={this.host.pickerMode}
        accounts={snapshot.accounts}
        categories={snapshot.categories}
        today={this.today()}
        initial={row?.entry}
        close={close}
        goAccounts={this.goAccounts}
        save={(draft) => {
          const { newCategory, ...fields } = draft;
          const entry = { ...row?.entry, ...fields, id: identity };
          if (newCategory) return workflow.createWithCategory(entry, newCategory, row);
          return row ? workflow.edit(row, entry) : workflow.create(entry);
        }}
      />
    ));
  };
  deleteEntry = (row: LocatedEntry) => {
    if (row.entry.type === 'balance_checkpoint') {
      this.deleteCheckpoint(row);
      return;
    }
    const snapshot = this.connection.getSnapshot();
    const currency = snapshot.accounts[row.entry.account]?.currency ?? '';
    const description =
      row.entry.description || (row.entry.type === 'income' ? 'Income' : 'Expense');
    const detail = `${description} · ${row.entry.amount} ${currency} · ${row.entry.date}`;
    const workflow = this.checkpoints;
    this.dialog('Delete entry', (close) => (
      <Confirm
        close={close}
        label="Delete entry"
        detail={detail}
        message={
          'This removes the entry and recalculates balances and reports. Your Month document ' +
          'and notes stay. To restore it, use vault recovery or a backup.'
        }
        action={() => workflow.delete(row)}
      />
    ));
  };
  editCategory = (flow: Flow, key?: string, suggestedName?: string) => {
    const initial = key ? this.connection.getSnapshot().categories[flow][key] : undefined;
    const workflow = new CategoryWorkflow(this.documents, this.connection.index);
    this.dialog(initial ? 'Edit category' : 'Add category', (close) => (
      <CategoryForm
        flow={flow}
        suggestedName={suggestedName}
        initial={initial && key ? { ...initial, key } : undefined}
        close={close}
        save={(nextKey, category) =>
          initial && key
            ? workflow.edit(flow, { key, expected: initial, nextKey, category })
            : workflow.create(flow, nextKey, category)
        }
      />
    ));
  };
  deleteCategory = (flow: Flow, key: string) => {
    const initial = this.connection.getSnapshot().categories[flow][key]!;
    const workflow = new CategoryWorkflow(this.documents, this.connection.index);
    this.dialog('Delete category', (close) => (
      <Confirm
        close={close}
        message={
          `Delete ${initial.name}? Referenced categories are protected. ` +
          'Recovery depends on your vault backup.'
        }
        action={() => workflow.delete(flow, key, initial)}
      />
    ));
  };
  openDocument = (path: string) => this.host.openDocument(path);
}
