import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, userEvent, waitFor, within } from 'storybook/test';
import { ReportOverview, type ReportOverviewProps } from './ReportOverview';
import { reportFixture } from '../../test/storybook/report-fixtures';
import { emptySnapshot } from '../../application/indexing/read-model';
function Interactive(args: ReportOverviewProps) {
  const [query, change] = useState(args.query);
  return <ReportOverview {...args} query={query} change={change} />;
}
const meta = {
  title: 'Features/Overview/Views/ReportOverview',
  component: ReportOverview,
  render: (args) => <Interactive {...args} />,
  args: {
    snapshot: reportFixture(),
    pickerMode: 'desktop',
    query: {
      period: '2026-09',
      range: 'month',
      accounts: null,
      flow: 'expense',
      currency: 'GEL',
      converted: false,
    },
    change: fn(),
    edit: fn(),
    remove: fn(),
  },
} satisfies Meta<typeof ReportOverview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LoadedNative: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = canvas.getByLabelText('Native summaries');
    const monthTop = summary.getBoundingClientRect().top;
    await userEvent.click(canvas.getByRole('button', { name: 'Year' }));
    await waitFor(() => expect(summary.getBoundingClientRect().top).toBe(monthTop));
  },
};
export const LoadedConverted: Story = { args: { query: { ...meta.args.query, converted: true } } };
export const EmptyAccounts: Story = { args: { snapshot: { ...emptySnapshot(), phase: 'ready' } } };
export const EmptyPeriod: Story = { args: { query: { ...meta.args.query, period: '2026-08' } } };
export const Year: Story = {
  args: { query: { ...meta.args.query, range: 'year' } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Monthly totals · GEL')).toBeVisible();
    const septemberBar = canvasElement.querySelector<SVGRectElement>(
      '.mm-year-month rect[aria-label^="09.2026"]',
    );
    const septemberValue =
      septemberBar?.parentElement?.querySelector<SVGTextElement>('.mm-year-value');
    await expect(septemberBar).not.toBeNull();
    await expect(septemberValue).not.toBeNull();
    await expect(getComputedStyle(septemberValue!).opacity).toBe('0');
    await userEvent.hover(septemberBar!);
    await waitFor(() => expect(septemberBar!.parentElement).toHaveClass('is-hovered'));
    await waitFor(() => expect(getComputedStyle(septemberValue!).opacity).toBe('1'));
    await waitFor(() => expect(getComputedStyle(septemberBar!).filter).toBe('brightness(1.14)'));
  },
};
export const ManyCategories: Story = { args: { snapshot: reportFixture(120, 30) } };
export const FewCategories: Story = { args: { snapshot: reportFixture(8, 2) } };
export const ManyCurrencies: Story = { args: { snapshot: manyCurrencyFixture() } };
export const LargeYear: Story = {
  args: { snapshot: reportFixture(500, 30), query: { ...meta.args.query, range: 'year' } },
};
export const MissingRate: Story = {
  args: {
    snapshot: { ...reportFixture(), rates: { reference: 'GEL', rates: {} } },
    query: { ...meta.args.query, converted: true },
  },
};
export const IncompleteMonth: Story = {
  args: {
    snapshot: {
      ...reportFixture(),
      diagnostics: [
        {
          path: 'Money Manager/Ledger/2026/09.md',
          field: 'amount',
          message: 'Invalid amount',
          monetary: true,
        },
      ],
      incomplete: true,
    },
  },
};
export const LongContent: Story = {
  args: {
    snapshot: {
      ...reportFixture(),
      accounts: {
        everyday: {
          name: 'A very long account name that should wrap without obscuring the native amount',
          currency: 'GEL',
        },
        savings: { name: 'Dollar savings', currency: 'USD' },
      },
    },
  },
};
export const FilterInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Accounts: All'));
    const dialog = within(within(canvasElement.ownerDocument.body).getByRole('dialog'));
    await userEvent.click(dialog.getByRole('button', { name: 'Clear selection' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Done' }));
    await expect(canvas.getByText('Accounts: 0')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Income' }));
    await expect(canvas.getByRole('button', { name: 'Income' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
};
export const PaginatedCategories: Story = {
  args: { snapshot: reportFixture(120, 30) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvasElement.querySelector('.mm-legend li')?.textContent;
    const total = canvasElement.querySelector('.mm-legend-total')?.textContent;
    await expect(canvasElement.querySelectorAll('.mm-legend li')).toHaveLength(6);
    await userEvent.click(canvas.getByRole('button', { name: 'Next categories' }));
    await expect(canvasElement.querySelector('.mm-legend li')?.textContent).not.toBe(first);
    await expect(canvasElement.querySelector('.mm-legend-total')?.textContent).toBe(total);
    await userEvent.click(canvas.getByRole('button', { name: 'Previous categories' }));
    await expect(canvasElement.querySelector('.mm-legend li')?.textContent).toBe(first);
  },
};
export const PaginatedEntries: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvasElement.querySelector('.mm-entry')?.textContent;
    await expect(canvasElement.querySelectorAll('.mm-entry')).toHaveLength(20);
    await userEvent.click(canvas.getByRole('button', { name: 'Next entries' }));
    await expect(canvasElement.querySelectorAll('.mm-entry')).toHaveLength(20);
    await expect(canvasElement.querySelector('.mm-entry')?.textContent).not.toBe(first);
    await userEvent.click(canvas.getByRole('button', { name: 'Previous entries' }));
    await expect(canvasElement.querySelector('.mm-entry')?.textContent).toBe(first);
  },
};

function manyCurrencyFixture() {
  const snapshot = reportFixture();
  return {
    ...snapshot,
    accounts: {
      ...snapshot.accounts,
      euro: { name: 'Euro travel', currency: 'EUR' },
      sterling: { name: 'Sterling cash', currency: 'GBP' },
      yen: { name: 'Yen cash', currency: 'JPY' },
      canadian: { name: 'Canadian cash', currency: 'CAD' },
    },
    balances: { ...snapshot.balances, euro: '0.00', sterling: '0.00', yen: '0', canadian: '0.00' },
  };
}
