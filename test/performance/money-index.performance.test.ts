import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { buildSnapshot } from '../../src/application/indexing/read-model';
import { newDocument } from '../../src/domain/workspace-document';

const ROOT = 'Money';
const TODAY = '2026-12-31';
const ENTRY_COUNT = 10_000;
const MAX_COLD_INDEX_MS = 3_000;
const MAX_WARM_INDEX_MS = 500;

function createFixture() {
  const sources = new Map<string, string | null>();
  sources.set(
    `${ROOT}/ACCOUNTS.md`,
    newDocument({
      type: 'accounts',
      accounts: { cash: { name: 'Cash', currency: 'GEL' } },
    }),
  );
  sources.set(
    `${ROOT}/CATEGORIES.md`,
    newDocument({
      type: 'categories',
      categories: { expense: {}, income: {} },
    }),
  );
  sources.set(
    `${ROOT}/RATES.md`,
    newDocument({ type: 'rates', reference_currency: 'GEL', rates: {} }),
  );

  const entriesPerMonth = Math.ceil(ENTRY_COUNT / 12);
  let nextEntry = 0;
  for (let month = 1; month <= 12 && nextEntry < ENTRY_COUNT; month += 1) {
    const count = Math.min(entriesPerMonth, ENTRY_COUNT - nextEntry);
    const entries = Array.from({ length: count }, (_, offset) => {
      const index = nextEntry + offset;
      return {
        id: `00000000-0000-7000-8000-${index.toString(16).padStart(12, '0')}`,
        type: 'expense',
        date: `2026-${month.toString().padStart(2, '0')}-${((index % 28) + 1)
          .toString()
          .padStart(2, '0')}`,
        account: 'cash',
        amount: '1.00',
        description: 'Performance fixture',
      };
    });
    const period = `2026-${month.toString().padStart(2, '0')}`;
    sources.set(
      `${ROOT}/Ledger/2026/${month.toString().padStart(2, '0')}.md`,
      newDocument({ type: 'ledger_month', period, entries }),
    );
    nextEntry += count;
  }
  return sources;
}

describe(`${ENTRY_COUNT.toLocaleString()}-entry MoneyIndex fixture`, () => {
  it('indexes the ledger within cold and cached rebuild budgets', () => {
    const sources = createFixture();
    const cache = new Map();

    const coldStartedAt = performance.now();
    const cold = buildSnapshot(sources, ROOT, TODAY, cache);
    const coldMs = performance.now() - coldStartedAt;

    const warmStartedAt = performance.now();
    const warm = buildSnapshot(sources, ROOT, TODAY, cache);
    const warmMs = performance.now() - warmStartedAt;

    expect(cold.phase).toBe('ready');
    expect(cold.entries).toHaveLength(ENTRY_COUNT);
    expect(cold.diagnostics).toEqual([]);
    expect(warm.entries).toHaveLength(ENTRY_COUNT);
    expect(coldMs).toBeLessThan(MAX_COLD_INDEX_MS);
    expect(warmMs).toBeLessThan(MAX_WARM_INDEX_MS);

    process.stdout.write(`${JSON.stringify({ entries: ENTRY_COUNT, coldMs, warmMs })}\n`);
  });
});
