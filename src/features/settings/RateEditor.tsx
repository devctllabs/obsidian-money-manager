import { useState } from 'react';
import type { Rates } from '../../domain/rates';
import { Form } from '../ui/Form';
import { CurrencyField } from '../ui/CurrencyField';
import { CloseIcon } from '../ui/Icons';
import { InlineNotice } from '../ui/InlineNotice';
import { SaveButtonLabel, withSaveFeedback } from '../ui/SaveFeedback';
export interface RateEditorProps {
  rates: Rates | null;
  currencies: string[];
  save: (expected: Rates, next: Rates) => Promise<void>;
  proposal: (table: Rates, reference: string) => Rates;
}
export function RateEditor(props: RateEditorProps) {
  if (!props.rates)
    return (
      <section>
        <h2>Manual rates</h2>
        <InlineNotice tone="error">
          RATES.md is unavailable or invalid. Repair its Markdown to edit rates. Native amounts
          remain available.
        </InlineNotice>
      </section>
    );
  return <RateForm {...props} rates={props.rates} />;
}
function RateForm({ rates, currencies, save, proposal }: RateEditorProps & { rates: Rates }) {
  const [base, setBase] = useState(rates);
  const [values, setValues] = useState(rates.rates);
  const [reference, setReference] = useState(rates.reference);
  const [proposed, setProposed] = useState<Rates | null>(null);
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState('');
  const [extra, setExtra] = useState<string[]>([]);
  const keys = [...new Set([...Object.keys(values), ...currencies, ...extra])]
    .filter((key) => key !== base.reference)
    .sort();
  const draft = {
    reference: base.reference,
    rates: Object.fromEntries(
      Object.entries(values)
        .filter(([, value]) => value.trim() !== '')
        .map(([key, value]) => [key, value.trim()]),
    ),
  };
  const dirty =
    reference !== base.reference || JSON.stringify(draft.rates) !== JSON.stringify(base.rates);
  const commit = async (next: Rates) => {
    await withSaveFeedback(() => save(base, next));
    setBase(next);
    setValues(next.rates);
    setReference(next.reference);
    setProposed(null);
    setSaved(true);
  };
  if (proposed)
    return (
      <RebaseReview
        rates={proposed}
        commit={() => commit(proposed)}
        back={() => setProposed(null)}
      />
    );
  return (
    <section className="mm-rates-editor">
      <h2>Manual rates</h2>
      <p className="mm-muted">
        Your current valuations apply to every period. Native amounts stay unchanged.
      </p>
      <Form
        label={
          <SaveButtonLabel saved={saved}>
            {reference === base.reference ? 'Save rates' : 'Review rebase'}
          </SaveButtonLabel>
        }
        submitDisabled={!dirty}
        submit={async () => {
          if (reference !== base.reference) setProposed(proposal(draft, reference));
          else await commit(draft);
        }}
      >
        <CurrencyField
          name="reference"
          label="Reference currency"
          value={reference}
          onChange={(value) => {
            setReference(value);
            setSaved(false);
          }}
        />
        <RateTable
          reference={base.reference}
          keys={keys}
          values={values}
          query={query}
          changeQuery={setQuery}
          changeRate={(currency, value) => {
            setValues({ ...values, [currency]: value });
            setSaved(false);
          }}
          addCurrency={(currency) => {
            setExtra([...extra, currency]);
            setQuery('');
          }}
        />
      </Form>
      <p className="mm-sr-only" role="status">
        {saved ? 'Rates saved. Reports now use these current valuations.' : ''}
      </p>
    </section>
  );
}

function RebaseReview({
  rates,
  commit,
  back,
}: {
  rates: Rates;
  commit: () => Promise<void>;
  back: () => void;
}) {
  return (
    <section>
      <h2>Review rebased rates</h2>
      <Form label="Confirm rebase" submit={commit}>
        <p>
          Reference currency: {rates.reference}. Rates are rounded half-up to 18 decimal places.
          This may slightly change cross-valuations for any period.
        </p>
        <dl>
          {Object.entries(rates.rates).map(([currency, value]) => (
            <div className="mm-row" key={currency}>
              <dt>{currency}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={back}>
          Back to rates
        </button>
      </Form>
    </section>
  );
}

function RateTable({
  reference,
  keys,
  values,
  query,
  changeQuery,
  changeRate,
  addCurrency,
}: {
  reference: string;
  keys: string[];
  values: Record<string, string>;
  query: string;
  changeQuery: (query: string) => void;
  changeRate: (currency: string, value: string) => void;
  addCurrency: (currency: string) => void;
}) {
  return (
    <>
      <div className="mm-rate-table-heading">
        <span>Currency</span>
        <span>1 unit in {reference}</span>
      </div>
      {keys.length > 6 && (
        <input
          className="mm-rate-search"
          type="search"
          aria-label="Find a rate"
          placeholder="Find a currency…"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
        />
      )}
      <div className="mm-rate-table">
        {keys
          .filter((currency) => currency.toLowerCase().includes(query.toLowerCase()))
          .map((currency) => (
            <div className="mm-rate-row" key={currency}>
              <span>
                <strong>{currency}</strong>
                <small>{new Intl.DisplayNames(['en'], { type: 'currency' }).of(currency)}</small>
              </span>
              <input
                aria-label={`1 ${currency} in ${reference}`}
                name={`rate-${currency}`}
                inputMode="decimal"
                value={values[currency] ?? ''}
                placeholder="No rate"
                onChange={(event) => changeRate(currency, event.target.value)}
              />
              {values[currency] && (
                <button
                  type="button"
                  className="mm-icon-button mm-rate-remove"
                  aria-label={`Remove ${currency} rate`}
                  onClick={() => changeRate(currency, '')}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          ))}
      </div>
      <p className="mm-rate-hint">Leave a rate blank to exclude that currency from conversion.</p>
      <div className="mm-rate-add">
        {' '}
        <CurrencyField
          name="add-currency"
          label="Add currency to table"
          value=""
          excluded={[reference, ...keys]}
          placeholder="Add currency…"
          onChange={addCurrency}
        />
      </div>
    </>
  );
}
