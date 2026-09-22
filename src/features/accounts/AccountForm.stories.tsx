import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { AccountForm } from './AccountForm';
const meta = {
  title: 'Features/Accounts/Modals/AccountForm',
  component: AccountForm,
  args: {
    save: fn(async () => ({ checkpointSaved: true })),
    retry: fn(async () => undefined),
    close: fn(),
  },
} satisfies Meta<typeof AccountForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Edit: Story = {
  args: { initial: { key: 'everyday', name: 'Everyday spending', currency: 'GEL' } },
};
export const SaveError: Story = {
  args: {
    save: fn(async () => {
      throw new Error('ACCOUNTS.md changed. Reopen this account and retry.');
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Name'), 'Everyday');
    await userEvent.click(canvas.getByRole('button', { name: 'Create account' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('changed');
  },
};
export const RetryCheckpoint: Story = {
  args: { save: fn(async () => ({ checkpointSaved: false })) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Name'), 'Everyday');
    await userEvent.type(canvas.getByLabelText('Observed balance'), '100.00');
    await userEvent.click(canvas.getByRole('button', { name: 'Create account' }));
    await expect(canvas.getByRole('button', { name: 'Retry checkpoint' })).toBeVisible();
  },
};
export const SavePending: Story = {
  args: { save: fn(() => new Promise(() => undefined)) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Name'), 'Everyday');
    await userEvent.click(canvas.getByRole('button', { name: 'Create account' }));
    await expect(canvas.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  },
};
