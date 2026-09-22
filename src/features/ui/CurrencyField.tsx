import { useId, useState } from 'react';
import { CURRENCIES } from '../../domain/currencies';
import { DialogSurface } from './DialogSurface';
import { CheckIcon, ChevronIcon, SearchIcon } from './Icons';
const names = new Intl.DisplayNames(['en'], { type: 'currency' });
export function CurrencyField({
  value,
  onChange,
  label = 'Currency',
  name = 'currency',
  excluded = [],
  placeholder = 'Choose currency',
}: {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  name?: string;
  excluded?: string[];
  placeholder?: string;
}) {
  const [current, setCurrent] = useState('USD');
  const [origin, setOrigin] = useState<HTMLButtonElement | null>(null);
  const selected = value ?? current;
  const id = useId();
  return (
    <div className="mm-field mm-currency-field">
      <label id={id}>{label}</label>
      <input type="hidden" name={name} value={selected} />
      <button
        type="button"
        className="mm-picker-trigger"
        aria-labelledby={id}
        aria-haspopup="dialog"
        aria-expanded={origin !== null}
        onClick={(event) => setOrigin(event.currentTarget)}
      >
        <span>{selected || placeholder}</span>
        <ChevronIcon />
      </button>
      {origin && (
        <DialogSurface title="Choose currency" origin={origin} close={() => setOrigin(null)}>
          <CurrencyOptions
            selected={selected}
            excluded={excluded}
            choose={(currency) => {
              setCurrent(currency);
              onChange?.(currency);
              setOrigin(null);
            }}
          />
        </DialogSurface>
      )}
    </div>
  );
}
function CurrencyOptions({
  selected,
  excluded,
  choose,
}: {
  selected: string;
  excluded: string[];
  choose: (currency: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const id = useId();
  const options = Object.keys(CURRENCIES).filter(
    (code) =>
      !excluded.includes(code) &&
      `${code} ${names.of(code) ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const position = Math.min(active, Math.max(0, options.length - 1));
  return (
    <>
      <div className="mm-search">
        <SearchIcon />
        <input
          type="search"
          aria-label="Search currencies"
          placeholder="Search by code or currency name…"
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls={id}
          aria-activedescendant={options.length ? `${id}-${position}` : undefined}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              const next =
                (position + (event.key === 'ArrowDown' ? 1 : -1) + options.length) %
                Math.max(1, options.length);
              setActive(next);
              event.currentTarget.ownerDocument
                .getElementById(`${id}-${next}`)
                ?.scrollIntoView({ block: 'nearest' });
            }
            if (event.key === 'Enter' && options[position]) {
              event.preventDefault();
              choose(options[position]);
            }
          }}
        />
      </div>
      <ul className="mm-picker-options" id={id} role="listbox" aria-label="Currencies">
        {options.map((code, index) => (
          <li
            role="option"
            id={`${id}-${index}`}
            aria-selected={index === position}
            key={code}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => choose(code)}
          >
            <strong>{code}</strong>
            <span>{names.of(code)}</span>
            {code === selected && <CheckIcon />}
          </li>
        ))}
      </ul>
      {!options.length && (
        <p role="status">No currencies match “{query}”. Try a code such as USD.</p>
      )}
    </>
  );
}
