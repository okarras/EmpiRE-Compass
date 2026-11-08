import { describe, it, expect } from 'vitest';
import {
  Query12DataProcessingFunction,
  Query14DataProcessingFunction,
  Query4DataProcessingFunctionForDataCollection,
  Query2DataProcessingFunctionForDataAnalysis,
  Query2DataProcessingFunctionForDataCollection,
} from './data_processing_helper_functions';

describe('relative chart denominators', () => {
  it('divides collection methods by unique papers, not by the sum of methods', () => {
    const result = Query2DataProcessingFunctionForDataCollection([
      { paper: 'p1', year: '2020', dc_method_type_label: 'experiment' },
      { paper: 'p1', year: '2020', dc_method_type_label: 'survey' },
      { paper: 'p2', year: '2020', dc_method_type_label: 'experiment' },
    ]);

    expect(result[0].experiment).toBe(2);
    expect(result[0].survey).toBe(1);
    expect(result[0].normalized_experiment).toBe(100);
    expect(result[0].normalized_survey).toBe(50);
  });

  it('divides analysis methods by unique papers that year', () => {
    const result = Query2DataProcessingFunctionForDataAnalysis([
      {
        paper: 'p1',
        year: '2020',
        da_label: 'analysis',
        descriptive: '1',
        inferential: '1',
      },
      {
        paper: 'p2',
        year: '2020',
        da_label: 'analysis',
        descriptive: '1',
      },
    ]);

    expect(result[0].descriptive).toBe(2);
    expect(result[0].inferential).toBe(1);
    expect(result[0].normalized_descriptive).toBe(100);
    expect(result[0].normalized_inferential).toBe(50);
  });

  it('divides secondary-research methods by unique papers that year', () => {
    const result = Query14DataProcessingFunction([
      { year: 2020, paper: 'p1', dc_method_name: 'literature review' },
      { year: 2020, paper: 'p1', dc_method_name: 'archive analysis' },
      { year: 2020, paper: 'p2', dc_method_name: 'literature review' },
    ]);

    expect(result[0].literature_review).toBe(2);
    expect(result[0].archive_analysis).toBe(1);
    expect(result[0].normalized_literature_review).toBe(100);
    expect(result[0].normalized_archive_analysis).toBe(50);
  });
});

describe('data collection dedup (one count per paper and method category)', () => {
  const rows = [
    { paper: 'p1', year: '2020', dc_method_type_label: 'case study' },
    { paper: 'p1', year: '2020', dc_method_type_label: 'case study' },
    { paper: 'p1', year: '2020', dc_method_type_label: 'foo' },
    { paper: 'p1', year: '2020', dc_method_type_label: 'bar' },
    { paper: 'p2', year: '2020', dc_method_type_label: 'case study' },
  ];

  it('Q2 counts each paper once per category, with others merged', () => {
    const result = Query2DataProcessingFunctionForDataCollection(rows);
    expect(result[0]['case study']).toBe(2);
    expect(result[0].others).toBe(1);
    expect(result[0]['normalized_case study']).toBe(100);
  });

  it('Q4 counts each paper once per category', () => {
    const result = Query4DataProcessingFunctionForDataCollection(rows);
    const caseStudy = result.find((r) => r.methodType === 'Case study');
    const others = result.find((r) => r.methodType === 'Others');
    expect(caseStudy?.count).toBe(2);
    expect(others?.count).toBe(1);
    expect(caseStudy?.normalizedRatio).toBeCloseTo(66.67, 2);
  });
});

describe('Query12 paper-level aggregation', () => {
  const row = (
    question: string,
    highlighted_q: string,
    highlighted_a: string
  ) => ({ paper: 'p1', year: '2020', question, highlighted_q, highlighted_a });

  it('is independent of row order: any highlighted row wins', () => {
    const a = Query12DataProcessingFunction([
      row('RQ1', '1', '1'),
      row('RQ2', '0', '0'),
    ]);
    const b = Query12DataProcessingFunction([
      row('RQ2', '0', '0'),
      row('RQ1', '1', '1'),
    ]);
    expect(a[0].hqha).toBe(1);
    expect(b[0].hqha).toBe(1);
    expect(a[0].hidqhid).toBe(0);
  });

  it('treats a paper as having a question if any row has one', () => {
    const result = Query12DataProcessingFunction([
      row('No question', '0', '0'),
      row('RQ1', '0', '0'),
    ]);
    expect(result[0].hidqhid).toBe(1);
    expect(result[0].noRQHidden).toBe(0);
  });
});
