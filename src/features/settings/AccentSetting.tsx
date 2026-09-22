import { useId, useRef, useState } from 'react';
import type { Settings } from '../../application/workspace/settings';
import { ColorPalette } from '../ui/ColorPalette';
import { ChevronIcon } from '../ui/Icons';
import { formatErrorMessage } from '../ui/error-message';
import { InlineNotice } from '../ui/InlineNotice';
import { SaveButtonLabel, withSaveFeedback } from '../ui/SaveFeedback';
export function AccentSetting({
  appearance,
  save,
}: {
  appearance: Settings['appearance'];
  save: (next: Settings['appearance']) => Promise<void>;
}) {
  const appearanceValue = accentColor(appearance);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(appearanceValue);
  const [hex, setHex] = useState(appearanceValue);
  const [pendingSource, setPendingSource] = useState<'palette' | 'custom' | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [customSaved, setCustomSaved] = useState(false);
  const lock = useRef(false);
  const id = useId();
  const commit = async (color: string, source: 'palette' | 'custom') => {
    if (lock.current) return;
    lock.current = true;
    setPendingSource(source);
    setError('');
    setSaved('');
    setCustomSaved(false);
    try {
      await withSaveFeedback(() => save(accentPreference(color)));
      setSelected(color);
      setHex(color);
      setSaved('Accent color saved');
      setCustomSaved(source === 'custom');
    } catch (cause) {
      setError(formatErrorMessage(cause, 'Could not save color. Retry.'));
    } finally {
      lock.current = false;
      setPendingSource(null);
    }
  };
  const pending = pendingSource !== null;
  const customDirty = validAccent(hex) && hex !== selected;
  const invalidHex = hex !== '' && !validAccent(hex);
  const selectedLabel = accentLabel(selected);
  return (
    <section className="mm-appearance" aria-label="Appearance">
      <AccentDisclosure
        expanded={expanded}
        controls={id}
        selectedLabel={selectedLabel}
        toggle={() => setExpanded(!expanded)}
      />
      <div id={id} className="mm-appearance-panel" hidden={!expanded}>
        <ColorPalette
          value={selected}
          automatic="Obsidian"
          disabled={pending}
          change={(color) => {
            void commit(color, 'palette');
          }}
        />
        <form
          className="mm-custom-color"
          onSubmit={(event) => {
            event.preventDefault();
            if (customDirty) void commit(hex, 'custom');
          }}
        >
          <label>
            Custom HEX
            <input
              aria-label="Custom accent HEX"
              aria-invalid={invalidHex || undefined}
              aria-describedby={invalidHex ? `${id}-hex-error` : undefined}
              maxLength={7}
              placeholder="#5B5BD6"
              value={hex}
              disabled={pending}
              onChange={(event) => {
                setHex(event.target.value.toUpperCase());
                setSaved('');
                setCustomSaved(false);
              }}
            />
          </label>
          <button disabled={pending || !customDirty}>
            {accentSaveLabel(pendingSource === 'custom', customSaved)}
          </button>
        </form>
        {invalidHex && (
          <p id={`${id}-hex-error`} className="mm-field-error">
            Use a six-digit HEX color, for example #5B5BD6.
          </p>
        )}
        {error && <InlineNotice tone="error">{error}</InlineNotice>}
        <p className="mm-sr-only" role="status">
          {saved}
        </p>
      </div>
    </section>
  );
}

function AccentDisclosure({
  expanded,
  controls,
  selectedLabel,
  toggle,
}: {
  expanded: boolean;
  controls: string;
  selectedLabel: string;
  toggle: () => void;
}) {
  return (
    <h2>
      <button
        type="button"
        className="mm-settings-disclosure"
        aria-label="Accent color"
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={toggle}
      >
        <span>
          <strong>Accent color</strong>
          <small>Obsidian accent or your own palette, adapted to light and dark</small>
        </span>
        <span className="mm-accent-value">
          <i className="mm-dot" />
          {selectedLabel}
        </span>
        <ChevronIcon direction={expanded ? 'down' : 'right'} />
      </button>
    </h2>
  );
}

function accentColor(appearance: Settings['appearance']) {
  if (appearance.accentMode === 'indigo') return '#5B5BD6';
  return appearance.customAccent ?? '';
}
function accentPreference(color: string): Settings['appearance'] {
  if (color === '') return { accentMode: 'obsidian', customAccent: null };
  if (color === '#5B5BD6') return { accentMode: 'indigo', customAccent: null };
  return { accentMode: 'custom', customAccent: color };
}
function accentLabel(color: string) {
  if (color === '') return 'Obsidian';
  if (color === '#5B5BD6') return 'Indigo';
  return color;
}
function validAccent(color: string) {
  return /^#[\dA-F]{6}$/u.test(color);
}
function accentSaveLabel(pending: boolean, saved: boolean) {
  if (pending) return 'Saving…';
  return <SaveButtonLabel saved={saved}>Apply HEX</SaveButtonLabel>;
}
