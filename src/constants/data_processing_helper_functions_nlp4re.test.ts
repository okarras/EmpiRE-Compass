import { describe, expect, it } from 'vitest';
import {
  Query10DataProcessingFunction,
  Query1DataProcessingFunction,
} from './data_processing_helper_functions_nlp4re';

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

describe('Query10DataProcessingFunction', () => {
  it('plots each (contribution, NLP task, annotators) combination once', () => {
    const raw = [
      {
        contribution: 'c1',
        NLPTaskTypeLabel: 'Classification',
        numberOfAnnotators: '3',
      },
      {
        contribution: 'c1',
        NLPTaskTypeLabel: 'Classification',
        numberOfAnnotators: '3',
      },
      {
        contribution: 'c2',
        NLPTaskTypeLabel: 'Classification',
        numberOfAnnotators: '3',
      },
    ];
    const result = Query10DataProcessingFunction(raw);
    const points = result
      .map((r) => r['Classification_y'])
      .filter((v) => v !== null);
    expect(points).toEqual([3, 3]);
  });

  it('places points at the same x positions on every call', () => {
    const raw = ['c1', 'c2', 'c3'].map((contribution) => ({
      contribution,
      NLPTaskTypeLabel: 'Classification',
      numberOfAnnotators: '2',
    }));
    const xs = Query10DataProcessingFunction(raw).map(
      (r) => r['Classification_x']
    );
    expect(xs).toEqual([0.85, 1, 1.15]);
    expect(
      Query10DataProcessingFunction(raw).map((r) => r['Classification_x'])
    ).toEqual(xs);
  });
});
