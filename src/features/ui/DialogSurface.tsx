import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DialogFrame } from './DialogFrame';
import { portalTheme } from './portal-theme';
export function DialogSurface({
  title,
  origin,
  close,
  children,
}: {
  title: string;
  origin: HTMLElement;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    dialog.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    return () => {
      dialog.close();
      origin.focus();
    };
  }, [origin]);
  return createPortal(
    <dialog
      ref={ref}
      className="money-manager mm-dialog"
      aria-labelledby={id}
      style={portalTheme(origin)}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <DialogFrame id={id} title={title} close={close}>
        {children}
      </DialogFrame>
    </dialog>,
    origin.ownerDocument.body,
  );
}
