import { useState, useEffect, useCallback } from 'react';
import { useAuthData } from '../auth/useAuthData';
import CRUDStaticQuestionOverrides, {
  QuestionOverrideDocument,
  QuestionVersion,
} from '../firestore/CRUDStaticQuestionOverrides';
import type { Query } from '../constants/queries_chart_info';
import type { ChartSettingsOverride } from '../firestore/CRUDStaticQuestionOverrides';
import BackupService from '../services/BackupService';
import { saveChartSettings as saveChartSettingsApi } from '../services/backendApi';
import { getKeycloakToken } from '../auth/keycloakStore';

interface UseQuestionOverridesProps {
  query: Query;
}

export const useQuestionOverrides = ({ query }: UseQuestionOverridesProps) => {
  const { user, isAuthenticated } = useAuthData();
  const isAdmin = user?.is_admin === true;

  const [mergedQuery, setMergedQuery] = useState<Query>(query);
  const [loading, setLoading] = useState(true);
  const [overrideData, setOverrideData] =
    useState<QuestionOverrideDocument | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const applyOverrides = useCallback(
    (overrides: QuestionOverrideDocument | null): Query => {
      if (!overrides?.latestVersion) return { ...query };
      const latest = overrides.latestVersion;
      const newQuery: Query = { ...query };

      if (latest.title !== undefined) {
        newQuery.title = latest.title;
      }
      if (latest.dataAnalysisInformation) {
        newQuery.dataAnalysisInformation = {
          ...(query.dataAnalysisInformation || {}),
          ...latest.dataAnalysisInformation,
        };
      }
      if (latest.chartSettings && query.chartSettings) {
        newQuery.chartSettings = {
          ...query.chartSettings,
          ...latest.chartSettings,
        };
      }
      if (latest.chartSettings2 && query.chartSettings2) {
        newQuery.chartSettings2 = {
          ...query.chartSettings2,
          ...latest.chartSettings2,
        };
      }
      return newQuery;
    },
    [query]
  );

  const fetchOverrides = useCallback(async () => {
    if (!query.uid) return;

    // Skip fetching overrides when using backup - they're not available
    if (BackupService.isExplicitlyUsingBackup()) {
      setMergedQuery(query);
      setOverrideData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const overrides = await CRUDStaticQuestionOverrides.getQuestionOverride(
        query.uid
      );
      setOverrideData(overrides);
      setMergedQuery(applyOverrides(overrides));
    } catch (err: any) {
      // Only log non-permission errors (permission errors are expected when using backup)
      if (
        err?.code !== 'permission-denied' &&
        !err?.message?.includes('permission')
      ) {
        console.error('Failed to load question overrides:', err);
      }
      setMergedQuery(query);
    } finally {
      setLoading(false);
    }
  }, [query, applyOverrides]);

  // Initial load
  useEffect(() => {
    void fetchOverrides();
  }, [fetchOverrides]);

  const saveVersion = async (
    field: string, // dot notation e.g. 'dataAnalysisInformation.questionExplanation'
    content: string | string[],
    changeDescription?: string
  ) => {
    if (!isAuthenticated || !user) throw new Error('Not authenticated');

    // Construct the partial update object based on the field path
    // This is a simplified implementation for the specific fields we allowed
    const updateData: Partial<QuestionVersion> = {};

    // We need to map the flat field update to the nested QuestionVersion structure
    // This is a bit manual but safe
    if (field === 'title') {
      updateData.title = content as string;
    } else if (field.startsWith('dataAnalysisInformation.')) {
      const subField = field.split('.')[1];
      updateData.dataAnalysisInformation = {
        [subField]: content,
      };
    } else if (field.startsWith('chartSettings.')) {
      const subField = field.split('.')[1];
      const existing = overrideData?.latestVersion?.chartSettings || {};
      updateData.chartSettings = {
        ...existing,
        [subField]: content,
      } as ChartSettingsOverride;
    } else if (field.startsWith('chartSettings2.')) {
      const subField = field.split('.')[1];
      const existing = overrideData?.latestVersion?.chartSettings2 || {};
      updateData.chartSettings2 = {
        ...existing,
        [subField]: content,
      } as ChartSettingsOverride;
    }

    try {
      await CRUDStaticQuestionOverrides.saveQuestionVersion(
        query.uid,
        updateData,
        user.id || 'unknown',
        user.display_name || user.email || 'Admin',
        changeDescription
      );

      // Reload to get the fresh state (including the new version in history)
      await fetchOverrides();
      return true;
    } catch (err) {
      console.error('Failed to save version:', err);
      throw err;
    }
  };

  const saveChartSettings = async (
    which: 'chartSettings' | 'chartSettings2',
    settings: ChartSettingsOverride,
    changeDescription?: string
  ) => {
    if (!isAuthenticated || !user) throw new Error('Not authenticated');

    try {
      await saveChartSettingsApi(
        query.uid,
        which,
        settings,
        user.id || 'unknown',
        user.email || user.display_name || 'Admin',
        changeDescription ?? `Updated ${which}`,
        getKeycloakToken() || undefined
      );
      await fetchOverrides();
      return true;
    } catch (err) {
      console.error('Failed to save chart settings:', err);
      throw err;
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('Not authenticated');
    }
    // Backend returns the restored document directly — no second round-trip needed
    const restoredDoc =
      await CRUDStaticQuestionOverrides.restoreQuestionVersion(
        query.uid,
        versionId,
        user.id || 'unknown',
        user.display_name
      );
    // Apply the restored overrides immediately from the returned document
    setOverrideData(restoredDoc);
    setMergedQuery(applyOverrides(restoredDoc));
  };

  return {
    mergedQuery,
    overrideData,
    loading,
    isAdmin,
    isEditMode,
    setIsEditMode,
    saveVersion,
    saveChartSettings,
    fetchOverrides,
    historyOpen,
    setHistoryOpen,
    handleRestore,
  };
};
