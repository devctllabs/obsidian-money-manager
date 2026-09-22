import type { ReactNode } from 'react';
import { CheckIcon } from './Icons';

export async function withSaveFeedback<T>(operation: () => Promise<T>): Promise<T> {
  const [result] = await Promise.allSettled([
    operation(),
    new Promise<void>((resolve) => window.setTimeout(resolve, 350)),
  ]);
  if (result.status === 'rejected') throw result.reason;
  return result.value;
}

export function SaveButtonLabel({ saved, children }: { saved: boolean; children: ReactNode }) {
  if (!saved) return children;
  return (
    <span className="mm-save-label">
      <CheckIcon />
      Saved
    </span>
  );
}
