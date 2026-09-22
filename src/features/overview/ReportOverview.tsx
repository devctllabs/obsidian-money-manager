import { ChevronIcon } from '../ui/Icons';
import type { Snapshot } from '../../application/indexing/read-model';
import {
  periodReport,
  type Report,
  type ReportQuery,
} from '../../application/reports/period-report';
import { shiftPeriod } from '../../application/reports/view-state';
import type { LocatedEntry } from '../../domain/entry';
import { entryRows } from '../../application/indexing/entry-rows';
import { EntryList } from './EntryList';
import { AccountFilter } from './AccountFilter';
import { CategoryChart } from './CategoryChart';
import { MonthlyBars } from './MonthlyBars';
import { formatMonth } from './MonthlyBars';
import { CurrencyField } from '../ui/CurrencyField';
import { InlineNotice } from '../ui/InlineNotice';
import type { SettingsSection } from '../settings/sections';
import { CalendarPicker, type PickerMode } from '../ui/CalendarPicker';
export interface ReportOverviewProps {
  snapshot: Snapshot;
  query: ReportQuery;
  pickerMode: PickerMode;
  change: (query: ReportQuery) => void;
  edit: (row: LocatedEntry) => void;
  remove: (row: LocatedEntry) => void;
  openSettings?: (section?: SettingsSection) => void;
}
export function ReportOverview({
  snapshot,
  query,
  pickerMode,
  change,
  edit,
  remove,
  openSettings,
}: ReportOverviewProps) {
  const report = periodReport(snapshot, query);
  return (
    <section aria-label="Overview">
      <header className="mm-page-heading">
        <h1>Overview</h1>
      </header>
      <ReportControls snapshot={snapshot} query={query} pickerMode={pickerMode} change={change} />
      {report.incomplete && (
        <InlineNotice tone="warning">
          Incomplete period. These partial amounts are not authoritative totals.
        </InlineNotice>
      )}
      <NativeSummaries values={report.native} />
      <div className="mm-report-axes">
        <div className="mm-actions" aria-label="Flow">
          <button
            aria-pressed={query.flow === 'expense'}
            onClick={() => change({ ...query, flow: 'expense' })}
          >
            Expenses
          </button>
          <button
            aria-pressed={query.flow === 'income'}
            onClick={() => change({ ...query, flow: 'income' })}
          >
            Income
          </button>
        </div>
        <CurrencyControls currencies={Object.keys(report.native)} query={query} change={change} />
      </div>
      {query.converted && <p className="mm-muted">At current manual rates</p>}
      {report.missing.length ? (
        <InlineNotice
          tone="warning"
          action={
            openSettings
              ? { label: 'Open settings', run: () => openSettings('manual-rates') }
              : undefined
          }
        >
          Missing rates: {report.missing.join(', ')}. Add them to view the combined valuation.
        </InlineNotice>
      ) : (
        <>
          <CategoryChart
            report={report}
            currency={query.currency}
            flow={query.flow === 'expense' ? 'Expenses' : 'Income'}
          />
          {query.range === 'year' && (
            <MonthlyBars months={report.months} currency={query.currency} />
          )}
        </>
      )}
      {query.range === 'month' ? (
        <EntryList
          key={`${query.period}:${query.accounts?.join(',') ?? 'all'}`}
          rows={entryRows(snapshot, report.entries)}
          edit={edit}
          remove={remove}
        />
      ) : (
        yearPeriods(report.entries, query.period).map((period) => (
          <details className="mm-month-group" key={period}>
            <summary>{formatMonth(period)}</summary>
            <EntryList
              key={`${period}:${query.accounts?.join(',') ?? 'all'}`}
              rows={entryRows(
                snapshot,
                report.entries.filter((row) => row.entry.date.startsWith(period)),
              )}
              edit={edit}
              remove={remove}
            />
          </details>
        ))
      )}
    </section>
  );
}

function NativeSummaries({ values }: { values: Report['native'] }) {
  return (
    <div className="mm-native" role="group" aria-label="Native summaries">
      {Object.entries(values).map(([currency, totals]) => (
        <div key={currency}>
          <strong>{currency}</strong>
          <span>
            Spent <span className="mm-amount">{totals.spent}</span>
          </span>
          <span>
            Received <span className="mm-amount">{totals.received}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
function ReportControls({
  snapshot,
  query,
  pickerMode,
  change,
}: Pick<ReportOverviewProps, 'snapshot' | 'query' | 'pickerMode' | 'change'>) {
  return (
    <div className="mm-report-controls">
      <div className="mm-report-scope">
        <div className="mm-actions">
          <button
            aria-pressed={query.range === 'month'}
            onClick={() => change({ ...query, range: 'month' })}
          >
            Month
          </button>
          <button
            aria-pressed={query.range === 'year'}
            onClick={() => change({ ...query, range: 'year' })}
          >
            Year
          </button>
        </div>
        <AccountFilter
          accounts={snapshot.accounts}
          selected={query.accounts}
          change={(accounts) => change({ ...query, accounts })}
        />
      </div>
      <div className="mm-period-nav">
        <button
          className="mm-icon-button"
          aria-label="Previous period"
          onClick={() =>
            change({
              ...query,
              period: shiftPeriod(query.period, query.range === 'year' ? -12 : -1),
            })
          }
        >
          <ChevronIcon direction="left" />
        </button>
        <PeriodInput query={query} pickerMode={pickerMode} change={change} />
        <button
          className="mm-icon-button"
          aria-label="Next period"
          onClick={() =>
            change({ ...query, period: shiftPeriod(query.period, query.range === 'year' ? 12 : 1) })
          }
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
    </div>
  );
}
function CurrencyControls({
  currencies,
  query,
  change,
}: {
  currencies: string[];
  query: ReportQuery;
  change: (query: ReportQuery) => void;
}) {
  return (
    <div className="mm-currency-controls">
      <div className="mm-actions mm-currency-rail" role="group" aria-label="Native currency view">
        {currencies.map((currency) => (
          <button
            key={currency}
            aria-pressed={!query.converted && query.currency === currency}
            onClick={() => change({ ...query, currency, converted: false })}
          >
            {currency}
          </button>
        ))}
      </div>
      <div className="mm-combined-currency">
        <button
          className="mm-combined-trigger"
          aria-pressed={query.converted}
          onClick={() => change({ ...query, converted: true })}
        >
          All in {query.currency}
        </button>
        <CurrencyField
          label="Valuation currency"
          value={query.currency}
          onChange={(currency) => change({ ...query, currency, converted: true })}
        />
      </div>
    </div>
  );
}

function PeriodInput({
  query,
  pickerMode,
  change,
}: Pick<ReportOverviewProps, 'query' | 'pickerMode' | 'change'>) {
  if (query.range === 'year')
    return (
      <CalendarPicker
        label="Year period"
        mode="year"
        pickerMode={pickerMode}
        value={query.period.slice(0, 4)}
        change={(year) => change({ ...query, period: `${year}-${query.period.slice(5)}` })}
      />
    );
  return (
    <CalendarPicker
      label="Month period"
      mode="month"
      pickerMode={pickerMode}
      value={query.period}
      change={(period) => change({ ...query, period })}
    />
  );
}

function yearPeriods(entries: LocatedEntry[], period: string) {
  return Array.from(
    { length: 12 },
    (_, position) => `${period.slice(0, 4)}-${String(12 - position).padStart(2, '0')}`,
  ).filter((month) =>
    entries.some(
      (row) => row.entry.type !== 'balance_checkpoint' && row.entry.date.startsWith(month),
    ),
  );
}
