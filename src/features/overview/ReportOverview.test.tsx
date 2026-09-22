import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import { emptySnapshot } from '../../application/indexing/read-model';
import type { ReportQuery } from '../../application/reports/period-report';
import { ReportOverview } from './ReportOverview';
import type { LocatedEntry } from '../../domain/entry';
it(
  'keeps native summaries visible when conversion is unavailable and allows independent ' +
    'year/flow selections',
  async () => {
    function Harness() {
      const [query, change] = useState<ReportQuery>({
        period: '2026-09',
        range: 'month',
        accounts: null,
        flow: 'expense',
        currency: 'GEL',
        converted: false,
      });
      const snapshot = {
        ...emptySnapshot(),
        phase: 'ready' as const,
        accounts: { usd: { name: 'Dollar cash', currency: 'USD' } },
        rates: { reference: 'GEL', rates: {} },
      };
      return (
        <ReportOverview
          snapshot={snapshot}
          pickerMode="desktop"
          query={query}
          change={change}
          edit={vi.fn()}
          remove={vi.fn()}
        />
      );
    }
    render(<Harness />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'All in GEL' }));
    expect(screen.getByText(/Missing rates: USD/u)).toBeVisible();
    expect(screen.getByLabelText('Native summaries')).toHaveTextContent('USD');
    await user.click(screen.getByRole('button', { name: 'Year' }));
    expect(screen.getByRole('button', { name: 'Year' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Income' }));
    expect(screen.getByRole('button', { name: 'All in GEL' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
);

it(
  'renders a twelve-month chart and only expands months with expense or ' + 'income entries',
  async () => {
    const rows: LocatedEntry[] = [
      {
        entry: {
          id: '019949d2-89e7-7f12-8d44-0dc85e414343',
          type: 'expense',
          account: 'cash',
          date: '2026-09-13',
          amount: '12.00',
          category: 'food',
        },
        path: 'Money/Ledger/2026/09.md',
        position: 0,
      },
      {
        entry: {
          id: '019949d2-89e7-7f12-8d44-0dc85e414344',
          type: 'balance_checkpoint',
          account: 'cash',
          date: '2026-09-14',
          balance: '100.00',
        },
        path: 'Money/Ledger/2026/09.md',
        position: 1,
      },
      {
        entry: {
          id: '019949d2-89e7-7f12-8d44-0dc85e414345',
          type: 'balance_checkpoint',
          account: 'cash',
          date: '2026-10-01',
          balance: '100.00',
        },
        path: 'Money/Ledger/2026/10.md',
        position: 0,
      },
    ];
    const snapshot = {
      ...emptySnapshot(),
      phase: 'ready' as const,
      accounts: { cash: { name: 'Cash', currency: 'GEL' } },
      categories: { expense: { food: { name: 'Food' } }, income: {} },
      rates: { reference: 'GEL', rates: {} },
      entries: rows,
    };
    render(
      <ReportOverview
        snapshot={snapshot}
        pickerMode="desktop"
        query={{
          period: '2026-09',
          range: 'year',
          accounts: null,
          flow: 'expense',
          currency: 'GEL',
          converted: false,
        }}
        change={vi.fn()}
        edit={vi.fn()}
        remove={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: /Monthly totals/u })).toHaveTextContent(
      '09.2026: 12.00 GEL',
    );
    expect(screen.getByText('09.2026', { selector: 'summary' })).toBeVisible();
    expect(screen.queryByText('10.2026', { selector: 'summary' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('09.2026', { selector: 'summary' }));
    expect(screen.getByText('13.09', { selector: 'time' })).toBeVisible();
    expect(screen.getByText('14.09', { selector: 'time' })).toBeVisible();
    expect(screen.getByText('Food', { selector: '.mm-category-chip' })).toBeVisible();
  },
);
