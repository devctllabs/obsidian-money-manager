import { ChevronIcon } from '../ui/Icons';
import { useId, useState } from 'react';
import type { Report } from '../../application/reports/period-report';
export function CategoryChart({
  report,
  currency,
  flow,
}: {
  report: Report;
  currency: string;
  flow: string;
}) {
  const title = useId();
  const tooltip = useId();
  const [page, setPage] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const pageCount = Math.ceil(report.groups.length / 6);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const visible = report.groups.slice(currentPage * 6, currentPage * 6 + 6);
  const pageLabel = [
    `${currentPage * 6 + 1}–${Math.min((currentPage + 1) * 6, report.groups.length)}`,
    `${report.groups.length} categories`,
  ].join(' of ');
  let offset = 0;
  const segments = [];
  for (const group of report.groups) {
    segments.push({ ...group, start: offset });
    offset += group.share;
  }
  const activeGroup = segments.find((group) => group.key === active);
  return (
    <figure className="mm-chart">
      <figcaption>
        {flow} · {currency}
      </figcaption>
      <div className="mm-chart-body">
        <CategoryRing
          title={title}
          tooltip={tooltip}
          flow={flow}
          currency={currency}
          total={report.total}
          segments={segments}
          active={active}
          activeGroup={activeGroup}
          setActive={setActive}
        />
        <CategoryLegend
          flow={flow}
          currency={currency}
          total={report.total}
          groups={report.groups}
          visible={visible}
          active={active}
          currentPage={currentPage}
          pageCount={pageCount}
          pageLabel={pageLabel}
          setPage={setPage}
        />
      </div>
    </figure>
  );
}

type Segment = Report['groups'][number] & { start: number };

function CategoryRing({
  title,
  tooltip,
  flow,
  currency,
  total,
  segments,
  active,
  activeGroup,
  setActive,
}: {
  title: string;
  tooltip: string;
  flow: string;
  currency: string;
  total: Report['total'];
  segments: Segment[];
  active: string | null;
  activeGroup?: Segment;
  setActive: (key: string | null | ((current: string | null) => string | null)) => void;
}) {
  return (
    <div className="mm-ring">
      <svg viewBox="0 0 120 120" role="img" aria-labelledby={title}>
        <title id={title}>{flow} by category. Exact amounts and percentages follow.</title>
        <circle className="mm-ring-track" cx="60" cy="60" r="48" fill="none" strokeWidth="8" />
        {segments.map((group) => {
          const gap = segments.length > 1 ? Math.min(0.75, group.share * 0.2) : 0;
          const share = Math.max(0.05, group.share - gap);
          const label = [
            `${group.label}:`,
            `${group.amount} ${currency},`,
            `${group.share.toFixed(1)}%`,
          ].join(' ');
          return (
            <circle
              key={group.key}
              className={active === group.key ? 'is-active' : undefined}
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke={chartColor(group.key, group.color)}
              strokeWidth="8"
              pathLength="100"
              strokeDasharray={`${share} ${100 - share}`}
              strokeDashoffset={-(group.start + gap / 2)}
              transform="rotate(-90 60 60)"
              role="graphics-symbol"
              tabIndex={0}
              aria-label={label}
              aria-describedby={active === group.key ? tooltip : undefined}
              onPointerEnter={() => setActive(group.key)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(group.key)}
              onBlur={() => setActive(null)}
              onClick={() => setActive((current) => (current === group.key ? null : group.key))}
            />
          );
        })}
      </svg>
      <div className="mm-ring-label">
        <strong>{total}</strong>
        <span>{currency}</span>
      </div>
      {activeGroup && (
        <div
          id={tooltip}
          className="mm-chart-tooltip"
          role="tooltip"
          style={tooltipPosition(activeGroup.start, activeGroup.share)}
        >
          <strong>{activeGroup.label}</strong>
          <span>
            {activeGroup.amount} {currency}
          </span>
          <span>{activeGroup.share.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}

function CategoryLegend({
  flow,
  currency,
  total,
  groups,
  visible,
  active,
  currentPage,
  pageCount,
  pageLabel,
  setPage,
}: {
  flow: string;
  currency: string;
  total: Report['total'];
  groups: Report['groups'];
  visible: Report['groups'];
  active: string | null;
  currentPage: number;
  pageCount: number;
  pageLabel: string;
  setPage: (page: number) => void;
}) {
  return (
    <div className="mm-legend">
      <ul className="mm-paged-legend">
        {!groups.length ? (
          <li className="mm-legend-empty">No {flow.toLowerCase()} for this selection.</li>
        ) : (
          visible.map((group) => (
            <li key={group.key} className={active === group.key ? 'is-active' : undefined}>
              <span className="mm-category-label">
                <span
                  className="mm-dot"
                  style={{ backgroundColor: chartColor(group.key, group.color) }}
                  aria-hidden="true"
                />
                {group.label}
              </span>
              <span className="mm-amount">{group.amount}</span>
              <span className="mm-percent">{group.share.toFixed(1)}%</span>
            </li>
          ))
        )}
      </ul>
      {pageCount > 1 ? (
        <nav className="mm-pagination mm-legend-pagination" aria-label="Category pages">
          <span>{pageLabel}</span>
          <button
            className="mm-icon-button"
            aria-label="Previous categories"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            className="mm-icon-button"
            aria-label="Next categories"
            disabled={currentPage + 1 === pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronIcon direction="right" />
          </button>
        </nav>
      ) : (
        <div className="mm-pagination mm-legend-pagination is-placeholder" aria-hidden="true" />
      )}
      <div className="mm-legend-total">
        <strong>Total</strong>
        <strong className="mm-amount">
          {total} {currency}
        </strong>
      </div>
    </div>
  );
}

function chartColor(key: string, configured: string) {
  if (key === '__uncategorized') return 'var(--mm-chart-uncategorized)';
  if (key === '__unknown') return 'var(--mm-warning)';
  return configured;
}

function tooltipPosition(start: number, share: number) {
  const angle = ((start + share / 2) / 100) * Math.PI * 2 - Math.PI / 2;
  return { left: `${50 + Math.cos(angle) * 42}%`, top: `${50 + Math.sin(angle) * 42}%` };
}
