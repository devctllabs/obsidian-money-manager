import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CheckpointForm } from './CheckpointForm';
import { formatMinor, minor } from '../../domain/money';
import { localToday } from '../shell/controller';
const meta = {
  title: 'Features/Accounts/Modals/CheckpointForm',
  component: CheckpointForm,
  args: {
    pickerMode: 'desktop',
    accounts: { everyday: { name: 'Everyday', currency: 'GEL' } },
    account: 'everyday',
    calculated: '93.00',
    today: localToday(),
    difference: (value: string) => formatMinor(minor(value, 'GEL') - 9300n, 'GEL'),
    save: fn(async () => undefined),
    close: fn(),
  },
} satisfies Meta<typeof CheckpointForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ReconcileOpen: Story = {};
export const EditTimedCheckpoint: Story = {
  args: {
    initial: {
      id: '019949d2-89e7-7f12-8d44-0dc85e414342',
      type: 'balance_checkpoint',
      account: 'everyday',
      balance: '93.00',
      date: '2026-09-12T14:35',
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Time (optional)' })).toHaveTextContent(
      '14:35',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Save checkpoint' }));
    await expect(args.save).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-09-12T14:35' }),
    );
  },
};
