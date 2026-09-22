import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CategorySettings } from './CategorySettings';
const meta = {
  title: 'Features/Settings/Settings/CategorySettings',
  component: CategorySettings,
  args: {
    categories: {
      expense: { food: { name: 'Groceries' } },
      income: { salary: { name: 'Salary' } },
    },
    create: fn(),
    save: fn(async () => undefined),
    remove: fn(),
  },
} satisfies Meta<typeof CategorySettings>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loaded: Story = {};
export const InvalidCustomHex: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Edit Groceries' }));
    const input = canvas.getByLabelText('Category color HEX');
    await userEvent.type(input, '#123');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByText('Use a six-digit HEX color, for example #5B5BD6.')).toBeVisible();
  },
};
export const Empty: Story = { args: { categories: { expense: {}, income: {} } } };
