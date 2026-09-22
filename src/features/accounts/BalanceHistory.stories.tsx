import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { LocatedEntry } from '../../domain/entry';
import { BalanceHistory } from './BalanceHistory';

const rows: LocatedEntry[] = Array.from({ length: 23 }, (_, index) => {
  const day = 23 - index;
  return {
    entry: {
      id: `checkpoint-${day}`,
      type: 'balance_checkpoint',
      account: 'everyday',
      date: `2026-08-${String(day).padStart(2, '0')}`,
      balance: `${1000 + day}.00`,
      reason: `Reconciliation ${day}`,
    },
    path: 'Money Manager/Ledger/2026/08.md',
    position: day,
  };
});

const meta = {
  title: 'Features/Accounts/Views/BalanceHistory',
  component: BalanceHistory,
  args: { rows, currency: 'GEL', active: 'checkpoint-23', edit: fn(), remove: fn() },
} satisfies Meta<typeof BalanceHistory>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Paginated: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Balance history'));
    await expect(canvas.getByText('Reconciliation 23')).toBeVisible();
    await expect(canvas.getByText('1–10 of 23 checkpoints')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Next balance checkpoints' }));
    await expect(canvas.getByText('Reconciliation 13')).toBeVisible();
  },
};
