import { expect, it } from 'vitest';
import { formatErrorMessage } from './error-message';

it('redacts absolute paths and limits raw error detail', () => {
  const message = formatErrorMessage(
    new Error(`Could not read /Users/person/private/Month/2026-09.md ${'x'.repeat(400)}`),
    'Could not load the workspace.',
  );
  expect(message).toContain('[path redacted]');
  expect(message).not.toContain('/Users/person');
  expect(message.length).toBeLessThanOrEqual(300);
});

it('turns file system codes into recovery guidance', () => {
  expect(formatErrorMessage(new Error('EACCES: permission denied'), 'Could not save rates.')).toBe(
    'Could not save rates. Check vault access and file permissions, then try again.',
  );
});
