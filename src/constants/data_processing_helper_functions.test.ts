import { describe, it, expect } from 'vitest';
import {
  Query12DataProcessingFunction,
  Query14DataProcessingFunction,
  Query4DataProcessingFunctionForDataCollection,
  Query2DataProcessingFunctionForDataAnalysis,
  Query2DataProcessingFunctionForDataCollection,
  Query15DataProcessingFunction,
  Query16DataProcessingFunction,
  Query7DataProcessingFunctionForInferentialStatistics,
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

describe('data collection counts every method row (as in the notebook)', () => {
  const rows = [
    { paper: 'p1', year: '2020', dc_method_type_label: 'case study' },
    { paper: 'p1', year: '2020', dc_method_type_label: 'case study' },
    { paper: 'p1', year: '2020', dc_method_type_label: 'foo' },
    { paper: 'p1', year: '2020', dc_method_type_label: 'bar' },
    { paper: 'p2', year: '2020', dc_method_type_label: 'case study' },
  ];

  it('Q2 counts every row and divides by unique papers', () => {
    const result = Query2DataProcessingFunctionForDataCollection(rows);
    expect(result[0]['case study']).toBe(3);
    expect(result[0].others).toBe(2);
    expect(result[0]['normalized_case study']).toBe(150);
  });

  it('Q4 counts every row and divides by all method rows', () => {
    const result = Query4DataProcessingFunctionForDataCollection(rows);
    const caseStudy = result.find((r) => r.methodType === 'Case study');
    const others = result.find((r) => r.methodType === 'Others');
    expect(caseStudy?.count).toBe(3);
    expect(others?.count).toBe(2);
    expect(caseStudy?.normalizedRatio).toBe(60);
  });
});

describe('Query12 per-category counting (as in the notebook)', () => {
  const row = (
    question: string,
    highlighted_q: string,
    highlighted_a: string
  ) => ({ paper: 'p1', year: '2020', question, highlighted_q, highlighted_a });

  it('is independent of row order and counts a paper in every matching category', () => {
    const a = Query12DataProcessingFunction([
      row('RQ1', '1', '1'),
      row('RQ2', '0', '0'),
    ]);
    const b = Query12DataProcessingFunction([
      row('RQ2', '0', '0'),
      row('RQ1', '1', '1'),
    ]);
    for (const result of [a, b]) {
      expect(result[0].hqha).toBe(1);
      expect(result[0].hidqhid).toBe(1);
      expect(result[0].normalized_hqha).toBe(100);
    }
  });

  it('counts a paper once per category and divides by all papers of the year', () => {
    const result = Query12DataProcessingFunction([
      row('RQ1', '1', '0'),
      row('RQ2', '1', '0'),
      { ...row('No question', '0', '0'), paper: 'p2' },
    ]);
    expect(result[0].hqhaHidden).toBe(1);
    expect(result[0].normalized_hqhaHidden).toBe(50);
    expect(result[0].noRQHidden).toBe(1);
  });
});

describe('Q15/Q16 outer merge of collection and analysis methods', () => {
  const dc = [{ paper: 'p1', year: '2020', number_of_dc_methods: '2' }];
  const da = [
    {
      paper: 'p1',
      year: '2020',
      number_of_inf_methods: '0',
      number_of_des_methods: '1',
      number_of_ml_methods: '0',
      number_of_other_methods: '0',
    },
    {
      paper: 'p2',
      year: '2020',
      number_of_inf_methods: '1',
      number_of_des_methods: '0',
      number_of_ml_methods: '0',
      number_of_other_methods: '0',
    },
  ];

  it('Q15 keeps papers that only have data analysis methods', () => {
    const result = Query15DataProcessingFunction(dc, da);
    expect(result).toEqual([
      { numberOfMethodsUsed: '1', count: 1, normalizedRatio: 50 },
      { numberOfMethodsUsed: '3', count: 1, normalizedRatio: 50 },
    ]);
  });

  it('Q16 keeps papers that only have data analysis methods', () => {
    const result = Query16DataProcessingFunction(dc, da);
    expect(result[0]['1.0']).toBe(1);
    expect(result[0]['3.0']).toBe(1);
    expect(result[0]['normalized_3.0']).toBe(50);
  });
});

describe('Query7 inferential relative value', () => {
  it('sums the per-test values rounded to 3 decimals', () => {
    // 1/600 rounds to 0.002 per test, so two tests give 0.004 (0.4%), not 0.003
    const rows = Array.from({ length: 600 }, (_, i) => ({
      paper: `p${i}`,
      year: '2020',
      da_label: 'analysis',
    })) as { paper: string; year: string; da_label: string; test?: string }[];
    rows[0].test = 't-test';
    rows[1].test = 'anova';
    const result = Query7DataProcessingFunctionForInferentialStatistics(rows);
    expect(result[0].count).toBe(2);
    expect(result[0].normalizedRatio).toBe(0.4);
  });
});
