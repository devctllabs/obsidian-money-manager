import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { AccentSetting } from './AccentSetting';

it('uses the selected swatch and button state instead of a visible success notice', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<AccentSetting appearance={{ accentMode: 'obsidian', customAccent: null }} save={save} />);
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: 'Accent color' }));
  await user.click(screen.getByRole('button', { name: 'Teal' }));
  expect(save).toHaveBeenLastCalledWith({ accentMode: 'custom', customAccent: '#0F766E' });
  expect(screen.getByRole('button', { name: 'Apply HEX' })).toBeDisabled();
  await expect
    .poll(() => screen.getByRole('button', { name: 'Teal' }).getAttribute('aria-pressed'))
    .toBe('true');
  expect(screen.getByRole('status')).toHaveTextContent('Accent color saved');
  expect(document.querySelector('.mm-inline-notice')).toBeNull();

  await user.clear(screen.getByLabelText('Custom accent HEX'));
  await user.type(screen.getByLabelText('Custom accent HEX'), '#123');
  expect(screen.getByLabelText('Custom accent HEX')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByText('Use a six-digit HEX color, for example #5B5BD6.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Apply HEX' })).toBeDisabled();
  await user.clear(screen.getByLabelText('Custom accent HEX'));
  await user.type(screen.getByLabelText('Custom accent HEX'), '#123456');
  expect(screen.getByRole('button', { name: 'Apply HEX' })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: 'Apply HEX' }));
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(await screen.findByRole('button', { name: 'Saved' })).toBeDisabled();
});
