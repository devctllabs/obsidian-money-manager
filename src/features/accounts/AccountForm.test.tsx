import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { AccountForm } from './AccountForm';
it(
  'keeps the observed value after partial success and retries without recreating the ' + 'account',
  async () => {
    const save = vi.fn().mockResolvedValue({ checkpointSaved: false });
    const retry = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn();
    render(<AccountForm save={save} retry={retry} close={close} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Name'), 'Everyday');
    await user.type(screen.getByLabelText('Observed balance'), '100.00');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Account saved');
    await user.click(screen.getByRole('button', { name: 'Retry checkpoint' }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(retry).toHaveBeenCalledWith('everyday', '100.00');
    expect(close).toHaveBeenCalledOnce();
  },
);
