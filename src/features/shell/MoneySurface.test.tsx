import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { emptySnapshot } from '../../application/indexing/read-model';
import { MoneySurface } from './MoneySurface';

afterEach(() => vi.useRealTimers());

it('keeps a quick refresh visibly busy for one spin without showing a notice', async () => {
  vi.useFakeTimers();
  const refresh = vi.fn().mockResolvedValue(undefined);
  render(
    <MoneySurface
      pickerMode="desktop"
      snapshot={{ ...emptySnapshot(), phase: 'ready' }}
      mode="overview"
      setMode={vi.fn()}
      settings={vi.fn()}
      refresh={refresh}
      openDocument={vi.fn()}
      addEntry={vi.fn()}
      overview={{
        query: {
          period: '2026-09',
          range: 'month',
          accounts: null,
          flow: 'expense',
          currency: 'GEL',
          converted: false,
        },
        change: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
      }}
      accounts={{
        create: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        reconcile: vi.fn(),
        editCheckpoint: vi.fn(),
        deleteCheckpoint: vi.fn(),
      }}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(screen.getByRole('button', { name: 'Refreshing…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Refreshing…' })).toHaveAttribute('aria-busy', 'true');
  await act(() => vi.advanceTimersByTimeAsync(699));
  expect(screen.getByRole('button', { name: 'Refreshing…' })).toBeDisabled();
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Refresh' })).toHaveAttribute('aria-busy', 'false');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('renders embedded settings in the shared shell and keeps navigation available', () => {
  const setMode = vi.fn();
  const settings = vi.fn();
  render(
    <MoneySurface
      pickerMode="desktop"
      snapshot={{ ...emptySnapshot(), phase: 'ready' }}
      mode="settings"
      setMode={setMode}
      settings={settings}
      settingsSurface={<h1>Embedded settings</h1>}
      refresh={vi.fn().mockResolvedValue(undefined)}
      openDocument={vi.fn()}
      addEntry={vi.fn()}
      overview={{
        query: {
          period: '2026-09',
          range: 'month',
          accounts: null,
          flow: 'expense',
          currency: 'GEL',
          converted: false,
        },
        change: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
      }}
      accounts={{
        create: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        reconcile: vi.fn(),
        editCheckpoint: vi.fn(),
        deleteCheckpoint: vi.fn(),
      }}
    />,
  );

  expect(screen.getByRole('heading', { name: 'Embedded settings' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');

  fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
  expect(setMode).toHaveBeenCalledWith('overview');
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  expect(settings).toHaveBeenCalledOnce();
});

it('renders Add entry as an icon-only toolbar action', () => {
  const addEntry = vi.fn();
  render(
    <MoneySurface
      pickerMode="desktop"
      snapshot={{ ...emptySnapshot(), phase: 'ready' }}
      mode="overview"
      setMode={vi.fn()}
      settings={vi.fn()}
      refresh={vi.fn().mockResolvedValue(undefined)}
      openDocument={vi.fn()}
      addEntry={addEntry}
      overview={{
        query: {
          period: '2026-09',
          range: 'month',
          accounts: null,
          flow: 'expense',
          currency: 'GEL',
          converted: false,
        },
        change: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
      }}
      accounts={{
        create: vi.fn(),
        edit: vi.fn(),
        remove: vi.fn(),
        reconcile: vi.fn(),
        editCheckpoint: vi.fn(),
        deleteCheckpoint: vi.fn(),
      }}
    />,
  );

  const button = screen.getByRole('button', { name: 'Add entry' });
  expect(button).toHaveAttribute('title', 'Add entry');
  expect(button).toHaveTextContent('');
  expect(button.querySelector('svg')).not.toBeNull();

  fireEvent.click(button);
  expect(addEntry).toHaveBeenCalledOnce();
});
