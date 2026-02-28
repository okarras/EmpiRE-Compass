/* eslint-disable @typescript-eslint/no-explicit-any */
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import STATISTICS_SPARQL_QUERIES from '../api/STATISTICS_SPARQL_QUERIES';
import { getKeycloakToken } from '../auth/keycloakStore';

/**
 * Restore utilities (frontend-side data conversion + backend restore API proxy).
 * Frontend does not write to Firestore directly.
 */

export const serializeChartSettings = (chartSettings: any): any => {
  if (!chartSettings) return null;
  const serialized: any = {};

  Object.keys(chartSettings).forEach((key) => {
    const value = chartSettings[key];
    if (typeof value === 'function') return;
    if (Array.isArray(value)) {
      serialized[key] = value.map((item) =>
        typeof item === 'object' && item !== null ? serializeObject(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      serialized[key] = serializeObject(value);
    } else {
      serialized[key] = value;
    }
  });

  return serialized;
};

const serializeObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  const serialized: any = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === 'function') return;
    if (Array.isArray(value)) {
      serialized[key] = value.map((item) =>
        typeof item === 'object' && item !== null ? serializeObject(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      serialized[key] = serializeObject(value);
    } else {
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

export const convertBackupQuestionsToNewFormat = (
  backupQuestions: any[],
  codeQueries: any[]
): any[] => {
  if (!backupQuestions || backupQuestions.length === 0) {
    return [];
  }

  return backupQuestions.map((backupQ) => {
    const questionId = backupQ.uid || `query_${backupQ.id}`;
    const codeQuery = codeQueries.find(
      (q) => q.uid === backupQ.uid || q.id === backupQ.id
    );

    const questionDoc: any = {
      id: backupQ.id,
      uid: backupQ.uid,
      title: backupQ.title || codeQuery?.title || '',
      sparqlQuery:
        backupQ.sparqlQuery ||
        SPARQL_QUERIES[questionId as keyof typeof SPARQL_QUERIES] ||
        '',
      chartType: backupQ.chartType || codeQuery?.chartType,
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
      dataAnalysisInformation: {
        question:
          backupQ.dataAnalysisInformation?.question ||
          codeQuery?.dataAnalysisInformation?.question ||
          '',
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

    if (backupQ.uid_2 || codeQuery?.uid_2) {
      questionDoc.uid_2 = backupQ.uid_2 || codeQuery.uid_2;
      questionDoc.sparqlQuery2 =
        backupQ.sparqlQuery2 ||
        (codeQuery?.uid_2 &&
          SPARQL_QUERIES[codeQuery.uid_2 as keyof typeof SPARQL_QUERIES]) ||
        '';
    }

    if (backupQ.uid_2_merge || codeQuery?.uid_2_merge) {
      questionDoc.uid_2_merge = backupQ.uid_2_merge || codeQuery.uid_2_merge;
    }

    if (backupQ.tabs || codeQuery?.tabs) {
      questionDoc.tabs = backupQ.tabs || codeQuery.tabs;
    }

    if (backupQ.gridOptions) {
      questionDoc.gridOptions = backupQ.gridOptions;
    } else if (codeQuery?.gridOptions) {
      questionDoc.gridOptions = codeQuery.gridOptions;
    }

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

    return questionDoc;
  });
};

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

  if (backupStatistics && backupStatistics.length > 0) {
    backupStatistics.forEach((backupStat) => {
      const existing = statsFromCode.find((s) => s.id === backupStat.id);
      if (!existing) {
        statsFromCode.push({
          id: backupStat.id,
          name:
            backupStat.name || backupStat.id.replace(/_/g, ' ').toLowerCase(),
          sparqlQuery: backupStat.sparqlQuery || '',
          description: backupStat.description || '',
          ...backupStat,
        });
      } else {
        Object.assign(existing, {
          ...backupStat,
          sparqlQuery: existing.sparqlQuery,
        });
      }
    });
  }

  return statsFromCode;
};

const getBackendUrl = () =>
  import.meta.env.VITE_BACKEND_URL || 'https://empirecompassbackend.vercel.app';

export const restoreFromBackup = async (
  backupData: any,
  onProgress?: (progress: RestoreProgress) => void
): Promise<RestoreResult> => {
  try {
    const token = getKeycloakToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    onProgress?.({
      currentStep: 'Sending backup to backend...',
      templatesProcessed: 0,
      questionsProcessed: 0,
      statisticsProcessed: 0,
      usersProcessed: 0,
    });

    const response = await fetch(`${getBackendUrl()}/api/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(backupData),
    });

    const result = await response.json().catch(() => ({
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Restore failed',
      };
    }

    onProgress?.({
      currentStep: 'Restore complete!',
      templatesProcessed: result.collectionsRestored || 0,
      questionsProcessed: 0,
      statisticsProcessed: 0,
      usersProcessed: result.documentsRestored || 0,
    });

    return {
      success: true,
      statistics: {
        templatesCreated: result.collectionsRestored || 0,
        questionsCreated: 0,
        statisticsCreated: 0,
        usersCreated: result.documentsRestored || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

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
