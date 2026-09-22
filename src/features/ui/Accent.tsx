import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { Settings } from '../../application/workspace/settings';
import { customAccentPalettes } from './accent-palette';
export function Accent({
  appearance,
  children,
}: {
  appearance: Settings['appearance'];
  children: ReactNode;
}) {
  const style = useMemo<CSSProperties>(() => {
    if (appearance.accentMode === 'obsidian') return {};
    const palette = customAccentPalettes(
      appearance.accentMode === 'indigo' ? '#5B5BD6' : (appearance.customAccent ?? '#5B5BD6'),
    );
    return Object.fromEntries(
      (['light', 'dark'] as const).flatMap((theme) =>
        Object.entries(palette[theme]).map(([role, value]) => [
          `--mm-custom-${theme}-${role}`,
          value,
        ]),
      ),
    );
  }, [appearance.accentMode, appearance.customAccent]);
  return (
    <div className="mm-accent" data-accent={appearance.accentMode} style={style}>
      {children}
    </div>
  );
}
