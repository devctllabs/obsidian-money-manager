import { useState } from 'react';
import { ColorPalette } from '../ui/ColorPalette';
import type { Category, Flow } from '../../domain/entry';
import { normalizeKey } from '../../domain/validation';
import { Form, field } from '../ui/Form';
export function CategoryForm({
  flow,
  initial,
  save,
  close,
  suggestedName,
}: {
  flow: Flow;
  suggestedName?: string;
  initial?: Category & { key: string };
  save: (key: string, category: Category) => Promise<void>;
  close: () => void;
}) {
  const [color, setColor] = useState(initial?.color ?? '');
  return (
    <Form
      label="Save category"
      close={close}
      submit={async (data) => {
        const name = field(data, 'name');
        await save(field(data, 'key') || normalizeKey(name), {
          name,
          color: field(data, 'color') || undefined,
        });
        close();
      }}
    >
      <p>{flow === 'expense' ? 'Expense' : 'Income'} category</p>
      <label>
        Name
        <input name="name" required defaultValue={initial?.name ?? suggestedName ?? ''} />
      </label>
      <label>
        Key
        <input name="key" defaultValue={initial?.key ?? ''} placeholder="Derived from name" />
      </label>
      <div className="mm-field">
        <span>Category color</span>
        <ColorPalette value={color} change={setColor} />
        <label>
          Custom HEX
          <input
            name="color"
            aria-label="Category color HEX"
            pattern="#[0-9a-fA-F]{6}"
            value={color}
            onChange={(event) => setColor(event.target.value.toUpperCase())}
            placeholder="#0F766E"
          />
        </label>
      </div>
      <p className="mm-muted">
        An unset color is chosen consistently for display. It is not written to your catalog.
      </p>
    </Form>
  );
}
