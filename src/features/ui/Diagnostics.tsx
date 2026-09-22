import type { Diagnostic } from '../../domain/entry';
export function Diagnostics({
  items,
  open,
}: {
  items: Diagnostic[];
  open: (path: string) => void;
}) {
  if (!items.length) return null;
  return (
    <aside className="mm-diagnostics" aria-label="Data diagnostics">
      <h3>
        {items.some((item) => item.monetary)
          ? 'Incomplete data — totals may be understated'
          : 'Some references need attention'}
      </h3>
      <p>Fix the source Markdown to update these results.</p>
      <ul>
        {items.map((item, position) => (
          <li key={`${item.path}-${position}`}>
            <button className="mm-link" onClick={() => open(item.path)}>
              {item.path}
            </button>
            <span>
              {item.record && `${item.record} · `}
              {item.field}: {item.message}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
