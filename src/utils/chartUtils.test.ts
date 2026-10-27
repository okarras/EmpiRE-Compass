import { describe, it, expect } from 'vitest';
import { calculateDynamicNormalizedDataset } from './chartUtils';

describe('calculateDynamicNormalizedDataset', () => {
  it('returns dataset unchanged when normalized is false', () => {
    const dataset = [
      { year: 2020, count: 10, rawCount: 20, normalizedRatio: 50 },
      { year: 2021, count: 15, rawCount: 30, normalizedRatio: 50 },
    ];
    const series = [{ dataKey: 'normalizedRatio' }];

    const result = calculateDynamicNormalizedDataset(dataset, series, false);
    expect(result).toBe(dataset);
  });

  it('keeps precalculated percentages for single-series charts instead of forcing 100%', () => {
    const dataset = [
      { year: 2020, count: 8, rawCount: 16, normalizedRatio: 50 },
      { year: 2021, count: 6, rawCount: 24, normalizedRatio: 25 },
    ];
    const series = [{ dataKey: 'normalizedRatio' }];

    const result = calculateDynamicNormalizedDataset(
      dataset,
      series,
      true,
      'per-year'
    );
    expect(result).toBe(dataset);
    expect(result[0].normalizedRatio).toBe(50);
    expect(result[1].normalizedRatio).toBe(25);
  });

  it('keeps paper-relative normalized_* values from the main chart series', () => {
    const dataset = [
      {
        year: 2020,
        experiment: 2,
        survey: 1,
        normalized_experiment: 100,
        normalized_survey: 50,
      },
    ];
    const series = [
      { dataKey: 'normalized_experiment' },
      { dataKey: 'normalized_survey' },
    ];

    const result = calculateDynamicNormalizedDataset(
      dataset,
      series,
      true,
      'per-year'
    );
    expect(result).toBe(dataset);
    expect(result[0].normalized_experiment).toBe(100);
    expect(result[0].normalized_survey).toBe(50);
  });

  it('uses precomputed normalized fields when the series still uses absolute keys', () => {
    const dataset = [
      {
        year: 2005,
        'case study': 5,
        'action research': 0,
        'normalized_case study': 35.5,
        'normalized_action research': 0.0,
      },
    ];
    const series = [{ dataKey: 'case study' }, { dataKey: 'action research' }];

    const result = calculateDynamicNormalizedDataset(
      dataset,
      series,
      true,
      'per-year'
    );
    expect(result[0]['case study']).toBe(35.5);
    expect(result[0]['action research']).toBe(0.0);
  });

  it('recalculates relative shares only when no precomputed percentages exist', () => {
    const dataset = [
      { year: 2020, experiment: 10, survey: 30 },
      { year: 2021, experiment: 25, survey: 25 },
    ];
    const series = [
      { dataKey: 'normalized_experiment' },
      { dataKey: 'normalized_survey' },
    ];

    const result = calculateDynamicNormalizedDataset(
      dataset,
      series,
      true,
      'per-year'
    );
    expect(result[0].normalized_experiment).toBe(25);
    expect(result[0].normalized_survey).toBe(75);
    expect(result[1].normalized_experiment).toBe(50);
    expect(result[1].normalized_survey).toBe(50);
  });

  it('calculates global percentages across all rows in across-years mode', () => {
    const dataset = [
      { year: 2020, 'case study': 20, 'normalized_case study': 80 },
      { year: 2021, 'case study': 80, 'normalized_case study': 40 },
    ];
    const series = [{ dataKey: 'normalized_case study' }];

    const result = calculateDynamicNormalizedDataset(
      dataset,
      series,
      true,
      'across-years'
    );
    expect(result[0]['normalized_case study']).toBe(20);
    expect(result[1]['normalized_case study']).toBe(80);
  });

  it('leaves venue-categorized datasets untouched', () => {
    const dataset = [
      { year: 2020, normalized_v_ICSE: 70, normalized_v_RE: 80 },
    ];
    const series = [
      { dataKey: 'normalized_v_ICSE' },
      { dataKey: 'normalized_v_RE' },
    ];

    const result = calculateDynamicNormalizedDataset(
      dataset,
      series,
      true,
      'per-year'
    );
    expect(result).toBe(dataset);
    expect(result[0].normalized_v_ICSE).toBe(70);
    expect(result[0].normalized_v_RE).toBe(80);
  });
});
