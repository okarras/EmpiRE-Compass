/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import STATISTICS_SPARQL_QUERIES from '../api/STATISTICS_SPARQL_QUERIES';
import { queries as empiricalQueriesFromCode } from '../constants/queries_chart_info';
import { queries as nlp4reQueriesFromCode } from '../constants/queries_nlp4re_chart_info';

/**
 * Restore Service - Populates empty Firebase from backup file
 * Converts flat backup structure to new nested structure
 */

/**
 * Serialize chart settings - remove functions and make Firebase-safe
 */
export const serializeChartSettings = (chartSettings: any): any => {
  if (!chartSettings) return null;

  const serialized: any = {};

  Object.keys(chartSettings).forEach((key) => {
    const value = chartSettings[key];

    // Skip functions - Firebase doesn't support them
    if (typeof value === 'function') {
      return;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      serialized[key] = value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          // Recursively serialize objects in arrays
          return serializeObject(item);
        }
        return item;
      });
    }
    // Handle objects
    else if (typeof value === 'object' && value !== null) {
      serialized[key] = serializeObject(value);
    }
    // Handle primitives
    else {
      serialized[key] = value;
    }
  });

  return serialized;
};

/**
 * Recursively serialize objects, removing functions
 */
const serializeObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;

  const serialized: any = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    // Skip functions
    if (typeof value === 'function') {
      return;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      serialized[key] = value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return serializeObject(item);
        }
        return item;
      });
    }
    // Handle nested objects
    else if (typeof value === 'object' && value !== null) {
      serialized[key] = serializeObject(value);
    }
    // Handle primitives
    else {
      serialized[key] = value;
    }
  });

  return serialized;
};

export interface RestoreProgress {
  currentStep: string;
  templatesProcessed: number;
  questionsProcessed: number;
  statisticsProcessed: number;
  usersProcessed: number;
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  statistics?: {
    templatesCreated: number;
    questionsCreated: number;
    statisticsCreated: number;
    usersCreated: number;
  };
}

/**
 * Restore Users collection (flat structure - no changes)
 * Preserves ALL user fields
 */
const restoreUsers = async (users: any[]): Promise<number> => {
  if (!users || users.length === 0) {
    console.warn('⚠️ No users found in backup!');
    return 0;
  }

  let count = 0;

  // Process users one by one to ensure all data is saved
  for (const user of users) {
    const userId = user.id;

    if (!userId) {
      console.error('❌ User missing ID:', user);
      continue;
    }

    if (!db) {
      throw new Error(
        'Firebase is not initialized. Please configure Firebase environment variables.'
      );
    }

    const userRef = doc(db, 'Users', userId);

    // Save all user data (remove id from data, use it as document ID)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _userId, ...userData } = user;

    await setDoc(userRef, userData);
    count++;
  }

  return count;
};

/**
 * Restore Templates collection (old flat structure - for backward compatibility)
 */
const restoreLegacyTemplates = async (templates: any[]): Promise<number> => {
  if (!templates || templates.length === 0) return 0;

  if (!db) {
    throw new Error(
      'Firebase is not initialized. Please configure Firebase environment variables.'
    );
  }

  const firestoreDb = db; // TypeScript narrowing helper
  const batch = writeBatch(firestoreDb);
  let count = 0;

  templates.forEach((template) => {
    const { id, ...templateData } = template;
    const templateRef = doc(firestoreDb, 'LegacyTemplates', id);
    batch.set(templateRef, templateData);
    count++;
  });

  await batch.commit();
  return count;
};

/**
 * Create new nested Templates structure with Questions and Statistics
 */
