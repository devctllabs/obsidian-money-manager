import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { InlineNotice } from './InlineNotice';

it('exposes an error as an alert and runs its recovery action', async () => {
  const action = vi.fn();
  render(
    <InlineNotice tone="error" action={{ label: 'Retry', run: action }}>
      Could not save.
    </InlineNotice>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Could not save.');
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(action).toHaveBeenCalledOnce();
});

it('dismisses a transient success after its exit animation', async () => {
  vi.useFakeTimers();
  const dismiss = vi.fn();
  render(
    <InlineNotice tone="success" autoDismiss onDismiss={dismiss}>
      Saved.
    </InlineNotice>,
  );
  await act(async () => vi.advanceTimersByTime(5000));
  await act(async () => vi.advanceTimersByTime(160));
  expect(dismiss).toHaveBeenCalledOnce();
  vi.useRealTimers();
});
