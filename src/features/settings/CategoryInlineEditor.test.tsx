import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { CategoryInlineEditor } from './CategoryInlineEditor';

it('saves category details and color together', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<CategoryInlineEditor category={{ name: 'Food' }} categoryKey="food" save={save} />);
  const user = userEvent.setup();
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();

  const customHex = screen.getByLabelText('Category color HEX');
  await user.type(customHex, '#123');
  expect(customHex).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('Use a six-digit HEX color, for example #5B5BD6.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  await user.clear(customHex);
  expect(
    screen.queryByText('Use a six-digit HEX color, for example #5B5BD6.'),
  ).not.toBeInTheDocument();

  await user.clear(screen.getByLabelText('Name'));
  await user.type(screen.getByLabelText('Name'), 'Groceries');
  await user.click(screen.getByRole('button', { name: 'Teal' }));
  expect(save).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Save changes' }).closest('.mm-custom-color'),
  ).not.toBeNull();

  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(save).toHaveBeenCalledWith({
    expected: { name: 'Food' },
    nextKey: 'food',
    category: { name: 'Groceries', color: '#0F766E' },
  });
  expect(await screen.findByRole('button', { name: 'Saved' })).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('Category saved: Groceries');
  expect(document.querySelector('.mm-inline-notice')).toBeNull();

  await user.type(screen.getByLabelText('Name'), ' updated');
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
});
