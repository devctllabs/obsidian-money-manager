import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { InlineNotice } from './InlineNotice';

const meta = {
  title: 'Features/UI/InlineNotice',
  component: InlineNotice,
  args: { children: 'Your latest changes are available.', tone: 'info' },
} satisfies Meta<typeof InlineNotice>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Info: Story = {};
export const Success: Story = { args: { tone: 'success', children: 'Settings saved.' } };
export const Warning: Story = {
  args: {
    tone: 'warning',
    children: 'Missing rates: USD.',
    action: { label: 'Open settings', run: fn() },
  },
};
export const Error: Story = {
  args: {
    tone: 'error',
    children: 'Could not save the Markdown document.',
    action: { label: 'Retry', run: fn() },
  },
};
