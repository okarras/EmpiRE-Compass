import { describe, expect, it } from 'vitest';
import type { ORKGStatement } from './orkgStatisticsService.js';
import { mapPaperStatementsToAnswers } from './orkgPaperMapper.js';
import r742443Fixture from './__fixtures__/orkgPaperR742443.json' with { type: 'json' };

const R742443_STATEMENTS = r742443Fixture as unknown as ORKGStatement[];

describe('mapPaperStatementsToAnswers', () => {
  it('returns null when the resource has no data at all (unknown/404 paper)', () => {
    expect(mapPaperStatementsToAnswers([], 'R999999')).toBeNull();
  });

  it('returns null when the paper has no Empirical Research Practice contribution', () => {
    const statements: ORKGStatement[] = [
      {
        subject: { id: 'R1', _class: 'resource', label: 'Some other paper' },
        predicate: { id: 'P26' },
        object: { id: 'L1', _class: 'literal', label: '10.1/xyz' },
      },
    ];
    expect(mapPaperStatementsToAnswers(statements, 'R1')).toBeNull();
  });

  it('maps a real ORKG statement bundle end-to-end (paper R742443)', () => {
    const result = mapPaperStatementsToAnswers(R742443_STATEMENTS, 'R742443');
    expect(result).not.toBeNull();
    const { paper, answers, unmappedNotes } = result!;

    expect(paper).toEqual({
      title: 'A review of the state of the practice in requirements modeling',
      doi: '10.1109/isre.1993.324842',
      authors: 'C. Richter, C. Potts, M. Lubars',
      year: 1993,
      venue: 'IEEE International Requirements Engineering Conference',
    });

    expect(answers.research_paradigm).toBe('exploratory');
    // The RQ's own text is the "No question" ORKG placeholder — not a real RQ.
    expect(answers.research_questions_list).toEqual([]);
    expect(answers.answer_hidden).toBe('yes');
    expect(answers.answer_highlighted).toBe('no');

    expect(answers.data_collection_methods).toEqual([
      { method_type: 'interview', method_name_custom: 'field study' },
    ]);
    expect(answers.research_data).toEqual({
      data_type: ['qualitative', 'quantitative'],
      data_urls: [],
    });

    expect(answers.analysis_methods).toEqual(['descriptive statistics']);
    const descriptiveStats = answers.descriptive_stats as Record<string, unknown>;
    const inferentialStats = answers.inferential_stats as Record<string, unknown>;
    const machineLearning = answers.machine_learning as Record<string, unknown>;
    expect(descriptiveStats.descriptive_stats_used).toBe('yes');
    expect(descriptiveStats.measures_frequency).toEqual(['count']);
    expect(descriptiveStats.measures_central).toEqual([]);
    expect(inferentialStats.inferential_stats_used).toBe('no');
    expect(machineLearning.ml_used).toBe('no');
    expect(answers.other_analysis).toEqual({
      other_analysis_used: 'yes',
      other_analysis_methods: ['category coding'],
    });

    expect(answers.threats_reported).toEqual([]);
    expect(answers.threats_mentioned_uncategorized).toBe('no');
    expect(unmappedNotes).toEqual([]);
  });

  it('maps multiple research questions and data collection methods as distinct resources without mixing them up', () => {
    const statements: ORKGStatement[] = [
      { subject: { id: 'PAPER', _class: 'resource', label: 'Multi-item paper' }, predicate: { id: 'P31' }, object: { id: 'CONTRI', _class: 'resource' } },

      { subject: { id: 'CONTRI', _class: 'resource' }, predicate: { id: 'P37330' }, object: { id: 'RQ1', _class: 'resource' } },
      { subject: { id: 'RQ1', _class: 'resource' }, predicate: { id: 'P44139' }, object: { id: 'L1', _class: 'literal', label: 'What is RQ1?' } },
      { subject: { id: 'RQ1', _class: 'resource' }, predicate: { id: 'P41928' }, object: { id: 'L2', _class: 'literal', label: 'exploratory' } },
      { subject: { id: 'RQ1', _class: 'resource' }, predicate: { id: 'P55038' }, object: { id: 'L3', _class: 'literal', label: 'false' } },
      { subject: { id: 'RQ1', _class: 'resource' }, predicate: { id: 'P55039' }, object: { id: 'L4', _class: 'literal', label: 'true' } },
      { subject: { id: 'RQ1', _class: 'resource' }, predicate: { id: 'P57000' }, object: { id: 'SUBQ1', _class: 'resource' } },
      { subject: { id: 'SUBQ1', _class: 'resource' }, predicate: { id: 'P44139' }, object: { id: 'L5', _class: 'literal', label: 'What is sub-RQ1?' } },
      { subject: { id: 'SUBQ1', _class: 'resource' }, predicate: { id: 'P41928' }, object: { id: 'L6', _class: 'literal', label: 'descriptive' } },

      { subject: { id: 'CONTRI', _class: 'resource' }, predicate: { id: 'P37330' }, object: { id: 'RQ2', _class: 'resource' } },
      { subject: { id: 'RQ2', _class: 'resource' }, predicate: { id: 'P44139' }, object: { id: 'L7', _class: 'literal', label: 'What is RQ2?' } },
      { subject: { id: 'RQ2', _class: 'resource' }, predicate: { id: 'P41928' }, object: { id: 'L8', _class: 'literal', label: 'comparative' } },
      { subject: { id: 'RQ2', _class: 'resource' }, predicate: { id: 'P55038' }, object: { id: 'L9', _class: 'literal', label: 'true' } },
      { subject: { id: 'RQ2', _class: 'resource' }, predicate: { id: 'P55039' }, object: { id: 'L10', _class: 'literal', label: 'false' } },

      { subject: { id: 'CONTRI', _class: 'resource' }, predicate: { id: 'P56008' }, object: { id: 'DC', _class: 'resource' } },
      { subject: { id: 'DC', _class: 'resource' }, predicate: { id: 'P1005' }, object: { id: 'M1', _class: 'resource' } },
      { subject: { id: 'M1', _class: 'resource' }, predicate: { id: 'P145012' }, object: { id: 'L11', _class: 'literal', label: 'survey of practitioners' } },
      { subject: { id: 'M1', _class: 'resource' }, predicate: { id: 'P94003' }, object: { id: 'L12', _class: 'literal', label: 'survey' } },
      { subject: { id: 'DC', _class: 'resource' }, predicate: { id: 'P1005' }, object: { id: 'M2', _class: 'resource' } },
      { subject: { id: 'M2', _class: 'resource' }, predicate: { id: 'P145012' }, object: { id: 'L13', _class: 'literal', label: 'follow-up interviews' } },
      { subject: { id: 'M2', _class: 'resource' }, predicate: { id: 'P94003' }, object: { id: 'L14', _class: 'literal', label: 'interview' } },
    ];

    const { answers, unmappedNotes } = mapPaperStatementsToAnswers(statements, 'PAPER')!;

    expect(answers.research_questions_list).toEqual([
      {
        rq_text: 'What is RQ1?',
        rq_highlighted: 'yes',
        rq_hidden: 'no',
        rq_type: 'exploratory',
        subquestions: [{ subq_text: 'What is sub-RQ1?', subq_type: 'descriptive' }],
      },
      {
        rq_text: 'What is RQ2?',
        rq_highlighted: 'no',
        rq_hidden: 'yes',
        rq_type: 'comparative',
        subquestions: [],
      },
    ]);

    expect(answers.data_collection_methods).toEqual([
      { method_type: 'survey', method_name_custom: 'survey of practitioners' },
      { method_type: 'interview', method_name_custom: 'follow-up interviews' },
    ]);
    expect(unmappedNotes).toEqual([]);
  });

  it('flags an unrecognized label instead of guessing', () => {
    const statements: ORKGStatement[] = [
      { subject: { id: 'PAPER', _class: 'resource', label: 'A paper' }, predicate: { id: 'P31' }, object: { id: 'CONTRI', _class: 'resource' } },
      { subject: { id: 'CONTRI', _class: 'resource' }, predicate: { id: 'P57003' }, object: { id: 'L1', _class: 'literal', label: 'quasi-experimental' } },
    ];

    const { answers, unmappedNotes } = mapPaperStatementsToAnswers(statements, 'PAPER')!;

    expect(answers.research_paradigm).toBe('');
    expect(unmappedNotes).toContain(
      'Unrecognized research paradigm "quasi-experimental" — left blank for review.'
    );
  });
});
