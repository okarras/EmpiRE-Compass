import {
  Query as EmpiricalQuery,
  queries as empiricalQueries,
} from './queries_chart_info';
import {
  Query as Nlp4reQuery,
  queries as nlp4reQueries,
} from './queries_nlp4re_chart_info';
import { SPARQL_QUERIES as empiricalSPARQL } from '../api/SPARQL_QUERIES';
import { SPARQL_QUERIES as nlp4reSPARQL } from '../api/SPARQL_QUERIES_NLP4RE';

export type Query = EmpiricalQuery | Nlp4reQuery;

interface TemplateConfig {
  title: string;
  queries: EmpiricalQuery[] | Nlp4reQuery[];
  sparql: typeof empiricalSPARQL | typeof nlp4reSPARQL;
  collectionName: string;
}

export const templateConfig: Record<string, TemplateConfig> = {
  R186491: {
    title: 'Empirical Research Practice',
    queries: empiricalQueries,
    sparql: empiricalSPARQL,
    collectionName: 'Questions',
  },
  R1544125: {
    title: 'NLP4RE ID Card',
    queries: nlp4reQueries,
    sparql: nlp4reSPARQL,
    collectionName: 'Questions Nlp4re',
  },
};

// Helper function to get template configuration with fallback
export const getTemplateConfig = (templateId: string): TemplateConfig => {
  return templateConfig[templateId] || templateConfig['R186491'];
};
