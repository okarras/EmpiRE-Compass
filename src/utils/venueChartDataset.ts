import type { ChartSetting } from '../constants/queries_chart_info';
import type { RawDataItem } from '../constants/data_processing_helper_functions';
import {
  getVenueRowPredicate,
  shouldDedupeVenueByPaper,
  shouldUseUniquePaperBucketDenominator,
} from '../constants/venue_row_predicates';

/** Distinct colors for venue series (cycles if there are many venues). */
export const VENUE_CHART_COLOR_PALETTE = [
  '#e86161',
  '#1976d2',
  '#2e7d32',
  '#ed6c02',
  '#9c27b0',
  '#0288d1',
  '#5d4037',
  '#00796b',
  '#c62828',
  '#6a1b9a',
  '#455a64',
  '#f57c00',
  '#00897b',
  '#7b1fa2',
  '#388e3c',
  '#d84315',
  '#5e35b1',
  '#00695c',
];

export function getColorsForVenueSeries(
  venueCount: number,
  baseColors?: string[]
): string[] {
  const palette =
    baseColors && baseColors.length > 0
      ? [...baseColors]
      : [...VENUE_CHART_COLOR_PALETTE];
  const out: string[] = [];
  for (let i = 0; i < venueCount; i++) {
    out.push(palette[i % palette.length]);
  }
  return out;
}

/** Safe property key for chart dataKey from a venue label */
export function venueSlug(label: string): string {
  return (
    String(label)
      .replace(/[^a-zA-Z0-9_]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 48) || 'unknown'
  );
}

export function venueDataKey(venueLabel: string, normalized: boolean): string {
  const s = venueSlug(venueLabel);
  return normalized ? `normalized_v_${s}` : `v_${s}`;
}

function xValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  return String(a) === String(b);
}

function countMatchingRows(
  rawData: RawDataItem[],
  predicate: (r: RawDataItem) => boolean,
  xAxisKey: string,
  xVal: unknown,
  venueField: string,
  venue: string,
  dedupeByPaper: boolean
): number {
  const rows = rawData.filter(
    (r) =>
      predicate(r) &&
      xValuesEqual(r[xAxisKey], xVal) &&
      String(r[venueField] ?? '') === venue
  );
  if (!dedupeByPaper) return rows.length;
  const papers = new Set(
    rows.map((r) => r.paper).filter((p) => p != null && p !== '')
  );
  return papers.size;
}

/** Same denominator as aggregate charts: rows in bucket, or unique papers when the processor uses that. */
function bucketDenominator(
  rawData: RawDataItem[],
  xAxisKey: string,
  xVal: unknown,
  dedupeByPaper: boolean,
  queryUid: string
): number {
  const inBucket = rawData.filter((r) => xValuesEqual(r[xAxisKey], xVal));
  if (inBucket.length === 0) return 0;
  const useUniquePapers =
    dedupeByPaper || shouldUseUniquePaperBucketDenominator(queryUid);
  if (!useUniquePapers) return inBucket.length;
  return new Set(
    inBucket.map((r) => r.paper).filter((p) => p != null && p !== '')
  ).size;
}

export interface VenueCategorizedResult {
  dataset: Record<string, unknown>[];
  series: Array<{ dataKey: string; label: string }>;
}

/**
 * Builds one numeric column per venue (grouped bars).
 * When normalized (Relative), each value is (matching count / total in x bucket) × 100 —
 * same semantics as the non–venue chart (e.g. Query1: filtered share of all papers in that year),
 * not a partition of 100% across venues.
 */
export function buildVenueCategorizedDataset(
  rawData: RawDataItem[],
  chartSettings: ChartSetting,
  options: {
    normalized: boolean;
    queryUid: string;
    venueField?: string;
  }
): VenueCategorizedResult | null {
  const venueField = options.venueField?.trim() || 'venue_name';
  const xAxisKey = chartSettings.xAxis?.[0]?.dataKey;
  if (!xAxisKey || !rawData?.length) return null;

  const hasVenue = rawData.some(
    (r) => r[venueField] != null && String(r[venueField]).trim() !== ''
  );
  if (!hasVenue) return null;

  const rowPredicate = getVenueRowPredicate(options.queryUid);
  const dedupeByPaper = shouldDedupeVenueByPaper(options.queryUid);

  const venueSet = new Set<string>();
  rawData.forEach((r) => {
    const v = r[venueField];
    if (v != null && String(v).trim() !== '') venueSet.add(String(v));
  });
  const venues = Array.from(venueSet).sort((a, b) => a.localeCompare(b));
  if (venues.length === 0) return null;

  const xSet = new Set<unknown>();
  rawData.forEach((r) => {
    if (r[xAxisKey] !== undefined && r[xAxisKey] !== null) {
      xSet.add(r[xAxisKey]);
    }
  });
  const xValues = Array.from(xSet);
  xValues.sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });

  const dataset: Record<string, unknown>[] = xValues.map((xVal) => {
    const row: Record<string, unknown> = { [xAxisKey]: xVal };

    const counts: number[] = venues.map((venue) =>
      countMatchingRows(
        rawData,
        rowPredicate,
        xAxisKey,
        xVal,
        venueField,
        venue,
        dedupeByPaper
      )
    );

    if (options.normalized) {
      const denom = bucketDenominator(
        rawData,
        xAxisKey,
        xVal,
        dedupeByPaper,
        options.queryUid
      );
      venues.forEach((venue, i) => {
        row[venueDataKey(venue, true)] =
          denom > 0 ? Number(((counts[i] * 100) / denom).toFixed(2)) : 0;
      });
    } else {
      venues.forEach((venue, i) => {
        row[venueDataKey(venue, false)] = counts[i];
      });
    }

    return row;
  });

  const series = venues.map((venue) => ({
    dataKey: venueDataKey(venue, options.normalized),
    label: venue,
  }));

  return { dataset, series };
}
