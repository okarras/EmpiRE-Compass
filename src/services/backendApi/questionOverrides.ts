import { apiRequest } from './client';

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

export const saveChartSettings = async (
  queryUid: string,
  which: 'chartSettings' | 'chartSettings2',
  settings: ChartSettingsOverride,
  userId: string,
  userEmail: string,
  changeDescription?: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/question-overrides/${queryUid}/chart-settings`, {
    method: 'POST',
    body: JSON.stringify({ which, settings, changeDescription }),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const getQuestionOverride = async (queryUid: string) => {
  return apiRequest(`/api/question-overrides/${queryUid}`, {
    cache: 'no-store',
  });
};

export const saveQuestionOverrideVersion = async (
  queryUid: string,
  versionData: Record<string, unknown>,
  userId: string,
  userEmail: string,
  changeDescription?: string,
  keycloakToken?: string
) => {
  return apiRequest(`/api/question-overrides/${queryUid}/version`, {
    method: 'POST',
    body: JSON.stringify({ versionData, changeDescription }),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};

export const restoreQuestionOverrideVersion = async (
  queryUid: string,
  versionId: string,
  userId: string,
  userEmail: string,
  keycloakToken?: string
): Promise<{
  success: boolean;
  doc: import('../../firestore/CRUDStaticQuestionOverrides').QuestionOverrideDocument;
}> => {
  return apiRequest(`/api/question-overrides/${queryUid}/restore`, {
    method: 'POST',
    body: JSON.stringify({ versionId }),
    userId,
    userEmail,
    requiresAdmin: true,
    keycloakToken,
  });
};
