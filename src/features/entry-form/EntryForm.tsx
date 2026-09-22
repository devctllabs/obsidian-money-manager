import { CategoryPicker } from './CategoryPicker';
import { useEffect, useRef, useState } from 'react';
import { Form, field } from '../ui/Form';
import type { Account, Category, Entry, Flow } from '../../domain/entry';
import { AccountPicker } from './AccountPicker';
import { CalendarPicker, type PickerMode } from '../ui/CalendarPicker';
export interface EntryFormProps {
  pickerMode: PickerMode;
  accounts: Record<string, Account>;
  categories: Record<Flow, Record<string, Category>>;
  today: string;
  initial?: Entry;
  save: (draft: {
    type: Flow;
    account: string;
    amount: string;
    date: string;
    description: string;
    category?: string;
    newCategory?: string;
  }) => Promise<void>;
  close: () => void;
  goAccounts: () => void;
}
export function EntryForm(props: EntryFormProps) {
  if (!Object.keys(props.accounts).length)
    return (
      <section>
        <p>Add an account before recording an entry. Its currency determines the native amount.</p>
        <button
          onClick={() => {
            props.close();
            props.goAccounts();
          }}
        >
          Go to accounts
        </button>
      </section>
    );
  return <EntryEditor {...props} />;
}
function initialValues(props: EntryFormProps) {
  const entry = {
    type: 'expense',
    account: Object.keys(props.accounts)[0]!,
    category: '',
    amount: '',
    date: props.today,
    description: '',
    ...props.initial,
  };
  const flow: Flow = entry.type === 'income' ? 'income' : 'expense';
  const category = entry.category;
  return {
    flow,
    account: entry.account,
    category,
    amount: entry.amount,
    date: entry.date,
    description: entry.description,
  };
}
function EntryEditor({
  accounts,
  categories,
  today,
  initial,
  save,
  close,
  ...rest
}: EntryFormProps) {
  const defaults = initialValues({ accounts, categories, today, initial, save, close, ...rest });
  const [flow, setFlow] = useState(defaults.flow);
  const [account, setAccount] = useState(defaults.account);
  const [category, setCategory] = useState(defaults.category);
  const [date, setDate] = useState(defaults.date);
  const amountRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    amountRef.current?.focus();
  }, []);
  const currency = accounts[account]!.currency;
  const accountOptions = availableAccounts(accounts, initial);
  const changeFlow = (next: Flow) => {
    setFlow(next);
    setCategory('');
  };
  return (
    <Form
      label="Save entry"
      close={close}
      submit={async (data) => {
        await save({
          type: flow,
          account,
          amount: field(data, 'amount'),
          date: field(data, 'date'),
          description: field(data, 'description'),
          ...categorySelection(categories[flow], category),
        });
        close();
      }}
    >
      <div className="mm-entry-fields">
        <label className="mm-entry-amount">
          Amount ({currency})
          <input
            ref={amountRef}
            name="amount"
            inputMode="decimal"
            required
            defaultValue={defaults.amount}
          />
        </label>
        <FlowInput pickerMode={rest.pickerMode} flow={flow} change={changeFlow} />
        <AccountInput
          pickerMode={rest.pickerMode}
          accounts={accountOptions}
          value={account}
          change={setAccount}
        />
        <CalendarPicker
          label="Date"
          mode="date"
          pickerMode={rest.pickerMode}
          value={date}
          change={setDate}
          name="date"
          required
          max={today}
        />
        <CategoryInput
          categories={categories[flow]}
          value={category}
          change={setCategory}
          flow={flow}
        />
        <label className="mm-field-wide">
          Description (optional)
          <textarea name="description" defaultValue={defaults.description} />
        </label>
      </div>
    </Form>
  );
}

function FlowInput({
  pickerMode,
  flow,
  change,
}: {
  pickerMode: PickerMode;
  flow: Flow;
  change: (flow: Flow) => void;
}) {
  if (pickerMode === 'native')
    return (
      <label>
        Entry type
        <select value={flow} onChange={(event) => change(event.target.value as Flow)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </label>
    );
  return (
    <div className="mm-field mm-flow-field">
      <span>Entry type</span>
      <div className="mm-flow-segments" role="group" aria-label="Entry type">
        <button
          type="button"
          aria-label="− Expense"
          aria-pressed={flow === 'expense'}
          onClick={() => change('expense')}
        >
          <span>−</span>Expense
        </button>
        <button
          type="button"
          aria-label="+ Income"
          aria-pressed={flow === 'income'}
          onClick={() => change('income')}
        >
          <span>+</span>Income
        </button>
      </div>
    </div>
  );
}

function AccountInput({
  pickerMode,
  accounts,
  value,
  change,
}: {
  pickerMode: PickerMode;
  accounts: Array<[string, Account]>;
  value: string;
  change: (account: string) => void;
}) {
  if (pickerMode === 'native')
    return (
      <label>
        Account
        <select value={value} onChange={(event) => change(event.target.value)}>
          <AccountOptions accounts={accounts} />
        </select>
      </label>
    );
  return <AccountPicker accounts={accounts} value={value} change={change} />;
}

function availableAccounts(
  accounts: Record<string, Account>,
  initial?: Entry,
): Array<[string, Account]> {
  return Object.entries(accounts).filter(
    ([, value]) => !initial || value.currency === accounts[initial.account]?.currency,
  );
}
function AccountOptions({ accounts }: { accounts: Array<[string, Account]> }) {
  return accounts.map(([key, value]) => (
    <option key={key} value={key}>
      {value.name} · {value.currency}
    </option>
  ));
}
function categorySelection(categories: Record<string, Category>, value: string) {
  const matching = Object.entries(categories).find(
    ([key, category]) => category.name === value.trim() || key === value.trim(),
  );
  return {
    category: matching?.[0],
    newCategory: !matching && value.trim() ? value.trim() : undefined,
  };
}
function CategoryInput({
  categories,
  value,
  change,
  flow,
}: {
  categories: Record<string, Category>;
  value: string;
  change: (value: string) => void;
  flow: Flow;
}) {
  const { newCategory } = categorySelection(categories, value);
  return (
    <>
      <CategoryPicker categories={categories} value={value} change={change} flow={flow} />
      {newCategory && (
        <p className="mm-muted">
          Create “{newCategory}” as an {flow} category when saving. No color is assigned.
        </p>
      )}
    </>
  );
}
