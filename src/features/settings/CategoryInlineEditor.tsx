import { useId, useRef, useState } from 'react';
import type { Category } from '../../domain/entry';
import { ColorPalette } from '../ui/ColorPalette';
import { formatErrorMessage } from '../ui/error-message';
import { InlineNotice } from '../ui/InlineNotice';
import { SaveButtonLabel, withSaveFeedback } from '../ui/SaveFeedback';
export function CategoryInlineEditor({
  category,
  categoryKey,
  save,
  confirmed = false,
  changed,
}: {
  category: Category;
  categoryKey: string;
  save: (update: { expected: Category; nextKey: string; category: Category }) => Promise<void>;
  confirmed?: boolean;
  changed?: () => void;
}) {
  const [expected, setExpected] = useState(category);
  const [expectedKey, setExpectedKey] = useState(categoryKey);
  const [name, setName] = useState(category.name);
  const [key, setKey] = useState(categoryKey);
  const [hex, setHex] = useState(category.color ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const lock = useRef(false);
  const hexId = useId();
  const next = categoryDraft(expected, name, hex);
  const dirty = categoryChanged(expected, expectedKey, next, key);
  const showSaved = saved || confirmed;
  const invalidHex = hex !== '' && !validCategoryColor(hex);
  const changeDraft = (update: () => void) => {
    update();
    setSaved(false);
    changed?.();
  };
  const commit = async () => {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError('');
    setSaved(false);
    try {
      await withSaveFeedback(() => save({ expected, nextKey: key.trim(), category: next }));
      setExpected(next);
      setExpectedKey(key.trim());
      setSaved(true);
    } catch (cause) {
      setError(formatErrorMessage(cause, 'Could not save category. Retry.'));
    } finally {
      lock.current = false;
      setPending(false);
    }
  };
  return (
    <form
      className="mm-category-inline-editor mm-inline-category-form"
      onSubmit={(event) => {
        event.preventDefault();
        void commit();
      }}
    >
      <fieldset disabled={pending}>
        <div className="mm-entry-fields">
          <label>
            Name
            <input
              aria-label="Name"
              value={name}
              required
              onChange={(event) => changeDraft(() => setName(event.target.value))}
            />
          </label>
          <label>
            Key
            <input
              value={key}
              required
              onChange={(event) => changeDraft(() => setKey(event.target.value))}
            />
          </label>
        </div>
        <p className="mm-muted">Referenced keys cannot change. Names and colors can.</p>
        <CategoryColorEditor
          hexId={hexId}
          hex={hex}
          invalid={invalidHex}
          pending={pending}
          canSave={categoryCanSave(name, key, hex, dirty)}
          saved={showSaved}
          change={(color) => changeDraft(() => setHex(color))}
        />
        {error && <InlineNotice tone="error">{error}</InlineNotice>}
        <p className="mm-sr-only" role="status">
          {showSaved ? `Category saved: ${next.name}` : ''}
        </p>
      </fieldset>
    </form>
  );
}

function CategoryColorEditor({
  hexId,
  hex,
  invalid,
  pending,
  canSave,
  saved,
  change,
}: {
  hexId: string;
  hex: string;
  invalid: boolean;
  pending: boolean;
  canSave: boolean;
  saved: boolean;
  change: (color: string) => void;
}) {
  return (
    <>
      <ColorPalette value={hex} automatic="Neutral" disabled={pending} change={change} />
      <div className="mm-custom-color mm-category-color-action">
        <label htmlFor={hexId}>Custom HEX</label>
        <input
          id={hexId}
          aria-label="Category color HEX"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${hexId}-error` : undefined}
          value={hex}
          maxLength={7}
          onChange={(event) => change(event.target.value.toUpperCase())}
          placeholder="#6750A4"
        />
        {invalid && (
          <p id={`${hexId}-error`} className="mm-field-error">
            Use a six-digit HEX color, for example #5B5BD6.
          </p>
        )}
        <button className="mod-cta" type="submit" disabled={!canSave}>
          {categorySaveLabel(pending, saved)}
        </button>
      </div>
    </>
  );
}

function categoryDraft(expected: Category, name: string, color: string): Category {
  return { ...expected, name: name.trim(), color: color || undefined };
}
function categoryChanged(expected: Category, expectedKey: string, next: Category, key: string) {
  return next.name !== expected.name || key.trim() !== expectedKey || next.color !== expected.color;
}
function categoryCanSave(name: string, key: string, color: string, dirty: boolean) {
  const validColor = color === '' || validCategoryColor(color);
  return validColor && name.trim() !== '' && key.trim() !== '' && dirty;
}
function validCategoryColor(color: string) {
  return /^#[\dA-F]{6}$/u.test(color);
}
function categorySaveLabel(pending: boolean, saved: boolean) {
  if (pending) return 'Saving…';
  return <SaveButtonLabel saved={saved}>Save changes</SaveButtonLabel>;
}
