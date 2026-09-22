import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CheckpointForm } from './CheckpointForm';
import { formatMinor, minor } from '../../domain/money';
const meta = {
  title: 'Features/Accounts/Modals/CheckpointForm',
  component: CheckpointForm,
  args: {
    accounts: { everyday: { name: 'Everyday', currency: 'GEL' } },
    account: 'everyday',
    calculated: '93.00',
    today: '2026-09-13',
    difference: (value: string) => formatMinor(minor(value, 'GEL') - 9300n, 'GEL'),
    save: fn(async () => undefined),
    close: fn(),
  },
} satisfies Meta<typeof CheckpointForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ReconcileOpen: Story = {};
