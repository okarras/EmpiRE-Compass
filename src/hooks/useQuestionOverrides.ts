import { useState, useEffect, useCallback } from 'react';
import { useAuthData } from '../auth/useAuthData';
import CRUDStaticQuestionOverrides, {
  QuestionOverrideDocument,
  QuestionVersion,
} from '../firestore/CRUDStaticQuestionOverrides';
import type { Query } from '../constants/queries_chart_info';

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

  const fetchOverrides = useCallback(async () => {
    if (!query.uid) return;

    setLoading(true);
    try {
      const overrides = await CRUDStaticQuestionOverrides.getQuestionOverride(
        query.uid
      );
      setOverrideData(overrides);

      if (overrides?.latestVersion) {
        // Merge overrides into the query object
        // We do a deep merge for specific fields we allow overriding
        const latest = overrides.latestVersion;
        const newQuery = { ...query };

        if (latest.title) {
          newQuery.title = latest.title;
        }

        if (latest.dataAnalysisInformation) {
          newQuery.dataAnalysisInformation = {
            ...newQuery.dataAnalysisInformation,
            ...latest.dataAnalysisInformation,
          };
        }

        if (latest.chartSettings) {
          // Ensure chartSettings exists before merging
          newQuery.chartSettings = newQuery.chartSettings
            ? { ...newQuery.chartSettings, ...latest.chartSettings }
            : undefined; // Or Create strict typing if chartSettings didn't exist?
          // The interface implies it's optional, so we only merge if it exists or if we want to allow adding it.
          // For now, let's assume we only override properties of existing chartSettings to be safe,
          // or if we strictly want to override headings.

          // Actually, let's be careful. If the original query has chartSettings, we update it.
          if (query.chartSettings && latest.chartSettings) {
            newQuery.chartSettings = {
              ...query.chartSettings,
              ...latest.chartSettings,
            };
          }
        }

        setMergedQuery(newQuery);
      } else {
        setMergedQuery(query);
      }
    } catch (err) {
      console.error('Failed to load question overrides:', err);
    } finally {
      setLoading(false);
    }
  }, [query]);

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
      updateData.chartSettings = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [subField]: content as any,
      };
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

  const handleRestore = async (versionId: string) => {
    if (!isAuthenticated || !user) return;
    try {
      await CRUDStaticQuestionOverrides.restoreQuestionVersion(
        query.uid,
        versionId,
        user.id || 'unknown',
        user.display_name
      );
      await fetchOverrides();
    } catch (err) {
      console.error('Failed to restore version', err);
    }
  };

  return {
    mergedQuery,
    overrideData,
    loading,
    isAdmin,
    isEditMode,
    setIsEditMode,
    saveVersion,
    fetchOverrides,
    historyOpen,
    setHistoryOpen,
    handleRestore,
  };
};
