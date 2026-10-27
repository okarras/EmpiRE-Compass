import { describe, it, expect } from 'vitest';
import {
  Query14DataProcessingFunction,
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
