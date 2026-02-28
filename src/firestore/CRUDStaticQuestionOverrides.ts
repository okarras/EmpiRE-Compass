/**
 * CRUD operations for Static Question Overrides
 * Allows admins to edit "static" questions and maintains a version history.
 */

import BackupService from '../services/BackupService';
import {
  getQuestionOverride as getQuestionOverrideApi,
  saveQuestionOverrideVersion as saveQuestionOverrideVersionApi,
  restoreQuestionOverrideVersion as restoreQuestionOverrideVersionApi,
} from '../services/backendApi';
import { getKeycloakToken } from '../auth/keycloakStore';

export interface QuestionVersion {
  versionId: string;
  timestamp: number;
  authorId: string;
  authorName?: string;
  changeDescription?: string;
  // Content fields that can be overridden
  title?: string;
  dataAnalysisInformation?: {
    question?: string;
    questionExplanation?: string;
    dataAnalysis?: string | string[];
    dataInterpretation?: string | string[];
    requiredDataForAnalysis?: string | string[];
  };
  chartSettings?: ChartSettingsOverride;
  chartSettings2?: ChartSettingsOverride;
}

/** Editable chart settings stored in overrides (MUI X Charts compatible) */
export interface ChartSettingsOverride {
  heading?: string;
  detailedChartHeading?: string;
  seriesHeadingTemplate?: string;
  colors?: string[];
  height?: number;
  width?: number;
  barLabel?: string;
  barCategoryGap?: number;
  barGap?: number;
  barWidth?: number;
  barCategoryGapRatio?: number;
  barGapRatio?: number;
  hideDetailedCharts?: boolean;
  noHeadingInSeries?: boolean;
  doesntHaveNormalization?: boolean;
  maxLabelLength?: number | 'auto';
  hideDetailedChartLegend?: boolean;
  layout?: 'horizontal' | 'vertical';
  borderRadius?: number;
  hideLegend?: boolean;
  showToolbar?: boolean;
  skipAnimation?: boolean;
  disableAxisListener?: boolean;
  axisHighlight?: {
    x?: 'band' | 'line' | 'none';
    y?: 'band' | 'line' | 'none';
  };
  grid?: { horizontal?: boolean; vertical?: boolean };
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

export interface QuestionOverrideDocument {
  id: string; // The query uid (e.g., 'query_1')
  latestVersion: QuestionVersion;
  versions: QuestionVersion[];
}

/**
 * Get the override data for a specific question
 * @param queryUid - The unique ID of the question (e.g., 'query_1')
 */
export const getQuestionOverride = async (
  queryUid: string
): Promise<QuestionOverrideDocument | null> => {
  // Skip Firebase calls when using backup - overrides are not available in backup mode
  if (BackupService.isExplicitlyUsingBackup()) {
    return null;
  }

  try {
    const result = await getQuestionOverrideApi(queryUid);
    return (result as QuestionOverrideDocument) || null;
  } catch (error: any) {
    if (
      error?.message?.includes('404') ||
      error?.message?.includes('Not found')
    ) {
      return null;
    }
    console.error('Error fetching question override:', error);
    throw error;
  }
};

/**
 * Save a new version of a question override
 * @param queryUid - The unique ID of the question
 * @param versionData - The new content to save
 * @param authorId - ID of the user making the change
 * @param authorName - Name of the user making the change
 * @param changeDescription - Optional description of what changed
 */
export const saveQuestionVersion = async (
  queryUid: string,
  versionData: Partial<QuestionVersion>,
  authorId: string,
  authorName?: string,
  changeDescription?: string
): Promise<void> => {
  try {
    await saveQuestionOverrideVersionApi(
      queryUid,
      versionData as Record<string, unknown>,
      authorId,
      authorName || 'Admin',
      changeDescription,
      getKeycloakToken() || undefined
    );
  } catch (error) {
    console.error('Error saving question version:', error);
    throw error;
  }
};

/**
 * Restore a specific version of a question
 * @param queryUid - The unique ID of the question
 * @param versionId - The ID of the version to restore
 * @param authorId - ID of the user performing the restore
 */
export const restoreQuestionVersion = async (
  queryUid: string,
  versionId: string,
  authorId: string,
  authorName?: string
): Promise<QuestionOverrideDocument> => {
  const result = await restoreQuestionOverrideVersionApi(
    queryUid,
    versionId,
    authorId,
    authorName || 'Admin',
    getKeycloakToken() || undefined
  );
  return result.doc as QuestionOverrideDocument;
};

const CRUDStaticQuestionOverrides = {
  getQuestionOverride,
  saveQuestionVersion,
  restoreQuestionVersion,
};

export default CRUDStaticQuestionOverrides;