const createNestedTemplate = async (
  templateId: string,
  templateData: {
    id: string;
    title: string;
    collectionName: string;
    description?: string;
  },
  questions: any[],
  statistics: any[]
): Promise<{ questionsCreated: number; statisticsCreated: number }> => {
  if (!db) {
    throw new Error(
      'Firebase is not initialized. Please configure Firebase environment variables.'
    );
  }

  const firestoreDb = db; // TypeScript narrowing helper
  let questionsCreated = 0;
  let statisticsCreated = 0;

  // Create template document
  const templateRef = doc(firestoreDb, 'Templates', templateId);
  await setDoc(templateRef, templateData);

  // Create questions in batches (Firestore limit: 500 operations per batch)
  const BATCH_SIZE = 400;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestoreDb);
    const batchQuestions = questions.slice(i, i + BATCH_SIZE);

    batchQuestions.forEach((question) => {
      const questionId = question.uid || `query_${question.id}`;
      const questionRef = doc(
        firestoreDb,
        'Templates',
        templateId,
        'Questions',
        questionId
      );

      // Use question data as-is (already has everything including SPARQL and chartSettings)
      batch.set(questionRef, question);
      questionsCreated++;
    });

    await batch.commit();
  }

  // Create statistics in batches
  for (let i = 0; i < statistics.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestoreDb);
    const batchStatistics = statistics.slice(i, i + BATCH_SIZE);

    batchStatistics.forEach((stat) => {
      const statisticRef = doc(
        firestoreDb,
        'Templates',
        templateId,
        'Statistics',
        stat.id
      );
      batch.set(statisticRef, stat);
      statisticsCreated++;
    });

    await batch.commit();
  }

  return { questionsCreated, statisticsCreated };
};

/**
 * Convert backup questions to new format with EVERYTHING from code
 * Merges backup data with complete chart settings, SPARQL queries, etc.
 */
