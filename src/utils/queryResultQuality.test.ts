import { describe, expect, it } from 'vitest';
import { isAllZeroMeasure, shouldAdoptQueryResult } from './queryResultQuality';

const decadeZeros = [
  { period: '1993-1999', study_count: '0' },
  { period: '2000-2009', study_count: '0' },
  { period: '2010-2019', study_count: '0' },
  { period: '2020-2025', study_count: '0' },
];

const decadeCounts = [
  { period: '1993-1999', study_count: '72' },
  { period: '2000-2009', study_count: '180' },
  { period: '2010-2019', study_count: '216' },
  { period: '2020-2025', study_count: '110' },
];

describe('isAllZeroMeasure', () => {
  it('rejects four decade buckets whose counts are zero', () => {
    expect(isAllZeroMeasure(decadeZeros)).toBe(true);
  });

  it('keeps decade buckets that have real counts', () => {
    expect(isAllZeroMeasure(decadeCounts)).toBe(false);
  });

  it('keeps a paper list that has no numeric column', () => {
    expect(
      isAllZeroMeasure([
        { paper: 'http://orkg.org/orkg/resource/R1', label: 'A study' },
      ])
    ).toBe(false);
  });

  it('treats an empty result as not an all-zero measure', () => {
    expect(isAllZeroMeasure([])).toBe(false);
  });
});

describe('shouldAdoptQueryResult', () => {
  it('does not adopt four zero counts as the best result', () => {
    expect(shouldAdoptQueryResult(decadeZeros, 0)).toBe(false);
  });

  it('adopts real counts when the only earlier rows were zeros', () => {
    expect(shouldAdoptQueryResult(decadeCounts, 0)).toBe(true);
  });

  it('does not replace a longer usable result with an equal-length one', () => {
    expect(shouldAdoptQueryResult(decadeCounts, decadeCounts.length)).toBe(
      false
    );
  });
});
