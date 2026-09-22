import { useId, useState } from 'react';
import type { Account } from '../../domain/entry';
import { DialogSurface } from '../ui/DialogSurface';
import { CheckIcon, ChevronIcon, SearchIcon } from '../ui/Icons';

export function AccountPicker({
  accounts,
  value,
  change,
}: {
  accounts: Array<[string, Account]>;
  value: string;
  change: (account: string) => void;
}) {
  const [origin, setOrigin] = useState<HTMLButtonElement | null>(null);
  const labelId = useId();
  const account = accounts.find(([key]) => key === value)?.[1];
  return (
    <div className="mm-field mm-account-picker">
      <label id={labelId}>Account</label>
      <button
        type="button"
        className="mm-picker-trigger"
        aria-labelledby={labelId}
        aria-haspopup="dialog"
        aria-expanded={origin !== null}
        onClick={(event) => setOrigin(event.currentTarget)}
      >
        <span>
          {account?.name} · {account?.currency}
        </span>
        <ChevronIcon />
      </button>
      {origin && (
        <AccountDialog
          origin={origin}
          accounts={accounts}
          value={value}
          close={() => setOrigin(null)}
          change={(next) => {
            change(next);
            setOrigin(null);
          }}
        />
      )}
    </div>
  );
}

function AccountDialog({
  origin,
  accounts,
  value,
  change,
  close,
}: {
  origin: HTMLButtonElement;
  accounts: Array<[string, Account]>;
  value: string;
  change: (account: string) => void;
  close: () => void;
}) {
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState(() =>
    Math.max(
      0,
      accounts.findIndex(([key]) => key === value),
    ),
  );
  const matches = accounts.filter(([, account]) =>
    `${account.name} ${account.currency}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const active = Math.min(position, Math.max(0, matches.length - 1));
  return (
    <DialogSurface title="Choose account" origin={origin} close={close}>
      <div className="mm-search">
        <SearchIcon />
        <input
          type="search"
          aria-label="Find an account"
          placeholder="Find an account…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPosition(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setPosition(Math.min(active + 1, matches.length - 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setPosition(Math.max(active - 1, 0));
            }
            if (event.key === 'Enter' && matches[active]) {
              event.preventDefault();
              change(matches[active][0]);
            }
          }}
        />
      </div>
      <ul
        className="mm-picker-options mm-account-picker-options"
        role="listbox"
        aria-label="Accounts"
      >
        {matches.map(([key, account], index) => (
          <li
            key={key}
            role="option"
            aria-selected={index === active}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => change(key)}
          >
            <span className="mm-account-picker-code">{account.currency}</span>
            <strong>{account.name}</strong>
            {key === value && <CheckIcon />}
          </li>
        ))}
      </ul>
      {!matches.length && (
        <p className="mm-muted" role="status">
          No accounts match this search.
        </p>
      )}
    </DialogSurface>
  );
}
