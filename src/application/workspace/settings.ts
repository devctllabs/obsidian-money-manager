import { normalizeRoot } from '../../domain/workspace-document';
export interface Settings {
  schemaVersion: 1;
  workspaceRoot: string;
  appearance: { accentMode: 'obsidian' | 'indigo' | 'custom'; customAccent: string | null };
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}
export function normalizeSettings(raw: unknown): Settings {
  const value = object(raw);
  let workspaceRoot = 'Money Manager';
  try {
    if (typeof value.workspaceRoot === 'string') workspaceRoot = normalizeRoot(value.workspaceRoot);
  } catch {
    /* Invalid paths use the safe default. */
  }
  const appearance = object(value.appearance);
  const custom =
    typeof appearance.customAccent === 'string' && /^#[\da-f]{6}$/iu.test(appearance.customAccent)
      ? appearance.customAccent
      : null;
  const accentMode =
    appearance.accentMode === 'indigo'
      ? 'indigo'
      : appearance.accentMode === 'custom' && custom
        ? 'custom'
        : 'obsidian';
  return {
    schemaVersion: 1,
    workspaceRoot,
    appearance: { accentMode, customAccent: accentMode === 'custom' ? custom : null },
  };
}
export class SettingsWorkflow {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(
    public current: Settings,
    private readonly save: (settings: Settings) => Promise<void>,
  ) {}
  update(settings: Settings): Promise<void> {
    const task = this.tail.then(async () => {
      const next = normalizeSettings(settings);
      await this.save(next);
      this.current = next;
    });
    this.tail = task.catch(() => undefined);
    return task;
  }
}
