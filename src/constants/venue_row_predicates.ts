/**
 * Row inclusion rules for venue breakdown — aligned with each
 * QueryNDataProcessingFunction’s filtering / counting semantics.
 */
import type { RawDataItem } from './data_processing_helper_functions';

export const venueRowPredicateByQueryUid: Record<
  string,
  (r: RawDataItem) => boolean
> = {
  query_1: (r) =>
    r.dc_label !== 'no collection' && r.da_label !== 'no analysis',
  query_3: (r) =>
    r.dc_label === 'no collection' || r.da_label === 'no analysis',
  query_2_1: () => true,
  query_2_2: () => true,
  query_4_1: () => true,
  query_4_2: () => true,
  query_5: () => true,
  query_6_1: () => true,
  query_6_2: (r) => !!r.da_label,
  query_7_1: () => true,
  query_7_2: () => true,
  query_8: () => true,
  query_9: () => true,
  query_10: () => true,
  query_11: () => true,
  query_12: () => true,
  query_13: (r) => !!r.dc_method_name,
  query_14: (r) => !!r.dc_method_name,
  query_15_1: () => true,
  query_16_1: () => true,
};

/**
 * When true, count unique `paper` per (x-axis bucket, venue) instead of rows.
 * Matches processors that deduplicate by paper before aggregating.
 */
export const venueDedupeByPaperByQueryUid: Record<string, boolean> = {
  query_2_2: true,
  query_8: true,
  query_9: true,
  query_11: true,
  query_12: true,
  query_6_2: true,
  query_7_1: true,
  query_7_2: true,
};

export function getVenueRowPredicate(
  queryUid: string
): (r: RawDataItem) => boolean {
  return venueRowPredicateByQueryUid[queryUid] ?? (() => true);
}

export function shouldDedupeVenueByPaper(queryUid: string): boolean {
  return !!venueDedupeByPaperByQueryUid[queryUid];
}

/**
 * Query2-style collection charts normalize by unique papers per year (not row count).
 * Relative venue values must use the same denominator.
 */
export function shouldUseUniquePaperBucketDenominator(
  queryUid: string
): boolean {
  return (
    queryUid === 'query_2_1' ||
    queryUid === 'query_5' ||
    queryUid === 'query_10' ||
    queryUid === 'query_14'
  );
}
