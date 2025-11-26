import { Query, queries as empiricalQueries } from './queries_chart_info';
import { queries as nlp4reQueries } from './queries_nlp4re_chart_info';
import { SPARQL_QUERIES as empiricalSPARQL } from '../api/SPARQL_QUERIES';
import { SPARQL_QUERIES as nlp4reSPARQL } from '../api/SPARQL_QUERIES_NLP4RE';
import STATISTICS_SPARQL_QUERIES_EMPIRICAL from '../api/STATISTICS_SPARQL_QUERIES';
import STATISTICS_SPARQL_QUERIES_NLP4RE from '../api/STATISTICS_SPARQL_QUERIES_NLP4RE';

interface TemplateConfig {
  title: string;
  queries: Query[];
  sparql: typeof empiricalSPARQL | typeof nlp4reSPARQL;
  statisticsSparql:
    | typeof STATISTICS_SPARQL_QUERIES_EMPIRICAL
    | typeof STATISTICS_SPARQL_QUERIES_NLP4RE;
  statisticsKey: string;
}

export const templateConfig: Record<string, TemplateConfig> = {
  R186491: {
    title: 'Empirical Research Practice',
    queries: empiricalQueries,
    sparql: empiricalSPARQL,
    statisticsSparql: STATISTICS_SPARQL_QUERIES_EMPIRICAL,
    statisticsKey: 'empire-statistics',
  },
  R1544125: {
    title: 'NLP4RE ID Card',
    queries: nlp4reQueries,
    sparql: nlp4reSPARQL,
    statisticsSparql: STATISTICS_SPARQL_QUERIES_NLP4RE,
    statisticsKey: 'nlp4re-statistics',
  },
};

// Helper function to get template configuration with fallback
export const getTemplateConfig = (templateId: string): TemplateConfig => {
  return templateConfig[templateId] || templateConfig['R186491'];
};
