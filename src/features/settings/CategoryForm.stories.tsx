import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CategoryForm } from './CategoryForm';
const meta = {
  title: 'Features/Settings/Modals/CategoryForm',
  component: CategoryForm,
  args: { flow: 'expense', save: fn(async () => undefined), close: fn() },
} satisfies Meta<typeof CategoryForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Edit: Story = {
  args: { initial: { key: 'food', name: 'Groceries', color: '#0f766e' } },
};
