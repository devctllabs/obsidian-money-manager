import { chooseCurrency } from '../../test/storybook/choose-currency';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { WorkspacePreview } from '../../test/storybook/WorkspacePreview';

const meta = {
  title: 'Features/Shell/Money Manager',
  component: WorkspacePreview,
  parameters: {
    docs: {
      description: {
        component:
          'Complete interactive workspace. Uses production forms and workflows with isolated ' +
          'Markdown storage in memory. Fixed review date: September 13, 2026. Reload the story ' +
          'to reset its data.',
      },
    },
  },
} satisfies Meta<typeof WorkspacePreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loaded: Story = {};
export const Accounts: Story = { args: { initialMode: 'accounts' } };
export const Settings: Story = { args: { initialMode: 'settings' } };
export const FirstRun: Story = { args: { empty: true } };
export const MobileDark: Story = {
  args: { pickerMode: 'native' },
  globals: { theme: 'dark', frame: 'mobile' },
};
export const CompleteWorkflow: Story = {
  args: { empty: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Review setup' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Use this workspace' }));
    await userEvent.click(await canvas.findByRole('button', { name: 'Accounts' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Add account' }));
    const account = within(canvas.getByRole('dialog'));
    await userEvent.type(account.getByLabelText('Name'), 'Cash');
    await userEvent.type(account.getByLabelText('Observed balance'), '100');
    await userEvent.click(account.getByRole('button', { name: 'Create account' }));
    await expect(await canvas.findByText('100.00 USD')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Add entry' }));
    const entry = within(canvas.getByRole('dialog'));
    await userEvent.type(entry.getByLabelText('Amount (USD)'), '12.50');
    await userEvent.type(entry.getByLabelText('Description (optional)'), 'Storybook lunch');
    await userEvent.click(entry.getByRole('button', { name: 'Save entry' }));
    await expect(await canvas.findByText('87.50 USD')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Overview' }));
    await expect(await canvas.findByText('Storybook lunch')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Settings' }));
    await userEvent.click(canvas.getByText('Manual rates', { selector: 'summary strong' }));
    await chooseCurrency(canvasElement, 'Add currency to table', 'GEL');
    await userEvent.type(canvas.getByLabelText('1 GEL in USD'), '0.5');
    await userEvent.click(canvas.getByRole('button', { name: 'Save rates' }));
    await expect(await canvas.findByRole('button', { name: 'Saved' })).toBeDisabled();
    await expect(canvas.getByRole('status')).toHaveTextContent('Rates saved');
    await expect(canvasElement.querySelector('.mm-inline-notice.is-success')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Overview' }));
    await chooseCurrency(canvasElement, 'Valuation currency', 'GEL');
    await expect(canvasElement.querySelector('.mm-legend-total')).toHaveTextContent('25.00 GEL');
  },
};
export const ActionMenuInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const trigger = (await canvas.findAllByRole('button', { name: /More actions for/ }))[0]!;
    await userEvent.click(trigger);
    await expect(page.getByRole('menuitem', { name: 'Edit entry…' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(page.getByRole('menuitem', { name: 'Delete entry…' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    await userEvent.click(page.getByRole('menuitem', { name: 'Edit entry…' }));
    await expect(canvas.getByRole('dialog', { name: 'Edit entry' })).toBeVisible();
    await userEvent.click(
      within(canvas.getByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );
  },
};
export const AppearanceInteraction: Story = {
  args: { initialMode: 'settings' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Accent color' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Teal' }));
    await waitFor(() => expect(canvas.getByText('Accent color saved')).toHaveClass('mm-sr-only'));
    await expect(canvasElement.querySelector('.mm-inline-notice.is-success')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Teal' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(canvas.getByLabelText('Custom accent HEX')).toHaveValue('#0F766E');
    await userEvent.clear(canvas.getByLabelText('Custom accent HEX'));
    await userEvent.type(canvas.getByLabelText('Custom accent HEX'), '#123456');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply HEX' }));
    await expect(canvas.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    const savedButton = await canvas.findByRole('button', { name: 'Saved' });
    await expect(savedButton.querySelector('svg')).not.toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Overview' }));
    await expect(canvasElement.querySelector('[data-accent="custom"]')).not.toBeNull();
  },
};
export const CurrencySearch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole('button', { name: 'Valuation currency' }));
    const dialog = within(page.getByRole('dialog', { name: 'Choose currency' }));
    await userEvent.type(dialog.getByRole('combobox'), 'Georgian');
    await expect(dialog.getAllByRole('option')).toHaveLength(1);
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('button', { name: 'Valuation currency' })).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'All in GEL' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
};
export const CategoryCatalogEditing: Story = {
  args: { initialMode: 'settings' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Categories', { selector: 'summary strong' }));
    const catalog = within(canvas.getByRole('region', { name: 'expense categories' }));
    await userEvent.type(catalog.getByRole('searchbox'), 'Groceries');
    await userEvent.click(catalog.getByRole('button', { name: 'Edit Groceries' }));
    const row = catalog.getByRole('button', { name: 'Edit Groceries' });
    const marker = row.querySelector('.mm-category-color-marker');
    const chevron = row.querySelector<SVGElement>('.mm-category-row-value > svg');
    const menu = catalog.getByRole('button', { name: 'More actions for Groceries' });
    await expect(marker).not.toBeNull();
    await expect(menu.getBoundingClientRect().right).toBeLessThan(
      chevron!.getBoundingClientRect().left,
    );
    await userEvent.click(catalog.getByRole('button', { name: 'Teal' }));
    await userEvent.clear(catalog.getByLabelText('Name'));
    await userEvent.type(catalog.getByLabelText('Name'), 'Food shopping');
    const customHex = catalog.getByLabelText('Category color HEX');
    const saveChanges = catalog.getByRole('button', { name: 'Save changes' });
    await expect(
      Math.abs(customHex.getBoundingClientRect().top - saveChanges.getBoundingClientRect().top),
    ).toBeLessThan(1);
    await userEvent.click(saveChanges);
    await waitFor(() =>
      expect(catalog.getByRole('status')).toHaveTextContent('Category saved: Food shopping'),
    );
    const savedButton = catalog.getByRole('button', { name: 'Saved' });
    await expect(savedButton).toBeDisabled();
    await expect(savedButton.querySelector('svg')).not.toBeNull();
    await expect(canvasElement.querySelector('.mm-inline-notice.is-success')).toBeNull();
    await userEvent.clear(catalog.getByRole('searchbox'));
    await userEvent.type(catalog.getByRole('searchbox'), 'Food shopping');
    await expect(await catalog.findByRole('button', { name: 'Edit Food shopping' })).toBeVisible();
  },
};
export const RefreshInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Refresh' }));
    const refresh = canvas.getByRole('button', { name: 'Refreshing…' });
    await expect(refresh).toBeDisabled();
    await expect(getComputedStyle(refresh.querySelector('svg')!).animationName).toBe(
      'mm-refresh-spin',
    );
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Refresh' })).toBeEnabled());
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
  },
};
export const WorkspaceSelection: Story = {
  args: { initialMode: 'settings' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Choose workspace folder' }));
    const dialog = within(page.getByRole('dialog', { name: 'Create workspace folder' }));
    await userEvent.click(
      dialog.getByRole('button', { name: 'Open an existing workspace instead…' }),
    );
    const existing = within(page.getByRole('dialog', { name: 'Open existing workspace' }));
    await userEvent.click(existing.getByRole('button', { name: 'Vault' }));
    await userEvent.type(existing.getByRole('searchbox'), 'Money Manager');
    await userEvent.click(existing.getByRole('button', { name: 'Open folder Money Manager' }));
    await userEvent.click(existing.getByRole('button', { name: 'Use this folder' }));
    await userEvent.click(
      within(page.getByRole('dialog', { name: 'Switch workspace?' })).getByRole('button', {
        name: 'Use this workspace',
      }),
    );
    await expect(canvas.getByRole('button', { name: 'Choose workspace folder' })).toHaveFocus();
  },
};
export const CreateWorkspaceFromSettings: Story = {
  args: { initialMode: 'settings' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Choose workspace folder' }));
    const dialog = within(page.getByRole('dialog', { name: 'Create workspace folder' }));
    await expect(dialog.getByRole('button', { name: 'Create workspace' })).toBeDisabled();
    await userEvent.clear(dialog.getByLabelText('Folder name'));
    await userEvent.type(dialog.getByLabelText('Folder name'), 'Travel ledger');
    await expect(dialog.getByText('Vault / Travel ledger')).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Create workspace' }));
    await expect(canvas.getByText('Travel ledger', { selector: 'code' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Overview' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Accounts' }));
    await expect(canvas.getByText('Your ledger starts with an account')).toBeVisible();
  },
};
