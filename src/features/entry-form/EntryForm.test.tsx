import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { EntryForm } from './EntryForm';
const accounts = { cash: { name: 'Cash', currency: 'GEL' } };
it('edits an existing local minute and can clear the optional time', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(
    <EntryForm
      pickerMode="native"
      accounts={accounts}
      categories={{ expense: {}, income: {} }}
      today="2026-09-13"
      initial={{
        id: '019949d2-89e7-7f12-8d44-0dc85e414342',
        type: 'expense',
        account: 'cash',
        date: '2026-09-12T14:35',
        amount: '7.00',
      }}
      save={save}
      close={vi.fn()}
      goAccounts={vi.fn()}
    />,
  );
  const time = screen.getByLabelText('Time (optional)');
  expect(time).toHaveValue('14:35');
  await user.click(screen.getByRole('button', { name: 'Save entry' }));
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ date: '2026-09-12T14:35' }));
  await user.click(screen.getByRole('button', { name: 'Clear time' }));
  expect(time).toHaveValue('');
  await user.click(screen.getByRole('button', { name: 'Save entry' }));
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ date: '2026-09-12' }));
});
it(
  'focuses amount, submits a native expense with a new category and retains the draft on ' +
    'failure',
  async () => {
    const save = vi.fn().mockRejectedValue(new Error('Category saved; entry not saved'));
    render(
      <EntryForm
        pickerMode="native"
        accounts={accounts}
        categories={{ expense: {}, income: {} }}
        today="2026-09-13"
        save={save}
        close={vi.fn()}
        goAccounts={vi.fn()}
      />,
    );
    const user = userEvent.setup();
    expect(screen.getByLabelText('Amount (GEL)')).toHaveFocus();
    await user.type(screen.getByLabelText('Amount (GEL)'), '7.00');
    const category = screen.getByRole('combobox', { name: 'Category' });
    await user.type(category, 'Food');
    await user.click(screen.getByRole('button', { name: 'Save entry' }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'expense', amount: '7.00', newCategory: 'Food' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Category saved');
    expect(screen.getByLabelText('Amount (GEL)')).toHaveValue('7.00');
    await user.selectOptions(screen.getByLabelText('Entry type'), 'income');
    expect(category).toHaveValue('');
  },
);
it('routes an empty workspace to Accounts', async () => {
  const goAccounts = vi.fn();
  render(
    <EntryForm
      pickerMode="desktop"
      accounts={{}}
      categories={{ expense: {}, income: {} }}
      today="2026-09-13"
      save={vi.fn()}
      close={vi.fn()}
      goAccounts={goAccounts}
    />,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Go to accounts' }));
  expect(goAccounts).toHaveBeenCalledOnce();
});

it('selects a day and a themed time in the desktop entry form before saving', async () => {
  const user = userEvent.setup();
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <EntryForm
      pickerMode="desktop"
      accounts={accounts}
      categories={{ expense: {}, income: {} }}
      today="2026-09-13"
      save={save}
      close={vi.fn()}
      goAccounts={vi.fn()}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Date' }));
  const calendar = within(screen.getByRole('dialog', { name: 'Choose date' }));
  expect(calendar.getByRole('button', { name: '14 September 2026' })).toBeDisabled();
  await user.click(calendar.getByRole('button', { name: '12 September 2026' }));
  const time = screen.getByRole('button', { name: 'Time (optional)' });
  await user.click(time);
  const picker = within(screen.getByRole('dialog', { name: 'Choose time' }));
  await user.clear(picker.getByLabelText('Hour'));
  await user.type(picker.getByLabelText('Hour'), '14');
  await user.clear(picker.getByLabelText('Minute'));
  await user.type(picker.getByLabelText('Minute'), '35');
  await user.click(picker.getByRole('button', { name: 'Set time' }));
  expect(time).toHaveFocus();
  expect(save).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('Amount (GEL)'), '12.30');
  await user.click(screen.getByRole('button', { name: 'Save entry' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-09-12T14:35' }));
  await user.click(screen.getByRole('button', { name: 'Clear time' }));
  expect(time).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Save entry' }));
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ date: '2026-09-12' }));
});

it('uses signed flow segments and a searchable account picker on desktop', async () => {
  const user = userEvent.setup();
  render(
    <EntryForm
      pickerMode="desktop"
      accounts={{ ...accounts, usd: { name: 'Dollar cash', currency: 'USD' } }}
      categories={{ expense: { food: { name: 'Food' } }, income: { salary: { name: 'Salary' } } }}
      today="2026-09-13"
      save={vi.fn()}
      close={vi.fn()}
      goAccounts={vi.fn()}
    />,
  );

  await user.click(screen.getByRole('button', { name: '+ Income' }));
  expect(screen.getByRole('button', { name: '+ Income' })).toHaveAttribute('aria-pressed', 'true');
  const trigger = screen.getByRole('button', { name: 'Account' });
  await user.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Choose account' });
  await user.type(screen.getByRole('searchbox', { name: 'Find an account' }), 'Dollar');
  await user.click(within(dialog).getByRole('option', { name: /Dollar cash/u }));
  expect(trigger).toHaveFocus();
  expect(screen.getByLabelText('Amount (USD)')).toBeVisible();
});

it('limits the desktop account picker to the original currency while editing', async () => {
  const user = userEvent.setup();
  render(
    <EntryForm
      pickerMode="desktop"
      accounts={{
        cash: { name: 'Cash', currency: 'GEL' },
        reserve: { name: 'Reserve', currency: 'GEL' },
        usd: { name: 'Dollar cash', currency: 'USD' },
      }}
      categories={{ expense: {}, income: {} }}
      today="2026-09-13"
      initial={{
        id: '019949d2-89e7-7f12-8d44-0dc85e414342',
        type: 'expense',
        account: 'cash',
        date: '2026-09-13',
        amount: '1.00',
      }}
      save={vi.fn()}
      close={vi.fn()}
      goAccounts={vi.fn()}
    />,
  );

  await user.click(screen.getByRole('button', { name: 'Account' }));
  const dialog = screen.getByRole('dialog', { name: 'Choose account' });
  expect(within(dialog).getByRole('option', { name: /Reserve/u })).toBeVisible();
  expect(within(dialog).queryByRole('option', { name: /Dollar cash/u })).not.toBeInTheDocument();
});
