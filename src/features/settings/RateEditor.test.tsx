import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { rebase } from '../../domain/rates';
import { RateEditor } from './RateEditor';
it(
  'previews a reference change and saves the complete proposal only after ' + 'confirmation',
  async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    render(
      <RateEditor
        rates={{ reference: 'GEL', rates: { USD: '2.7' } }}
        currencies={['USD', 'GEL']}
        save={save}
        proposal={(rates, reference) => rebase(rates, reference, ['GEL', 'USD'])}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Reference currency' }));
    await user.type(screen.getByRole('combobox'), 'USD');
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'Review rebase' }));
    expect(screen.getByText('0.370370370370370370')).toBeVisible();
    expect(save).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirm rebase' }));
    expect(save).toHaveBeenCalledWith(
      { reference: 'GEL', rates: { USD: '2.7' } },
      { reference: 'USD', rates: { GEL: '0.370370370370370370' } },
    );
  },
);

it('keeps a removed account currency visible and persists the removal on save', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <RateEditor
      rates={{ reference: 'GEL', rates: { USD: '2.7' } }}
      currencies={['USD', 'GEL']}
      save={save}
      proposal={(rates) => rates}
    />,
  );
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: 'Remove USD rate' }));
  expect(screen.getByLabelText('1 USD in GEL')).toHaveValue('');
  expect(save).not.toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: 'Save rates' }));
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(save).toHaveBeenCalledWith(
    { reference: 'GEL', rates: { USD: '2.7' } },
    { reference: 'GEL', rates: {} },
  );
  expect(screen.getByLabelText('1 USD in GEL')).toHaveAttribute('placeholder', 'No rate');
  expect(await screen.findByRole('button', { name: 'Saved' })).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('Rates saved');
  expect(document.querySelector('.mm-inline-notice')).toBeNull();
});
