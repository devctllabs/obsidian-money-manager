import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { Report } from '../../application/reports/period-report';
import { CategoryChart } from './CategoryChart';

const report: Report = {
  native: {},
  entries: [],
  months: [],
  total: '100.00',
  missing: [],
  incomplete: false,
  groups: [
    { key: 'food', label: 'Food', amount: '55.00', share: 55, color: '#0F766E' },
    { key: 'travel', label: 'Travel', amount: '35.00', share: 35, color: '#0F766E' },
    {
      key: '__uncategorized',
      label: 'Uncategorized',
      amount: '10.00',
      share: 10,
      color: '#123456',
    },
  ],
};

const meta = {
  title: 'Features/Overview/Charts/CategoryChart',
  component: CategoryChart,
  args: { report, currency: 'GEL', flow: 'Expenses' },
} satisfies Meta<typeof CategoryChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DuplicateColors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const food = canvas.getByRole('graphics-symbol', { name: 'Food: 55.00 GEL, 55.0%' });
    await userEvent.hover(food);
    const tooltip = canvas.getByRole('tooltip');
    await expect(tooltip).toHaveTextContent('Food55.00 GEL55.0%');
    const initialTop = tooltip.getBoundingClientRect().top;
    await tooltip.getAnimations()[0]?.finished;
    await expect(Math.abs(tooltip.getBoundingClientRect().top - initialTop)).toBeLessThan(1);
    await expect(food).toHaveClass('is-active');
  },
};