export const convertBackupQuestionsToNewFormat = (
  backupQuestions: any[],
  codeQueries: any[]
): any[] => {
  if (!backupQuestions || backupQuestions.length === 0) {
    console.warn(
      'convertBackupQuestionsToNewFormat: No backup questions provided'
    );
    return [];
  }

  return backupQuestions.map((backupQ) => {
    const questionId = backupQ.uid || `query_${backupQ.id}`;

    // Find matching question in code to get chart settings
    const codeQuery = codeQueries.find(
      (q) => q.uid === backupQ.uid || q.id === backupQ.id
    );

    if (!codeQuery) {
      console.warn(
        `convertBackupQuestionsToNewFormat: No matching code query found for ${questionId}`
      );
    }

    // Build the complete question document - EVERYTHING
    // Start with backup data as base, then merge code defaults
    const questionDoc: any = {
      id: backupQ.id,
      uid: backupQ.uid,
      title: backupQ.title || codeQuery?.title || '',

      // Preserve SPARQL query from backup if it exists, otherwise use code
      sparqlQuery:
        backupQ.sparqlQuery ||
        SPARQL_QUERIES[questionId as keyof typeof SPARQL_QUERIES] ||
        '',

      // Preserve chart type from backup if it exists, otherwise use code
      chartType: backupQ.chartType || codeQuery?.chartType,

      // Preserve chart settings from backup if they exist, otherwise use code
      chartSettings: backupQ.chartSettings
        ? serializeChartSettings(backupQ.chartSettings)
        : codeQuery?.chartSettings
          ? serializeChartSettings(codeQuery.chartSettings)
          : undefined,

      chartSettings2: backupQ.chartSettings2
        ? serializeChartSettings(backupQ.chartSettings2)
        : codeQuery?.chartSettings2
          ? serializeChartSettings(codeQuery.chartSettings2)
          : undefined,

      // Preserve ALL dataAnalysisInformation from backup (priority) or code
      // Start with backup data, then merge code defaults for missing fields
      dataAnalysisInformation: {
        // Always include question (from backup or code)
        question:
          backupQ.dataAnalysisInformation?.question ||
          codeQuery?.dataAnalysisInformation?.question ||
          '',
        // Preserve all fields from backup if they exist (even if empty string)
        questionExplanation:
          backupQ.dataAnalysisInformation?.questionExplanation !== undefined
            ? backupQ.dataAnalysisInformation.questionExplanation
            : codeQuery?.dataAnalysisInformation?.questionExplanation || '',
        dataAnalysis:
          backupQ.dataAnalysisInformation?.dataAnalysis !== undefined
            ? backupQ.dataAnalysisInformation.dataAnalysis
            : codeQuery?.dataAnalysisInformation?.dataAnalysis || '',
        dataInterpretation:
          backupQ.dataAnalysisInformation?.dataInterpretation !== undefined
            ? backupQ.dataAnalysisInformation.dataInterpretation
            : codeQuery?.dataAnalysisInformation?.dataInterpretation || '',
        requiredDataForAnalysis:
          backupQ.dataAnalysisInformation?.requiredDataForAnalysis !== undefined
            ? backupQ.dataAnalysisInformation.requiredDataForAnalysis
            : codeQuery?.dataAnalysisInformation?.requiredDataForAnalysis || '',
      },
    };

    // Add second UID and SPARQL query for dual queries (preserve from backup if exists)
    if (backupQ.uid_2 || codeQuery?.uid_2) {
      questionDoc.uid_2 = backupQ.uid_2 || codeQuery.uid_2;
      questionDoc.sparqlQuery2 =
        backupQ.sparqlQuery2 ||
        (codeQuery?.uid_2 &&
          SPARQL_QUERIES[codeQuery.uid_2 as keyof typeof SPARQL_QUERIES]) ||
        '';
    }

    // Add merged UID for special queries (15, 16)
    if (backupQ.uid_2_merge || codeQuery?.uid_2_merge) {
      questionDoc.uid_2_merge = backupQ.uid_2_merge || codeQuery.uid_2_merge;
    }

    // Store processing function names as references
    if (codeQuery?.dataProcessingFunction) {
      questionDoc.dataProcessingFunctionName =
        codeQuery.dataProcessingFunction.name || 'unknown';
    }

    if (codeQuery?.dataProcessingFunction2) {
      questionDoc.dataProcessingFunctionName2 =
        codeQuery.dataProcessingFunction2.name || 'unknown';
    }

    // Add tabs from backup or code
    if (backupQ.tabs || codeQuery?.tabs) {
      questionDoc.tabs = backupQ.tabs || codeQuery.tabs;
    }

    // Preserve gridOptions from backup if they exist
    if (backupQ.gridOptions) {
      questionDoc.gridOptions = backupQ.gridOptions;
    } else if (codeQuery?.gridOptions) {
      questionDoc.gridOptions = codeQuery.gridOptions;
    }

    // Preserve dataProcessingFunction name from backup if it exists
    if (backupQ.dataProcessingFunction) {
      questionDoc.dataProcessingFunctionName =
        typeof backupQ.dataProcessingFunction === 'string'
          ? backupQ.dataProcessingFunction
          : backupQ.dataProcessingFunction.name || 'unknown';
    } else if (codeQuery?.dataProcessingFunction) {
      questionDoc.dataProcessingFunctionName =
        codeQuery.dataProcessingFunction.name || 'unknown';
    }

    if (backupQ.dataProcessingFunction2) {
      questionDoc.dataProcessingFunctionName2 =
        typeof backupQ.dataProcessingFunction2 === 'string'
          ? backupQ.dataProcessingFunction2
          : backupQ.dataProcessingFunction2.name || 'unknown';
    } else if (codeQuery?.dataProcessingFunction2) {
      questionDoc.dataProcessingFunctionName2 =
        codeQuery.dataProcessingFunction2.name || 'unknown';
    }

    // Debug logging for first question to verify conversion
    if (backupQ.id === 1 || backupQ.uid === 'query_1') {
      console.log(
        'convertBackupQuestionsToNewFormat: Sample conversion for question 1',
        {
          backupDataAnalysisInfo: backupQ.dataAnalysisInformation,
          convertedDataAnalysisInfo: questionDoc.dataAnalysisInformation,
          hasQuestionExplanation:
            !!questionDoc.dataAnalysisInformation.questionExplanation,
          hasDataAnalysis: !!questionDoc.dataAnalysisInformation.dataAnalysis,
          hasDataInterpretation:
            !!questionDoc.dataAnalysisInformation.dataInterpretation,
          hasRequiredData:
            !!questionDoc.dataAnalysisInformation.requiredDataForAnalysis,
        }
      );
    }

    return questionDoc;
  });
};

/**
 * Convert statistics queries to new format
 * Combines backup data with SPARQL queries from code
 */
export const convertStatisticsToNewFormat = (
  backupStatistics?: any[]
): any[] => {
  const statsFromCode = Object.entries(STATISTICS_SPARQL_QUERIES).map(
    ([key, query]) => ({
      id: key,
      name: key.replace(/_/g, ' ').toLowerCase(),
      sparqlQuery: query,
      description: `Statistical query for ${key.replace(/_/g, ' ').toLowerCase()}`,
    })
  );

  // If we have backup statistics, merge them
  if (backupStatistics && backupStatistics.length > 0) {
    // Add backup statistics that might have additional fields
    backupStatistics.forEach((backupStat) => {
      const existing = statsFromCode.find((s) => s.id === backupStat.id);
      if (!existing) {
        // This is additional data from backup, preserve it
        statsFromCode.push({
          id: backupStat.id,
          name:
            backupStat.name || backupStat.id.replace(/_/g, ' ').toLowerCase(),
          sparqlQuery: backupStat.sparqlQuery || '',
          description: backupStat.description || '',
          ...backupStat, // Preserve any extra fields
        });
      } else {
        // Merge with existing, preserving backup data
        Object.assign(existing, {
          ...backupStat,
          sparqlQuery: existing.sparqlQuery, // Keep code version of SPARQL
        });
      }
    });
  }

  return statsFromCode;
};

