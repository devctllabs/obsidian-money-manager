import { chooseCurrency } from '../../test/storybook/choose-currency';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, waitFor, within, expect } from 'storybook/test';
import { RateEditor } from './RateEditor';
import { rebase } from '../../domain/rates';
const meta = {
  title: 'Features/Settings/Settings/RateEditor',
  component: RateEditor,
  args: {
    rates: { reference: 'GEL', rates: { USD: '2.7000', EUR: '3.1600' } },
    currencies: ['GEL', 'USD', 'EUR'],
    save: fn(async () => undefined),
    proposal: (table, currency) => rebase(table, currency, ['GEL', 'USD', 'EUR']),
  },
} satisfies Meta<typeof RateEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RatesLoaded: Story = {};
export const MissingRate: Story = { args: { rates: { reference: 'GEL', rates: {} } } };
export const InvalidDocument: Story = { args: { rates: null } };
export const RebaseProposal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await chooseCurrency(canvasElement, 'Reference currency', 'USD');
    await userEvent.click(canvas.getByRole('button', { name: 'Review rebase' }));
    await expect(canvas.getByRole('button', { name: 'Confirm rebase' })).toBeVisible();
  },
};
export const SaveError: Story = {
  args: {
    save: fn(async () => {
      throw new Error('RATES.md changed. Reopen the editor and retry.');
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.clear(canvas.getByLabelText('1 USD in GEL'));
    await userEvent.type(canvas.getByLabelText('1 USD in GEL'), '2.8');
    await userEvent.click(canvas.getByRole('button', { name: 'Save rates' }));
    await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible());
  },
};
export const RemoveRate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove USD rate' }));
    await expect(canvas.getByLabelText('1 USD in GEL')).toHaveValue('');
    await userEvent.click(canvas.getByRole('button', { name: 'Save rates' }));
    await expect(canvas.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Rates saved'));
    const savedButton = canvas.getByRole('button', { name: 'Saved' });
    await expect(savedButton.querySelector('svg')).not.toBeNull();
  },
};
