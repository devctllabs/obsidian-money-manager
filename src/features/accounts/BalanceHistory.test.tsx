import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { LocatedEntry } from '../../domain/entry';
import { BalanceHistory } from './BalanceHistory';

it('paginates checkpoints ten at a time in newest-first order', async () => {
  const rows: LocatedEntry[] = Array.from({ length: 12 }, (_, index) => {
    const day = 12 - index;
    return {
      entry: {
        id: `checkpoint-${day}`,
        type: 'balance_checkpoint',
        account: 'cash',
        date: `2026-09-${String(day).padStart(2, '0')}`,
        balance: `${day}.00`,
        reason: `Checkpoint ${day}`,
      },
      path: 'Money Manager/Ledger/2026/09.md',
      position: day,
    };
  });
  render(
    <BalanceHistory
      rows={rows}
      currency="GEL"
      active="checkpoint-12"
      edit={vi.fn()}
      remove={vi.fn()}
    />,
  );
  const user = userEvent.setup();

  await user.click(screen.getByText('Balance history'));
  expect(screen.getByText('Checkpoint 12')).toBeVisible();
  expect(screen.getByText('Checkpoint 3')).toBeVisible();
  expect(screen.queryByText('Checkpoint 2')).not.toBeInTheDocument();
  expect(screen.getByText('1–10 of 12 checkpoints')).toBeVisible();

  await user.click(screen.getByRole('button', { name: 'Next balance checkpoints' }));
  expect(screen.getByText('Checkpoint 2')).toBeVisible();
  expect(screen.getByText('Checkpoint 1')).toBeVisible();
  expect(screen.queryByText('Checkpoint 12')).not.toBeInTheDocument();
  expect(screen.getByText('11–12 of 12 checkpoints')).toBeVisible();
});
