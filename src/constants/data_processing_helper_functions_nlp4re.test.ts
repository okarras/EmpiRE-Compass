import { describe, expect, it } from 'vitest';
import { Query1DataProcessingFunction } from './data_processing_helper_functions_nlp4re';

describe('processQuery via Query1DataProcessingFunction', () => {
  it('returns empty array for empty input', () => {
    expect(Query1DataProcessingFunction([])).toEqual([]);
  });

  it('aggregates counts by label', () => {
    const raw = [
      { paper: 'p1', evaluation_metricLabel: 'Accuracy' },
      { paper: 'p1', evaluation_metricLabel: 'Precision' },
      { paper: 'p2', evaluation_metricLabel: 'Accuracy' },
      { paper: 'p3', evaluation_metricLabel: 'Recall' },
    ];

    const result = Query1DataProcessingFunction(raw);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatchObject({
      label: expect.any(String),
      count: expect.any(Number),
      normalizedRatio: expect.any(Number),
    });
    const accuracy = result.find((r) => r.label === 'Accuracy');
    expect(accuracy?.count).toBe(2);
  });

  it('deduplicates by paper when configured off still counts rows', () => {
    const raw = [
      { paper: 'p1', evaluation_metricLabel: 'F1' },
      { paper: 'p1', evaluation_metricLabel: 'F1' },
    ];
    const result = Query1DataProcessingFunction(raw);
    const f1 = result.find((r) => r.label === 'F1');
    expect(f1?.count).toBe(2);
  });
});
