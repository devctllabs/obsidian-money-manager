import { useId, useState } from 'react';
import type { Category, Flow } from '../../domain/entry';
import { normalizeKey } from '../../domain/validation';
import { DialogSurface } from '../ui/DialogSurface';
import { ChevronIcon, SearchIcon, PlusIcon } from '../ui/Icons';
import { categoryColor } from '../../application/reports/aggregates';
interface Props {
  categories: Record<string, Category>;
  value: string;
  change: (value: string) => void;
  flow: Flow;
}
export function CategoryPicker({ categories, value, change, flow }: Props) {
  const [origin, setOrigin] = useState<HTMLButtonElement | null>(null);
  const id = useId();
  return (
    <div className="mm-field mm-category-field">
      <label id={id}>Category</label>
      <button
        className="mm-picker-trigger"
        type="button"
        aria-labelledby={id}
        aria-haspopup="dialog"
        aria-expanded={origin !== null}
        onClick={(event) => setOrigin(event.currentTarget)}
      >
        <span>{categories[value]?.name ?? (value || 'Uncategorized')}</span>
        <ChevronIcon />
      </button>
      {origin && (
        <DialogSurface
          title={`Choose ${flow} category`}
          origin={origin}
          close={() => setOrigin(null)}
        >
          <CategorySearch
            categories={categories}
            choose={(next) => {
              change(next);
              setOrigin(null);
            }}
          />
        </DialogSurface>
      )}
    </div>
  );
}
function CategorySearch({
  categories,
  choose,
}: {
  categories: Record<string, Category>;
  choose: (value: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const id = useId();
  const term = query.trim().toLowerCase();
  const matches = Object.entries(categories)
    .filter(([key, category]) => `${key} ${category.name}`.toLowerCase().includes(term))
    .sort((a, b) => a[1].name.localeCompare(b[1].name));
  const options = matches.slice(0, 8);
  const position = Math.min(active, Math.max(0, options.length - 1));
  const canCreate =
    !!term &&
    !Object.prototype.hasOwnProperty.call(categories, normalizeKey(query)) &&
    !Object.values(categories).some((category) => category.name.toLowerCase() === term);
  return (
    <>
      <div className="mm-search">
        <SearchIcon />
        <input
          type="search"
          role="combobox"
          aria-label="Search categories"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls={id}
          aria-activedescendant={options.length ? `${id}-${position}` : undefined}
          placeholder="Find a category or type a new name…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setActive(
                (position + (event.key === 'ArrowDown' ? 1 : -1) + options.length) %
                  Math.max(1, options.length),
              );
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              if (options[position]) choose(options[position][0]);
              else if (canCreate) choose(query.trim());
            }
          }}
        />
      </div>
      <div className="mm-picker-actions">
        <button className="mm-quiet" type="button" onClick={() => choose('')}>
          Uncategorized
        </button>
        <span>{matches.length} matches</span>
      </div>
      <CategorySearchResults
        id={id}
        matches={matches}
        options={options}
        position={position}
        canCreate={canCreate}
        query={query}
        choose={choose}
      />
    </>
  );
}

function CategorySearchResults({
  id,
  matches,
  options,
  position,
  canCreate,
  query,
  choose,
}: {
  id: string;
  matches: Array<[string, Category]>;
  options: Array<[string, Category]>;
  position: number;
  canCreate: boolean;
  query: string;
  choose: (value: string) => void;
}) {
  return (
    <>
      <ul
        id={id}
        className="mm-picker-options mm-category-options"
        role="listbox"
        aria-label="Matching categories"
      >
        {options.map(([key, category], index) => (
          <li
            key={key}
            id={`${id}-${index}`}
            role="option"
            aria-selected={position === index}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => choose(key)}
          >
            <span
              className="mm-dot"
              style={{ backgroundColor: categoryColor(key, category.color) }}
            />
            <strong>{category.name}</strong>
            <small>{key}</small>
          </li>
        ))}
      </ul>
      {matches.length > 8 && (
        <p className="mm-muted" role="status">
          Showing 8 of {matches.length}. Keep typing to narrow the results.
        </p>
      )}
      {!matches.length && (
        <p className="mm-muted" role="status">
          No matching categories.
        </p>
      )}
      {canCreate && (
        <button className="mm-create-category" type="button" onClick={() => choose(query.trim())}>
          <PlusIcon />
          Create “{query.trim()}”
        </button>
      )}
    </>
  );
}
