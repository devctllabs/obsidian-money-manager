import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { EntryForm } from './EntryForm';
import { localToday } from '../shell/controller';
const meta = {
  title: 'Features/Ledger/Modals/EntryForm',
  component: EntryForm,
  args: {
    pickerMode: 'desktop',
    accounts: { cash: { name: 'Everyday', currency: 'GEL' } },
    categories: { expense: { food: { name: 'Food' } }, income: { salary: { name: 'Salary' } } },
    today: localToday(),
    save: fn(async () => undefined),
    close: fn(),
    goAccounts: fn(),
  },
} satisfies Meta<typeof EntryForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Expense: Story = {};
export const ChooseDateAndTime: Story = {
  args: { today: '2026-09-13' },
  globals: { frame: 'mobile', theme: 'dark' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const date = canvas.getByRole('button', { name: 'Date' });
    await userEvent.click(date);
    const body = within(canvasElement.ownerDocument.body);
    const calendar = within(body.getByRole('dialog', { name: 'Choose date' }));
    await expect(calendar.getByRole('button', { name: '14 September 2026' })).toBeDisabled();
    await userEvent.click(calendar.getByRole('button', { name: '12 September 2026' }));
    await expect(date).toHaveTextContent('12.09.2026');
    const time = canvas.getByRole('button', { name: 'Time (optional)' });
    await expect(time.getBoundingClientRect().top).toBe(date.getBoundingClientRect().top);
    await userEvent.click(time);
    const picker = within(body.getByRole('dialog', { name: 'Choose time' }));
    const setTime = picker.getByRole('button', { name: 'Set time' });
    const save = canvas.getByRole('button', { name: 'Save entry' });
    const styles = canvasElement.ownerDocument.defaultView!;
    await expect(styles.getComputedStyle(setTime).backgroundColor).toBe(
      styles.getComputedStyle(save).backgroundColor,
    );
    await userEvent.clear(picker.getByLabelText('Hour'));
    await userEvent.type(picker.getByLabelText('Hour'), '14');
    await userEvent.clear(picker.getByLabelText('Minute'));
    await userEvent.type(picker.getByLabelText('Minute'), '35');
    await userEvent.click(setTime);
    await expect(time).toHaveFocus();
    await userEvent.type(canvas.getByLabelText('Amount (GEL)'), '12.30');
    await userEvent.click(save);
    await expect(args.save).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-09-12T14:35' }),
    );
  },
};
export const Income: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '+ Income' }));
  },
};
export const MobileNativePickers: Story = {
  args: { pickerMode: 'native' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByLabelText('Entry type'), 'income');
    await userEvent.type(canvas.getByRole('combobox', { name: 'Category' }), 'Food');
    await expect(canvas.getByRole('combobox', { name: 'Category' })).toHaveValue('Food');
  },
};
export const EmptyAccounts: Story = { args: { accounts: {} } };
export const CreateCategory: Story = {
  play: async ({ canvasElement }) => {
    await createCategory(canvasElement);
  },
};
export const EntrySaveAfterCategoryError: Story = {
  args: {
    save: fn(async () => {
      throw new Error('Category saved; entry not saved. Review the Month document and retry.');
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Amount (GEL)'), '12.30');
    await createCategory(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Save entry' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Category saved');
  },
};
export const CategorySaveError: Story = {
  ...EntrySaveAfterCategoryError,
  args: {
    save: fn(async () => {
      throw new Error('Category not saved. CATEGORIES.md is invalid.');
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Amount (GEL)'), '12.30');
    await userEvent.click(canvas.getByRole('button', { name: 'Save entry' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Category not saved');
  },
};
export const SubmitPending: Story = {
  args: { save: fn(() => new Promise(() => undefined)) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Amount (GEL)'), '12.30');
    await userEvent.click(canvas.getByRole('button', { name: 'Save entry' }));
    await expect(canvas.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  },
};
export const Edit: Story = {
  args: {
    initial: {
      id: '019949d2-89e7-7f12-8d44-0dc85e414342',
      type: 'expense',
      date: '2026-09-12T14:35',
      account: 'cash',
      amount: '42.30',
      category: 'food',
      description: 'Weekly groceries',
    },
  },
};

async function createCategory(canvasElement: HTMLElement) {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Category' }));
  const dialog = within(within(canvasElement.ownerDocument.body).getByRole('dialog'));
  await userEvent.type(dialog.getByRole('combobox'), 'Transport');
  await userEvent.click(dialog.getByRole('button', { name: 'Create “Transport”' }));
}
export const LargeCategorySearch: Story = {
  args: {
    categories: {
      expense: Object.fromEntries(
        Array.from({ length: 250 }, (_, index) => [
          `category-${index}`,
          { name: `Category ${String(index).padStart(3, '0')}` },
        ]),
      ),
      income: {},
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Category' }));
    const dialog = within(within(canvasElement.ownerDocument.body).getByRole('dialog'));
    await expect(dialog.getAllByRole('option')).toHaveLength(8);
    await userEvent.type(dialog.getByRole('combobox'), '249');
    await expect(dialog.getAllByRole('option')).toHaveLength(1);
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('button', { name: 'Category' })).toHaveTextContent(
      'Category 249',
    );
    await expect(canvas.getByRole('button', { name: 'Category' })).toHaveFocus();
  },
};
