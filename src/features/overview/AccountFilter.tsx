import { useState } from 'react';
import type { Account } from '../../domain/entry';
import { DialogSurface } from '../ui/DialogSurface';
import { FilterIcon, ChevronIcon, SearchIcon } from '../ui/Icons';
export function AccountFilter({
  accounts,
  selected,
  change,
}: {
  accounts: Record<string, Account>;
  selected: string[] | null;
  change: (keys: string[] | null) => void;
}) {
  const [origin, setOrigin] = useState<HTMLButtonElement | null>(null);
  const [query, setQuery] = useState('');
  const keys = selected ?? Object.keys(accounts);
  const matches = Object.entries(accounts).filter(([, account]) =>
    `${account.name} ${account.currency}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <button
        className="mm-filter-trigger"
        aria-haspopup="dialog"
        aria-expanded={origin !== null}
        onClick={(event) => {
          setQuery('');
          setOrigin(event.currentTarget);
        }}
      >
        <FilterIcon />
        Accounts: {selected === null ? 'All' : keys.length}
        <ChevronIcon />
      </button>
      {origin && (
        <DialogSurface title="Include accounts" origin={origin} close={() => setOrigin(null)}>
          <div className="mm-search">
            <SearchIcon />
            <input
              type="search"
              aria-label="Search accounts"
              placeholder="Search accounts…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="mm-picker-actions">
            <button type="button" className="mm-quiet" onClick={() => change(null)}>
              All accounts
            </button>
            <button type="button" className="mm-quiet" onClick={() => change([])}>
              Clear selection
            </button>
            <span>{keys.length} selected</span>
          </div>
          <div className="mm-account-options">
            {matches.map(([key, account]) => (
              <label className="mm-account-option" key={key}>
                <input
                  type="checkbox"
                  checked={keys.includes(key)}
                  onChange={(event) =>
                    change(
                      event.target.checked ? [...keys, key] : keys.filter((value) => value !== key),
                    )
                  }
                />
                <span>{account.name}</span>
                <small>{account.currency}</small>
              </label>
            ))}
            {!matches.length && <p>No accounts match.</p>}
          </div>
          <div className="mm-dialog-actions">
            <button className="mod-cta" onClick={() => setOrigin(null)}>
              Done
            </button>
          </div>
        </DialogSurface>
      )}
    </>
  );
}
