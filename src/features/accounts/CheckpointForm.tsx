import { useState } from 'react';
import type { Account, Entry } from '../../domain/entry';
import { Form, field } from '../ui/Form';
export interface CheckpointFormProps {
  accounts: Record<string, Account>;
  account: string;
  calculated: string;
  today: string;
  initial?: Entry;
  difference: (observed: string) => string;
  save: (entry: {
    account: string;
    balance: string;
    date: string;
    reason: string;
  }) => Promise<void>;
  close: () => void;
}
export function CheckpointForm({
  accounts,
  account,
  calculated,
  today,
  initial,
  difference,
  save,
  close,
}: CheckpointFormProps) {
  const [observed, setObserved] = useState(initial?.balance ?? calculated);
  let delta = 'Enter a valid balance';
  try {
    delta = difference(observed);
  } catch {
    /* The form reports validation on submission. */
  }
  const currency = accounts[account]?.currency;
  return (
    <Form
      label="Save checkpoint"
      close={close}
      submit={async (data) => {
        await save({
          account: field(data, 'account'),
          balance: observed,
          date: field(data, 'date'),
          reason: field(data, 'reason'),
        });
        close();
      }}
    >
      <div className="mm-entry-fields">
        <p className="mm-field-wide">
          Calculated balance{' '}
          <strong className="mm-amount">
            {calculated} {currency}
          </strong>
        </p>
        <label>
          Account
          <select name="account" defaultValue={account}>
            {Object.entries(accounts)
              .filter(([, value]) => value.currency === currency)
              .map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
          </select>
        </label>
        <label className="mm-entry-amount">
          Observed balance ({currency})
          <input
            name="balance"
            required
            inputMode="decimal"
            value={observed}
            onChange={(event) => setObserved(event.target.value)}
          />
        </label>
        <p className="mm-field-wide" aria-live="polite">
          Difference{' '}
          <span className="mm-amount">
            {delta} {currency}
          </span>
        </p>
        <label>
          Date
          <input
            type="date"
            name="date"
            required
            max={today}
            defaultValue={initial?.date ?? today}
          />
        </label>
        <label className="mm-field-wide">
          Reason (optional)
          <textarea name="reason" defaultValue={initial?.reason ?? ''} />
        </label>
        <p className="mm-muted">
          This absolute checkpoint recalculates the current balance. Earlier entries remain in
          period reports.
        </p>
      </div>
    </Form>
  );
}
