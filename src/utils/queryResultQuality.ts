/**
 * SPARQL bindings arrive as strings. A grouped query can still emit one row per
 * bucket (for example four decades) whose counts are all "0". Those rows are
 * not a usable answer.
 */

function numericValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** True when the result has numbers and every one of them is zero or empty. */
export function isAllZeroMeasure(
  data: Record<string, unknown>[] | null | undefined
): boolean {
  if (!data || data.length === 0) return false;

  const columns = new Set<string>();
  for (const row of data) {
    for (const key of Object.keys(row)) columns.add(key);
  }

  const numericColumns = [...columns].filter((column) =>
    data.some((row) => numericValue(row[column]) !== null)
  );
  if (numericColumns.length === 0) return false;

  return numericColumns.every((column) =>
    data.every((row) => {
      const numeric = numericValue(row[column]);
      return numeric === null || numeric === 0;
    })
  );
}

/**
 * Keep a longer result only when it is not an all-zero measure.
 * Row count alone would treat four decade buckets of 0 as better than nothing,
 * and the same length would then block a later result that has real counts.
 */
export function shouldAdoptQueryResult(
  candidate: Record<string, unknown>[],
  currentBestLength: number
): boolean {
  return candidate.length > currentBestLength && !isAllZeroMeasure(candidate);
}