/**
 * Main restore function - populates empty Firebase from backup
 */
export const restoreFromBackup = async (
  backupData: any,
  onProgress?: (progress: RestoreProgress) => void
): Promise<RestoreResult> => {
  try {
    const progress: RestoreProgress = {
      currentStep: 'Starting restore...',
      templatesProcessed: 0,
      questionsProcessed: 0,
      statisticsProcessed: 0,
      usersProcessed: 0,
    };

    // Extract data from backup
    const data = backupData.data || backupData;
    const users = data.Users || [];
    const questionsFlat = data.Questions || [];
    const questionsNlp4re = data['Questions Nlp4re'] || [];
    const legacyTemplates = data.Templates || [];
    const backupStatistics = data.Statistics || [];

    // Step 1: Restore Users
    if (onProgress) {
      progress.currentStep = 'Restoring Users...';
      onProgress(progress);
    }
    progress.usersProcessed = await restoreUsers(users);

    // Step 2: Restore legacy templates (for reference)
    if (onProgress) {
      progress.currentStep = 'Restoring Legacy Templates...';
      onProgress(progress);
    }
    await restoreLegacyTemplates(legacyTemplates);

    // Step 3: Create Empirical Research Practice Template
    if (onProgress) {
      progress.currentStep = 'Creating Empirical Research Practice Template...';
      onProgress(progress);
    }

    const empiricalTemplateData = {
      id: 'R186491',
      title: 'Empirical Research Practice',
      collectionName: 'Questions',
      description:
        'Template for analyzing empirical research practices in software engineering',
    };

    const empiricalQuestions = convertBackupQuestionsToNewFormat(
      questionsFlat,
      empiricalQueriesFromCode
    );
    const empiricalStatistics = convertStatisticsToNewFormat(backupStatistics);

    const empiricalResult = await createNestedTemplate(
      'R186491',
      empiricalTemplateData,
      empiricalQuestions,
      empiricalStatistics
    );

    progress.templatesProcessed++;
    progress.questionsProcessed += empiricalResult.questionsCreated;
    progress.statisticsProcessed += empiricalResult.statisticsCreated;

    // Step 4: Create NLP4RE Template
    if (onProgress) {
      progress.currentStep = 'Creating NLP4RE Template...';
      onProgress(progress);
    }

    const nlp4reTemplateData = {
      id: 'R1544125',
      title: 'NLP4RE ID Card',
      collectionName: 'Questions Nlp4re',
      description: 'Template for NLP4RE research questions and analysis',
    };

    const nlp4reQuestions = convertBackupQuestionsToNewFormat(
      questionsNlp4re,
      nlp4reQueriesFromCode
    );
    const nlp4reStatistics: any[] = []; // Add NLP4RE specific statistics if available

    const nlp4reResult = await createNestedTemplate(
      'R1544125',
      nlp4reTemplateData,
      nlp4reQuestions,
      nlp4reStatistics
    );

    progress.templatesProcessed++;
    progress.questionsProcessed += nlp4reResult.questionsCreated;
    progress.statisticsProcessed += nlp4reResult.statisticsCreated;

    // Step 5: Complete
    if (onProgress) {
      progress.currentStep = 'Restore complete!';
      onProgress(progress);
    }

    return {
      success: true,
      statistics: {
        templatesCreated: progress.templatesProcessed,
        questionsCreated: progress.questionsProcessed,
        statisticsCreated: progress.statisticsProcessed,
        usersCreated: progress.usersProcessed,
      },
    };
  } catch (error) {
    console.error('Restore failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Restore from backup file (uploaded by user)
 */
export const restoreFromBackupFile = async (
  file: File,
  onProgress?: (progress: RestoreProgress) => void
): Promise<RestoreResult> => {
  try {
    const text = await file.text();
    const backupData = JSON.parse(text);
    return await restoreFromBackup(backupData, onProgress);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to parse backup file',
    };
  }
};

const RestoreFromBackup = {
  restoreFromBackup,
  restoreFromBackupFile,
};

export default RestoreFromBackup;
