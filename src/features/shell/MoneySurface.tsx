import { PlusIcon, RefreshIcon, SettingsIcon } from '../ui/Icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { ReportOverview } from '../overview/ReportOverview';
import { AccountOverview } from '../accounts/AccountOverview';
import type { Snapshot } from '../../application/indexing/read-model';
import type { ViewState } from '../../application/reports/view-state';
import { type AccountsProps } from '../accounts/Accounts';
import { Diagnostics } from '../ui/Diagnostics';
import type { SettingsSection } from '../settings/sections';
import type { PickerMode } from '../ui/CalendarPicker';
export interface SurfaceProps {
  overview: Omit<ComponentProps<typeof ReportOverview>, 'snapshot' | 'pickerMode'>;
  addEntry: () => void;
  snapshot: Snapshot;
  mode: ViewState['mode'];
  setMode: (mode: ViewState['mode']) => void;
  pickerMode: PickerMode;
  accounts: Omit<AccountsProps, 'snapshot'>;
  openDocument: (path: string) => void;
  settings: (section?: SettingsSection) => void;
  settingsSurface?: ReactNode;
  refresh: () => Promise<void>;
}
export function MoneySurface({
  snapshot,
  mode,
  setMode,
  pickerMode,
  accounts,
  openDocument,
  settings,
  settingsSurface,
  refresh,
  overview,
  addEntry,
}: SurfaceProps) {
  const [refreshing, setRefreshing] = useState(false);
  const runRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.allSettled([refresh(), refreshSpinDelay()]);
    } finally {
      // Refresh diagnostics are published by the index.
      setRefreshing(false);
    }
  };
  return (
    <div className="mm-workspace">
      <nav className="mm-toolbar" aria-label="Money Manager">
        <button
          className="mm-page-tab"
          aria-pressed={mode === 'overview'}
          onClick={() => setMode('overview')}
        >
          Overview
        </button>
        <button
          className="mm-page-tab"
          aria-pressed={mode === 'accounts'}
          onClick={() => setMode('accounts')}
        >
          Accounts
        </button>
        <span className="mm-toolbar-actions">
          <button
            className="mm-icon-button"
            aria-label="Add entry"
            title="Add entry"
            onClick={addEntry}
          >
            <PlusIcon />
          </button>
          <button
            className="mm-settings mm-icon-button"
            aria-label="Settings"
            title="Settings"
            aria-current={mode === 'settings' ? 'page' : undefined}
            onClick={() => settings()}
          >
            <SettingsIcon />
          </button>
          <button
            className="mm-refresh mm-icon-button"
            aria-label={refreshing ? 'Refreshing…' : 'Refresh'}
            title={refreshing ? 'Refreshing…' : 'Refresh'}
            aria-busy={refreshing}
            disabled={refreshing}
            onClick={() => void runRefresh()}
          >
            <RefreshIcon />
          </button>
        </span>
      </nav>
      {snapshot.phase === 'loading' ? (
        <p role="status">Reading your Money Workspace…</p>
      ) : mode === 'settings' ? (
        settingsSurface
      ) : (
        <>
          <Diagnostics items={snapshot.diagnostics} open={openDocument} />
          {mode === 'accounts' ? (
            <AccountOverview
              {...accounts}
              snapshot={snapshot}
              query={overview.query}
              change={overview.change}
              openSettings={settings}
            />
          ) : (
            <ReportOverview
              {...overview}
              pickerMode={pickerMode}
              snapshot={snapshot}
              openSettings={settings}
            />
          )}
        </>
      )}
    </div>
  );
}

function refreshSpinDelay() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
  return new Promise<void>((resolve) => window.setTimeout(resolve, 700));
}
