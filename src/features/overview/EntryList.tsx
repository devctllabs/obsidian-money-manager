import { useState, type CSSProperties } from 'react';
import { ChevronIcon } from '../ui/Icons';
import { ActionMenu, MenuAction } from '../ui/ActionMenu';
import type { EntryRow } from '../../application/indexing/entry-rows';
import type { LocatedEntry } from '../../domain/entry';
export function EntryList({
  rows,
  edit,
  remove,
}: {
  rows: EntryRow[];
  edit: (row: LocatedEntry) => void;
  remove: (row: LocatedEntry) => void;
}) {
  const [page, setPage] = useState(0);
  const current = Math.min(page, Math.max(0, Math.ceil(rows.length / 20) - 1));
  if (!rows.length) return <p className="mm-empty">No entries in this period.</p>;
  return (
    <>
      <ol className="mm-entries" aria-label="Ledger entries">
        {rows.slice(current * 20, current * 20 + 20).map((item) => (
          <li className="mm-entry" key={item.id}>
            <time dateTime={item.date}>{formatDay(item.date)}</time>
            <div>
              <strong>{item.label}</strong>
              <div className="mm-entry-meta">
                <span>{item.account}</span>
                {item.category && (
                  <span
                    className={`mm-category-chip${item.categoryColor ? ' is-colored' : ''}`}
                    style={
                      item.categoryColor
                        ? ({ '--mm-category-color': item.categoryColor } as CSSProperties)
                        : undefined
                    }
                  >
                    {item.category}
                  </span>
                )}
              </div>
            </div>
            <span className="mm-amount">{item.amount}</span>
            <div className="mm-actions">
              <ActionMenu label={`More actions for ${item.label}`}>
                <MenuAction onClick={() => edit(item.row)}>Edit entry…</MenuAction>
                <MenuAction destructive onClick={() => remove(item.row)}>
                  Delete entry…
                </MenuAction>
              </ActionMenu>
            </div>
          </li>
        ))}
      </ol>
      {rows.length > 20 && (
        <nav className="mm-pagination mm-entry-pagination" aria-label="Entry pages">
          <span>
            {current * 20 + 1}–{Math.min(current * 20 + 20, rows.length)} of {rows.length} entries
          </span>
          <button
            className="mm-icon-button"
            aria-label="Previous entries"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            className="mm-icon-button"
            aria-label="Next entries"
            disabled={(current + 1) * 20 >= rows.length}
            onClick={() => setPage(current + 1)}
          >
            <ChevronIcon direction="right" />
          </button>
        </nav>
      )}
    </>
  );
}

function formatDay(date: string) {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}`;
}
