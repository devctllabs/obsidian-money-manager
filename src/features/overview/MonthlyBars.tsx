import { useId, useState } from 'react';
import type { Report } from '../../application/reports/period-report';
export function MonthlyBars({ months, currency }: { months: Report['months']; currency: string }) {
  const titleId = useId();
  const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null);
  const step = 560 / months.length;
  return (
    <figure className="mm-year-chart">
      <figcaption>Monthly totals · {currency}</figcaption>
      <svg
        className="mm-year-chart-desktop"
        viewBox="0 0 620 220"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          Monthly totals.{' '}
          {months
            .map((month) => `${formatMonth(month.period)}: ${month.amount} ${currency}`)
            .join('; ')}
        </title>
        {[0, 50, 100].map((value) => (
          <line key={value} x1="40" x2="610" y1={180 - value * 1.5} y2={180 - value * 1.5} />
        ))}
        {months.map((month, index) => {
          const height = month.share * 1.5;
          const width = Math.min(34, step * 0.62);
          const x = 40 + step * (index + 0.5);
          return (
            <g
              className={`mm-year-month${hoveredPeriod === month.period ? ' is-hovered' : ''}`}
              key={month.period}
            >
              <rect
                aria-label={`${formatMonth(month.period)}: ${month.amount} ${currency}`}
                role="graphics-symbol"
                tabIndex={0}
                onMouseEnter={() => setHoveredPeriod(month.period)}
                onMouseLeave={() => setHoveredPeriod(null)}
                x={x - width / 2}
                y={180 - height}
                width={width}
                height={Math.max(1, height)}
                rx="3"
              >
                <title>
                  {formatMonth(month.period)}: {month.amount} {currency}
                </title>
              </rect>
              <text
                aria-hidden="true"
                className="mm-year-value"
                x={x}
                y={Math.max(12, 172 - height)}
                textAnchor="middle"
              >
                {month.amount}
              </text>
              <text x={x} y="204" textAnchor="middle">
                {formatMonth(month.period)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mm-year-chart-mobile" role="region" aria-label="Monthly totals">
        <ol>
          {months.map((month) => (
            <li key={month.period}>
              <span>{formatMonth(month.period)}</span>
              <span className="mm-month-bar" aria-hidden="true">
                <span style={{ width: `${month.share}%` }} />
              </span>
              <strong className="mm-amount">
                {month.amount} {currency}
              </strong>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}

export function formatMonth(period: string) {
  return `${period.slice(5, 7)}.${period.slice(0, 4)}`;
}
