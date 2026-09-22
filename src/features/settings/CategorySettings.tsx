import { useState, type CSSProperties } from 'react';
import { ActionMenu, MenuAction } from '../ui/ActionMenu';
import { ChevronIcon } from '../ui/Icons';
import type { Category, Flow } from '../../domain/entry';
import { CategoryInlineEditor } from './CategoryInlineEditor';
interface Props {
  categories: Record<Flow, Record<string, Category>>;
  create: (flow: Flow, name?: string) => void;
  remove: (flow: Flow, key: string) => void;
  save: (
    flow: Flow,
    key: string,
    update: { expected: Category; nextKey: string; category: Category },
  ) => Promise<void>;
}
export function CategorySettings(props: Props) {
  return (
    <section>
      <h2>Categories</h2>
      {(['expense', 'income'] as const).map((flow) => (
        <CategoryList {...props} flow={flow} key={flow} />
      ))}
    </section>
  );
}
function CategoryList({ categories, create, remove, save, flow }: Props & { flow: Flow }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const matches = Object.entries(categories[flow])
    .filter(([key, category]) =>
      `${key} ${category.name}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => a[1].name.localeCompare(b[1].name));
  const current = Math.min(page, Math.max(0, Math.ceil(matches.length / 6) - 1));
  const changePage = (next: number) => {
    setPage(next);
    setEditing(null);
  };
  return (
    <section aria-label={`${flow} categories`} className="mm-category-settings">
      <div className="mm-section-heading">
        <h3>
          {flow === 'expense' ? 'Expense' : 'Income'} categories{' '}
          <span className="mm-muted">{Object.keys(categories[flow]).length}</span>
        </h3>
        <button className="mm-quiet" onClick={() => create(flow, query.trim() || undefined)}>
          Add category
        </button>
      </div>
      <input
        type="search"
        className="mm-category-search"
        aria-label={`Find or add ${flow} category`}
        placeholder="Find or add a category…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          changePage(0);
        }}
      />
      {!matches.length && (
        <p className="mm-muted">
          {query
            ? 'No categories match. Add this category to the catalog.'
            : 'No categories yet. Entries can stay uncategorized.'}
        </p>
      )}
      <ul className="mm-category-catalog">
        {matches.slice(current * 6, current * 6 + 6).map(([key, category]) => (
          <CategoryRow
            key={key}
            categoryKey={key}
            category={category}
            expanded={editing === key}
            confirmed={saved === key}
            toggle={() => setEditing(editing === key ? null : key)}
            remove={() => remove(flow, key)}
            changed={() => setSaved(null)}
            save={async (update) => {
              await save(flow, key, update);
              setQuery((current) =>
                `${update.nextKey} ${update.category.name}`
                  .toLowerCase()
                  .includes(current.trim().toLowerCase())
                  ? current
                  : '',
              );
              setEditing(update.nextKey);
              setSaved(update.nextKey);
            }}
          />
        ))}
      </ul>
      {matches.length > 6 && (
        <nav className="mm-pagination" aria-label={`${flow} category pages`}>
          <span>
            {current * 6 + 1}–{Math.min(current * 6 + 6, matches.length)} of {matches.length}
          </span>
          <button
            className="mm-icon-button"
            aria-label={`Previous ${flow} categories`}
            disabled={current === 0}
            onClick={() => changePage(current - 1)}
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            className="mm-icon-button"
            aria-label={`Next ${flow} categories`}
            disabled={(current + 1) * 6 >= matches.length}
            onClick={() => changePage(current + 1)}
          >
            <ChevronIcon direction="right" />
          </button>
        </nav>
      )}
    </section>
  );
}

function CategoryRow({
  categoryKey,
  category,
  expanded,
  confirmed,
  toggle,
  remove,
  changed,
  save,
}: {
  categoryKey: string;
  category: Category;
  expanded: boolean;
  confirmed: boolean;
  toggle: () => void;
  remove: () => void;
  changed: () => void;
  save: (update: { expected: Category; nextKey: string; category: Category }) => Promise<void>;
}) {
  return (
    <li>
      <div className={`mm-category-row-shell${expanded ? ' is-expanded' : ''}`}>
        <button
          type="button"
          className="mm-category-row"
          aria-label={`Edit ${category.name}`}
          aria-expanded={expanded}
          onClick={toggle}
        >
          <span
            className={`mm-category-chip${category.color ? ' is-colored' : ''}`}
            style={
              category.color
                ? ({ '--mm-category-color': category.color } as CSSProperties)
                : undefined
            }
          >
            {category.name}
          </span>
          <span className="mm-category-row-value">
            <span
              className="mm-category-color-marker"
              style={category.color ? { backgroundColor: category.color } : undefined}
              aria-hidden="true"
            />
            <span>{category.color ?? 'Neutral'}</span>
            <ChevronIcon direction={expanded ? 'down' : 'right'} />
          </span>
        </button>
        {expanded && (
          <span className="mm-category-row-actions">
            <ActionMenu label={`More actions for ${category.name}`}>
              <MenuAction destructive onClick={remove}>
                Delete category…
              </MenuAction>
            </ActionMenu>
          </span>
        )}
      </div>
      {expanded && (
        <CategoryInlineEditor
          category={category}
          categoryKey={categoryKey}
          confirmed={confirmed}
          changed={changed}
          save={save}
        />
      )}
    </li>
  );
}
