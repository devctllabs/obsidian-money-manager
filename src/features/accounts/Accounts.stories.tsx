import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Accounts } from './Accounts';
import { emptySnapshot } from '../../application/indexing/read-model';
const snapshot = {
  ...emptySnapshot(),
  phase: 'ready' as const,
  accounts: {
    everyday: { name: 'Everyday spending', currency: 'GEL' },
    savings: { name: 'Savings', currency: 'USD' },
  },
  balances: { everyday: '1250.30', savings: '3000.00' },
};
const meta = {
  title: 'Features/Accounts/Views/Accounts',
  component: Accounts,
  args: {
    snapshot,
    create: fn(),
    edit: fn(),
    remove: fn(),
    reconcile: fn(),
    editCheckpoint: fn(),
    deleteCheckpoint: fn(),
  },
} satisfies Meta<typeof Accounts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loaded: Story = {};
export const Empty: Story = { args: { snapshot: { ...emptySnapshot(), phase: 'ready' } } };
export const NegativeBalance: Story = {
  args: { snapshot: { ...snapshot, balances: { everyday: '-42.30', savings: '3000.00' } } },
};
export const LongContent: Story = {
  args: {
    snapshot: {
      ...snapshot,
      accounts: {
        everyday: {
          name: 'A very long account name with details kept in the user’s local notebook',
          currency: 'GEL',
        },
      },
    },
  },
};
