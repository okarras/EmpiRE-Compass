/* eslint-disable @typescript-eslint/no-explicit-any */
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import STATISTICS_SPARQL_QUERIES from '../api/STATISTICS_SPARQL_QUERIES';
import { queries as empiricalQueries } from '../constants/queries_chart_info';
import { queries as nlp4reQueries } from '../constants/queries_nlp4re_chart_info';
import TemplateManagement, {
  TemplateData,
  QuestionData,
  StatisticData,
} from './TemplateManagement';

// Placeholder for NLP4RE SPARQL queries - update when available
const SPARQL_QUERIES_NLP4RE: Record<string, string> = {};

/**
 * Data Migration Utility
 * Converts old flat structure to new nested structure
 */

/**
 * Serialize object - remove functions to make Firebase-safe
 */
const serializeObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' ? serializeObject(item) : item
    );
  }

  const serialized: any = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === 'function') return; // Skip functions
    if (typeof value === 'object' && value !== null) {
      serialized[key] = serializeObject(value);
    } else {
      serialized[key] = value;
    }
  });
  return serialized;
};

/**
 * Convert local questions data to Firebase format with SPARQL queries
 * Includes ALL fields: chartSettings, chartType, processing functions, etc.
 */
const prepareQuestionsForFirebase = (
  questions: any[],
  sparqlQueries: Record<string, string>
): QuestionData[] => {
  return questions.map((query) => {
    const questionData: QuestionData = {
      id: query.id,
      uid: query.uid,
      title: query.title,
      dataAnalysisInformation: query.dataAnalysisInformation,
    };

    // Add SPARQL query if exists
    if (sparqlQueries[query.uid]) {
      questionData.sparqlQuery = sparqlQueries[query.uid];
    }

    // Add second SPARQL query if exists (for dual queries)
    if (query.uid_2 && sparqlQueries[query.uid_2]) {
      questionData.sparqlQuery2 = sparqlQueries[query.uid_2];
      questionData.uid_2 = query.uid_2;
    }

    // Add uid_2_merge if exists (for merged queries)
    if (query.uid_2_merge) {
      questionData.uid_2_merge = query.uid_2_merge;
    }

    // Add chart type
    if (query.chartType) {
      questionData.chartType = query.chartType;
    }

    // Add chart settings (complete configuration) - serialized to remove functions
    if (query.chartSettings) {
      questionData.chartSettings = serializeObject(query.chartSettings);
    }

    // Add second chart settings (for dual queries) - serialized to remove functions
    if (query.chartSettings2) {
      questionData.chartSettings2 = serializeObject(query.chartSettings2);
    }

    // Add processing function references (store function name as string)
    if (query.dataProcessingFunction) {
      questionData.dataProcessingFunctionName =
        query.dataProcessingFunction.name || 'dataProcessingFunction';
    }

    if (query.dataProcessingFunction2) {
      questionData.dataProcessingFunctionName2 =
        query.dataProcessingFunction2.name || 'dataProcessingFunction2';
    }

    // Add tabs if exists
    if (query.tabs) {
      questionData.tabs = query.tabs;
    }

    return questionData;
  });
};

/**
 * Convert statistics SPARQL queries to Firebase format
 */
const prepareStatisticsForFirebase = (
  sparqlQueries: Record<string, string>
): StatisticData[] => {
  return Object.entries(sparqlQueries).map(([key, query]) => ({
    id: key,
    name: key.replace(/_/g, ' ').toLowerCase(),
    sparqlQuery: query,
    description: `Statistical query for ${key.replace(/_/g, ' ').toLowerCase()}`,
  }));
};

/**
 * Migrate Empirical Research Practice template
 */
export const migrateEmpiricalTemplate = async (): Promise<void> => {
  const templateId = 'R186491';

  const templateData: TemplateData = {
    id: templateId,
    title: 'Empirical Research Practice',
    collectionName: 'Questions',
    description:
      'Template for analyzing empirical research practices in software engineering',
  };

  const questions = prepareQuestionsForFirebase(
    empiricalQueries,
    SPARQL_QUERIES
  );

  const statistics = prepareStatisticsForFirebase(STATISTICS_SPARQL_QUERIES);

  await TemplateManagement.importTemplateWithQuestions(
    templateId,
    templateData,
    questions,
    statistics
  );
};

/**
 * Migrate NLP4RE template
 */
export const migrateNLP4RETemplate = async (): Promise<void> => {
  const templateId = 'R1544125';

  const templateData: TemplateData = {
    id: templateId,
    title: 'NLP4RE ID Card',
    collectionName: 'Questions Nlp4re',
    description: 'Template for NLP4RE research questions and analysis',
  };

  const questions = prepareQuestionsForFirebase(
    nlp4reQueries,
    SPARQL_QUERIES_NLP4RE
  );

  // NLP4RE might have different statistics, adjust as needed
  const statistics: StatisticData[] = [];

  await TemplateManagement.importTemplateWithQuestions(
    templateId,
    templateData,
    questions,
    statistics
  );
};

/**
 * Migrate all templates
 */
export const migrateAllTemplates = async (): Promise<{
  success: boolean;
  error?: string;
  migratedTemplates?: string[];
}> => {
  try {
    const migratedTemplates: string[] = [];

    // Migrate Empirical Research Practice
    await migrateEmpiricalTemplate();
    migratedTemplates.push('R186491');

    // Migrate NLP4RE
    await migrateNLP4RETemplate();
    migratedTemplates.push('R1544125');

    return {
      success: true,
      migratedTemplates,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Export template data in new format
 */
export const exportTemplateToJSON = async (templateId: string) => {
  const data = await TemplateManagement.getCompleteTemplate(templateId);

  const exportData = {
    metadata: {
      templateId,
      exportedAt: new Date().toISOString(),
      version: '2.0',
    },
    template: data.template,
    questions: data.questions,
    statistics: data.statistics,
  };

  return exportData;
};

/**
 * Import template from JSON
 */
export const importTemplateFromJSON = async (jsonData: any): Promise<void> => {
  const { template, questions, statistics } = jsonData;
  const templateId = jsonData.metadata?.templateId || template.id;

  await TemplateManagement.importTemplateWithQuestions(
    templateId,
    template,
    questions,
    statistics
  );
};

const DataMigration = {
  migrateEmpiricalTemplate,
  migrateNLP4RETemplate,
  migrateAllTemplates,
  exportTemplateToJSON,
  importTemplateFromJSON,
  prepareQuestionsForFirebase,
  prepareStatisticsForFirebase,
};

export default DataMigration;
