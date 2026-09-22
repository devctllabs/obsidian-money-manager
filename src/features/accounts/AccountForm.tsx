import { useState } from 'react';
import { normalizeKey } from '../../domain/validation';
import { Form, field } from '../ui/Form';
import { CurrencyField } from '../ui/CurrencyField';
import { InlineNotice } from '../ui/InlineNotice';
interface Draft {
  key: string;
  name: string;
  currency: string;
  observed: string;
}
export interface AccountFormProps {
  save: (draft: Draft) => Promise<{ checkpointSaved: boolean }>;
  retry: (key: string, observed: string) => Promise<void>;
  close: () => void;
  initial?: Omit<Draft, 'observed'>;
}
export function AccountForm({ save, retry, close, initial }: AccountFormProps) {
  const [partial, setPartial] = useState<Draft | null>(null);
  const [name, setName] = useState(initial?.name ?? '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'USD');
  const [key, setKey] = useState(initial?.key ?? '');
  if (partial)
    return (
      <Form
        label="Retry checkpoint"
        close={close}
        submit={async () => {
          await retry(partial.key, partial.observed);
          close();
        }}
      >
        <InlineNotice tone="warning" role="alert">
          Account saved. Its checkpoint could not be saved. Retry to record {partial.observed}{' '}
          {partial.currency}; your account will not be created again.
        </InlineNotice>
      </Form>
    );
  return (
    <Form
      label={initial ? 'Save account' : 'Create account'}
      close={close}
      submit={async (data) => {
        const draft = {
          key: field(data, 'key') || normalizeKey(name),
          name,
          currency: field(data, 'currency'),
          observed: field(data, 'observed') || '0',
        };
        const result = await save(draft);
        if (result.checkpointSaved) close();
        else setPartial(draft);
      }}
    >
      <label>
        Name
        <input
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        Key
        <input
          name="key"
          value={key}
          placeholder={normalizeKey(name)}
          onChange={(event) => setKey(event.target.value)}
        />
      </label>
      <p className="mm-muted">
        The key identifies this account in Markdown. Referenced keys and currencies cannot change.
      </p>
      {!initial ? (
        <div className="mm-account-initial-fields">
          <label>
            Observed balance
            <input name="observed" inputMode="decimal" placeholder="0.00" />
          </label>
          <CurrencyField value={currency} onChange={setCurrency} />
        </div>
      ) : (
        <CurrencyField value={currency} onChange={setCurrency} />
      )}
    </Form>
  );
}
