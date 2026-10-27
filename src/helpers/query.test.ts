import { describe, it, expect } from 'vitest';
import { findFirebaseQuestion, mergeQueryWithFirebase } from './query';
import type { Query } from '../constants/queries_chart_info';

describe('findFirebaseQuestion', () => {
  const mainDbQuestion = {
    id: 6,
    uid: 'query_6_1',
    uid_2: 'query_6_2',
    title: 'from main db',
  };

  it('finds the main document when code lists the secondary uid first', () => {
    const match = findFirebaseQuestion([mainDbQuestion], {
      id: 6,
      uid: 'query_6_2',
      uid_2: 'query_6_1',
    });
    expect(match?.uid).toBe('query_6_1');
    expect(match?.title).toBe('from main db');
  });

  it('matches numeric ids stored as strings and prefers id over another document uid', () => {
    const other = {
      id: 2,
      uid: 'query_6_2',
      uid_2: 'query_2_2',
      title: 'other',
    };
    const match = findFirebaseQuestion(
      [other, { ...mainDbQuestion, id: '6' }],
      {
        id: 6,
        uid: 'query_6_2',
        uid_2: 'query_6_1',
      }
    );
    expect(match?.title).toBe('from main db');
  });
});

describe('mergeQueryWithFirebase', () => {
  it('keeps code processing functions when firebase only has names', () => {
    const codeFn = () => [];
    const codeFn2 = () => [];
    const query = {
      id: 6,
      uid: 'query_6_2',
      uid_2: 'query_6_1',
      dataProcessingFunction: codeFn,
      dataProcessingFunction2: codeFn2,
      dataAnalysisInformation: { question: 'local' },
    } as Query;

    const merged = mergeQueryWithFirebase(query, {
      id: 6,
      uid: 'query_6_1',
      uid_2: 'query_6_2',
      dataProcessingFunctionName2:
        'Query6DataProcessingFunctionForDataAnalysis',
      dataAnalysisInformation: { question: 'from main db' },
      chartSettings2: { series: [{ dataKey: 'normalizedRatio' }] },
    });

    expect(merged.uid).toBe('query_6_1');
    expect(merged.uid_2).toBe('query_6_2');
    expect(merged.dataProcessingFunction).toBe(codeFn);
    expect(merged.dataProcessingFunction2).toBe(codeFn2);
    expect(merged.dataAnalysisInformation.question).toBe('from main db');
    expect(merged.chartSettings2?.series[0].dataKey).toBe('normalizedRatio');
  });
});
