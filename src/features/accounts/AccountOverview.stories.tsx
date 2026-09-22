import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AccountOverview } from './AccountOverview';
import { reportFixture } from '../../test/storybook/report-fixtures';
const meta = {
  title: 'Features/Accounts/Views/AccountOverview',
  component: AccountOverview,
  args: {
    snapshot: reportFixture(),
    query: {
      period: '2026-09',
      range: 'month',
      accounts: null,
      flow: 'expense',
      currency: 'GEL',
      converted: false,
    },
    change: fn(),
    openSettings: fn(),
    create: fn(),
    edit: fn(),
    remove: fn(),
    reconcile: fn(),
    editCheckpoint: fn(),
    deleteCheckpoint: fn(),
  },
} satisfies Meta<typeof AccountOverview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loaded: Story = {};
export const Converted: Story = { args: { query: { ...meta.args.query, converted: true } } };
export const MissingRate: Story = {
  args: {
    snapshot: { ...reportFixture(), rates: null },
    query: { ...meta.args.query, converted: true },
  },
};
