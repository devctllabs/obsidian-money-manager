import { BalanceHistory } from './BalanceHistory';
import { ActionMenu, MenuAction } from '../ui/ActionMenu';
import type { Snapshot } from '../../application/indexing/read-model';
import type { LocatedEntry } from '../../domain/entry';
export interface AccountsProps {
  conversions?: Record<string, string>;
  targetCurrency?: string;
  snapshot: Snapshot;
  create: () => void;
  edit: (key: string) => void;
  remove: (key: string) => void;
  reconcile: (key: string) => void;
  editCheckpoint: (row: LocatedEntry) => void;
  deleteCheckpoint: (row: LocatedEntry) => void;
}
export function Accounts({
  snapshot,
  create,
  edit,
  remove,
  reconcile,
  editCheckpoint,
  deleteCheckpoint,
  conversions,
  targetCurrency,
}: AccountsProps) {
  return (
    <section aria-label="Accounts">
      <div className="mm-section-heading">
        <h2>Accounts</h2>
        <button className="mod-cta" onClick={create}>
          Add account
        </button>
      </div>
      {!Object.keys(snapshot.accounts).length && (
        <div className="mm-empty">
          <h3>Your ledger starts with an account</h3>
          <p>
            Add a named holder of money and its currency. You can record its observed balance now or
            reconcile later.
          </p>
        </div>
      )}
      {Object.entries(snapshot.accounts).map(([key, account]) => (
        <article className="mm-account" key={key}>
          <div className="mm-row mm-account-main">
            <div>
              <h3>{account.name}</h3>
              <p className="mm-muted">
                {snapshot.checkpoints[key]
                  ? `Last reconciled: ${snapshot.checkpoints[key].entry.date}`
                  : 'Not reconciled yet'}
              </p>
            </div>
            <strong className="mm-amount">
              {snapshot.balances[key]} {account.currency}
            </strong>
            <ActionMenu label={`More actions for ${account.name}`}>
              <MenuAction onClick={() => reconcile(key)}>Reconcile balance…</MenuAction>
              <MenuAction onClick={() => edit(key)}>Edit account…</MenuAction>
              <MenuAction destructive onClick={() => remove(key)}>
                Delete account…
              </MenuAction>
            </ActionMenu>
          </div>
          {conversions?.[key] && targetCurrency !== account.currency && (
            <p className="mm-muted mm-amount">
              {conversions[key]} {targetCurrency} at current manual rates
            </p>
          )}

          <BalanceHistory
            rows={snapshot.entries
              .filter((row) => row.entry.account === key && row.entry.type === 'balance_checkpoint')
              .slice()
              .reverse()}
            currency={account.currency}
            active={snapshot.checkpoints[key]?.entry.id}
            edit={editCheckpoint}
            remove={deleteCheckpoint}
          />
        </article>
      ))}
    </section>
  );
}
