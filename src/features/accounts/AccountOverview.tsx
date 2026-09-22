import { ActionMenu, MenuAction } from '../ui/ActionMenu';
import { ChevronIcon } from '../ui/Icons';
import type { AccountsProps } from './Accounts';
import { Accounts } from './Accounts';
import { accountValuation } from '../../application/reports/account-valuation';
import type { ReportQuery } from '../../application/reports/period-report';
import { AccountFilter } from '../overview/AccountFilter';
import { CurrencyField } from '../ui/CurrencyField';
import { InlineNotice } from '../ui/InlineNotice';
import type { SettingsSection } from '../settings/sections';
export function AccountOverview({
  query,
  change,
  openSettings,
  ...props
}: AccountsProps & {
  query: ReportQuery;
  change: (query: ReportQuery) => void;
  openSettings: (section?: SettingsSection) => void;
}) {
  const keys = query.accounts ?? Object.keys(props.snapshot.accounts);
  const valuation = query.converted ? accountValuation(props.snapshot, keys, query.currency) : null;
  const snapshot = {
    ...props.snapshot,
    accounts: Object.fromEntries(
      Object.entries(props.snapshot.accounts).filter(([key]) => keys.includes(key)),
    ),
  };
  return (
    <>
      <div className="mm-report-controls">
        <AccountFilter
          accounts={props.snapshot.accounts}
          selected={query.accounts}
          change={(accounts) => change({ ...query, accounts })}
        />
        <ActionMenu
          label="Balance display"
          triggerContent={
            <>
              <span>{query.converted ? `All in ${query.currency}` : 'Native balances'}</span>
              <ChevronIcon />
            </>
          }
        >
          <MenuAction onClick={() => change({ ...query, converted: false })}>
            Native balances
          </MenuAction>
          <MenuAction onClick={() => change({ ...query, converted: true })}>
            All in {query.currency}
          </MenuAction>
        </ActionMenu>
        {query.converted && (
          <CurrencyField
            label="Valuation currency"
            value={query.currency}
            onChange={(currency) => change({ ...query, currency, converted: true })}
          />
        )}
      </div>
      {valuation && (
        <div className="mm-valuation">
          <p>At current manual rates</p>
          {valuation.total === null ? (
            <InlineNotice
              tone="warning"
              action={{ label: 'Open settings', run: () => openSettings('manual-rates') }}
            >
              Missing rates: {valuation.missing.join(', ')}
            </InlineNotice>
          ) : (
            <p>
              Selected accounts{' '}
              <strong className="mm-amount">
                {valuation.total} {query.currency}
              </strong>
            </p>
          )}
        </div>
      )}
      {keys.length === 0 && Object.keys(props.snapshot.accounts).length > 0 ? (
        <p>No accounts selected. Choose accounts above to see their balances.</p>
      ) : (
        <Accounts
          {...props}
          snapshot={snapshot}
          conversions={valuation?.accounts}
          targetCurrency={query.currency}
        />
      )}
    </>
  );
}
