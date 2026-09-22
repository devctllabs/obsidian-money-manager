import type { Account } from '../../domain/entry';
import { CURRENCIES } from '../../domain/currencies';
import type { ReportQuery } from './period-report';
export interface ViewState extends ReportQuery {
  mode: 'overview' | 'accounts' | 'settings';
}
export function normalizeViewState(
  raw: unknown,
  today: string,
  accounts: Record<string, Account>,
  loaded = true,
): ViewState {
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const period =
    typeof value.period === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/u.test(value.period)
      ? value.period
      : today.slice(0, 7);
  return {
    mode: normalizeMode(value.mode),
    period,
    range: value.range === 'year' ? 'year' : 'month',
    accounts: selectedAccounts(value.accounts, loaded ? accounts : null),
    flow: value.flow === 'income' ? 'income' : 'expense',
    currency: selectedCurrency(value, accounts, loaded),
    converted: value.converted === true,
  };
}
function normalizeMode(raw: unknown): ViewState['mode'] {
  if (raw === 'accounts') return 'accounts';
  if (raw === 'settings') return 'settings';
  return 'overview';
}
function selectedAccounts(raw: unknown, accounts: Record<string, Account> | null): string[] | null {
  if (!Array.isArray(raw)) return null;
  return [
    ...new Set(
      raw.filter(
        (value): value is string =>
          typeof value === 'string' &&
          (accounts === null || Object.prototype.hasOwnProperty.call(accounts, value)),
      ),
    ),
  ];
}
function selectedCurrency(
  value: Record<string, unknown>,
  accounts: Record<string, Account>,
  loaded: boolean,
): string {
  const keys = selectedAccounts(value.accounts, accounts) ?? Object.keys(accounts);
  const currencies = keys.flatMap((key) => (accounts[key] ? [accounts[key].currency] : []));
  const currency = value.currency;
  if (
    typeof currency === 'string' &&
    CURRENCIES[currency] !== undefined &&
    (!loaded || value.converted === true || currencies.includes(currency))
  )
    return currency;
  return currencies[0] ?? 'USD';
}
export function shiftPeriod(period: string, months: number): string {
  const [year = 0, month = 1] = period.split('-').map(Number);
  const total = year * 12 + month - 1 + months;
  const nextYear = Math.max(1, Math.min(9999, Math.floor(total / 12)));
  const nextMonth = String((((total % 12) + 12) % 12) + 1).padStart(2, '0');
  return `${String(nextYear).padStart(4, '0')}-${nextMonth}`;
}
