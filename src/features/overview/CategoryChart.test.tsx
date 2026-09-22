import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
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
    { key: 'food', label: 'Food', amount: '60.00', share: 60, color: '#0F766E' },
    { key: 'travel', label: 'Travel', amount: '30.00', share: 30, color: '#0F766E' },
    {
      key: '__uncategorized',
      label: 'Uncategorized',
      amount: '10.00',
      share: 10,
      color: '#123456',
    },
  ],
};

it(
  'identifies and highlights each segment without changing ' + 'duplicate configured colors',
  async () => {
    render(<CategoryChart report={report} currency="GEL" flow="Expenses" />);
    const user = userEvent.setup();
    const food = screen.getByRole('graphics-symbol', { name: 'Food: 60.00 GEL, 60.0%' });
    const travel = screen.getByRole('graphics-symbol', { name: 'Travel: 30.00 GEL, 30.0%' });
    const uncategorized = screen.getByRole('graphics-symbol', {
      name: 'Uncategorized: 10.00 GEL, 10.0%',
    });

    expect(food).toHaveAttribute('stroke', '#0F766E');
    expect(travel).toHaveAttribute('stroke', '#0F766E');
    expect(food.getAttribute('stroke-dasharray')).not.toBe('60 40');
    expect(uncategorized).toHaveAttribute('stroke', 'var(--mm-chart-uncategorized)');

    await user.hover(food);
    expect(food).toHaveClass('is-active');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Food60.00 GEL60.0%');
    await user.unhover(food);
    fireEvent.focus(food);
    expect(screen.getByRole('tooltip')).toBeVisible();
  },
);
