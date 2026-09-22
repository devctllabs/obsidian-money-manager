import { useEffect, useState, type ReactNode } from 'react';
import { AttentionIcon, CheckIcon, InfoIcon } from './Icons';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

export function InlineNotice({
  tone,
  children,
  action,
  autoDismiss = false,
  onDismiss,
  role,
}: {
  tone: NoticeTone;
  children: ReactNode;
  action?: { label: string; run: () => void };
  autoDismiss?: boolean;
  onDismiss?: () => void;
  role?: 'alert' | 'status';
}) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (!autoDismiss) return;
    const exit = window.setTimeout(() => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) onDismiss?.();
      else setLeaving(true);
    }, 5000);
    return () => window.clearTimeout(exit);
  }, [autoDismiss, onDismiss]);
  useEffect(() => {
    if (!leaving) return;
    const dismiss = window.setTimeout(() => onDismiss?.(), 160);
    return () => window.clearTimeout(dismiss);
  }, [leaving, onDismiss]);
  const Icon = tone === 'success' ? CheckIcon : tone === 'info' ? InfoIcon : AttentionIcon;
  return (
    <div
      className={`mm-inline-notice is-${tone}${leaving ? ' is-leaving' : ''}`}
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
    >
      <Icon />
      <div className="mm-inline-notice-content">{children}</div>
      {action && (
        <button type="button" onClick={action.run}>
          {action.label}
        </button>
      )}
    </div>
  );
}
