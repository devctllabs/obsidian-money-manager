import { useState } from 'react';
import { ActionMenu, MenuAction } from '../ui/ActionMenu';
import { ChevronIcon } from '../ui/Icons';
import type { LocatedEntry } from '../../domain/entry';
const PAGE_SIZE = 10;
export function BalanceHistory({
  rows,
  currency,
  active,
  edit,
  remove,
}: {
  rows: LocatedEntry[];
  currency: string;
  active?: string;
  edit: (row: LocatedEntry) => void;
  remove: (row: LocatedEntry) => void;
}) {
  const [page, setPage] = useState(0);
  const lastPage = Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1);
  const current = Math.min(page, lastPage);
  const offset = current * PAGE_SIZE;
  const visible = rows.slice(offset, offset + PAGE_SIZE);
  return (
    <details className="mm-balance-history">
      <summary>
        <ChevronIcon direction="right" />
        <span>Balance history</span>
        <span className="mm-history-count">{rows.length}</span>
      </summary>
      <p className="mm-muted">
        Saved balance reconciliations (checkpoints). Your current balance starts from the latest
        one, then includes entries recorded after it. Earlier entries stay in reports.
      </p>
      {!rows.length && (
        <p>
          No reconciliations yet. Use Reconcile balance to save the balance you see in this account.
        </p>
      )}
      {visible.map((row) => (
        <div className="mm-history-row" key={row.entry.id}>
          <div>
            <time dateTime={row.entry.date}>{row.entry.date}</time>
            <p className="mm-muted">
              {row.entry.reason || 'Observed account balance'}
              {row.entry.id === active && (
                <span className="mm-history-active">Current starting point</span>
              )}
            </p>
          </div>
          <span className="mm-amount">
            {row.entry.balance} {currency}
          </span>
          <ActionMenu label={`More actions for checkpoint ${row.entry.date}`}>
            <MenuAction onClick={() => edit(row)}>Edit checkpoint…</MenuAction>
            <MenuAction destructive onClick={() => remove(row)}>
              Delete checkpoint…
            </MenuAction>
          </ActionMenu>
        </div>
      ))}
      {rows.length > PAGE_SIZE && (
        <nav className="mm-pagination mm-balance-pagination" aria-label="Balance history pages">
          <span>
            {offset + 1}–{Math.min(offset + PAGE_SIZE, rows.length)} of {rows.length} checkpoints
          </span>
          <button
            className="mm-icon-button"
            aria-label="Previous balance checkpoints"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            className="mm-icon-button"
            aria-label="Next balance checkpoints"
            disabled={current === lastPage}
            onClick={() => setPage(current + 1)}
          >
            <ChevronIcon direction="right" />
          </button>
        </nav>
      )}
    </details>
  );
}
