/**
 * Question Override Service (Firebase Admin SDK)
 * Saves chart settings and other question overrides to Firestore.
 */

import { db } from '../config/firebase.js';

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

export interface SaveChartSettingsParams {
  queryUid: string;
  which: 'chartSettings' | 'chartSettings2';
  settings: ChartSettingsOverride;
  authorId: string;
  authorName?: string;
  changeDescription?: string;
}

export async function saveChartSettings(
  params: SaveChartSettingsParams
): Promise<void> {
  const { queryUid, which, settings, authorId, authorName, changeDescription } =
    params;

  const docRef = db.collection('QuestionOverrides').doc(queryUid);
  const docSnap = await docRef.get();

  const existingLatest = (
    docSnap.exists ? docSnap.data()?.latestVersion : null
  ) as Record<string, unknown> | null;
  const mergedChartSettings = {
    ...((existingLatest?.[which] as Record<string, unknown>) || {}),
    ...settings,
  };

  const newVersion: Record<string, unknown> = {
    versionId: `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    authorId,
    authorName,
    changeDescription: changeDescription ?? `Updated ${which}`,
    [which]: mergedChartSettings,
  };

  // Preserve other override fields from existing latest
  if (existingLatest) {
    if (existingLatest.title !== undefined)
      newVersion.title = existingLatest.title;
    if (existingLatest.dataAnalysisInformation !== undefined) {
      newVersion.dataAnalysisInformation =
        existingLatest.dataAnalysisInformation;
    }
    if (
      which === 'chartSettings' &&
      existingLatest.chartSettings2 !== undefined
    ) {
      newVersion.chartSettings2 = existingLatest.chartSettings2;
    }
    if (
      which === 'chartSettings2' &&
      existingLatest.chartSettings !== undefined
    ) {
      newVersion.chartSettings = existingLatest.chartSettings;
    }
  }

  if (docSnap.exists) {
    const existing = docSnap.data();
    const versions = (existing?.versions || []) as Record<string, unknown>[];
    await docRef.set(
      {
        latestVersion: newVersion,
        versions: [newVersion, ...versions].slice(0, 50),
      },
      { merge: true }
    );
  } else {
    await docRef.set({
      id: queryUid,
      latestVersion: newVersion,
      versions: [newVersion],
    });
  }
}
