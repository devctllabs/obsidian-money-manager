import { useRef, useState, type ReactNode } from 'react';
import { formatErrorMessage } from './error-message';
import { InlineNotice } from './InlineNotice';
export function Form({
  children,
  submit,
  label,
  close,
  destructive = false,
  submitDisabled = false,
}: {
  children: ReactNode;
  submit: (data: FormData) => Promise<void>;
  label: ReactNode;
  close?: () => void;
  destructive?: boolean;
  submitDisabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  return (
    <form
      className="mm-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (lock.current) return;
        const data = new FormData(event.currentTarget);
        lock.current = true;
        setPending(true);
        setError('');
        void submit(data)
          .catch((reason: unknown) =>
            setError(formatErrorMessage(reason, 'Could not save. Retry.')),
          )
          .finally(() => {
            lock.current = false;
            setPending(false);
          });
      }}
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        {children}
        <div className="mm-actions">
          {close && (
            <button className="mm-quiet" type="button" onClick={close}>
              Cancel
            </button>
          )}
          <button
            className={destructive ? 'mm-danger-button' : 'mod-cta'}
            type="submit"
            disabled={submitDisabled}
          >
            {pending ? 'Saving…' : label}
          </button>
        </div>
      </fieldset>
      {error && <InlineNotice tone="error">{error}</InlineNotice>}
    </form>
  );
}
export function field(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
