import type { ReactNode } from 'react';
import { CloseIcon } from './Icons';
export function DialogFrame({
  id,
  title,
  close,
  children,
}: {
  id: string;
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mm-dialog-content">
      <header>
        <h2 id={id}>{title}</h2>
        <button type="button" className="mm-icon-button" aria-label="Close dialog" onClick={close}>
          <CloseIcon />
        </button>
      </header>
      {children}
    </div>
  );
}
