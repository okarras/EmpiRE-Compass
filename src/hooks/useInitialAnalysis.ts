import { useState, useEffect } from 'react';
import { Query } from '../constants/queries_chart_info';
import { CacheEntry, getCache, setCache } from '../utils/aiAssistantCache';
import { cleanAiHtmlResponse } from '../utils/aiResponseCleanup';

const INITIAL_ANALYSIS_PROMPT = `Analyze this research question and data. Output ONLY valid HTML analysis content—no meta-instructions, no formatting guidelines, no rubric text.

Structure your response with these HTML sections:
- <h1>Initial Analysis</h1>
- <h2>Question Overview</h2> — overview and significance
- <h2>Data Analysis Approach</h2> — methodology used
- <h2>Key Findings</h2> — main findings from the data
- <h2>Potential Insights</h2> — implications and insights
- <h2>Limitations and Considerations</h2> — limitations to keep in mind
- <h2>References</h2> — cite relevant papers as clickable hyperlinks

Write the actual analysis in <p> tags. For References: use markdown-style links [Author, A., Author, B., & Author, C. (Year). Title. Journal, Volume(Issue), pages.](https://doi.org/DOI) or <a href="URL">full citation</a> in HTML. Always include the DOI or ORKG URL. Do not echo these instructions in your output.`;

interface UseInitialAnalysisProps {
  query: Query;
  questionData: Record<string, unknown>[];
  generateWithProvider: (
    fullPrompt: string,
    systemContext?: string
  ) => Promise<{ text: string; reasoning?: string }>;
  generateSystemContext: () => string;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInitialAnalysis = ({
  query,
  questionData,
  generateWithProvider,
  generateSystemContext,
  setLoading,
  setError,
}: UseInitialAnalysisProps) => {
  const [initialAnalysis, setInitialAnalysis] = useState<string | null>(null);
  const [initialReasoning, setInitialReasoning] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastCachedAnalysis, setLastCachedAnalysis] = useState<string | null>(
    null
  );
  const [lastCachedReasoning, setLastCachedReasoning] = useState<string | null>(
    null
  );
  const [refreshingInitialAnalysis, setRefreshingInitialAnalysis] =
    useState(false);

  useEffect(() => {
    const performInitialAnalysis = async () => {
      try {
        setLoading(true);

        // Check cache for initial analysis
        const cacheKey = `query_${query.id}`;
        const responseCache: Record<string, CacheEntry> = getCache();

        const cacheEntry = responseCache[cacheKey] as CacheEntry | undefined;
        if (cacheEntry && typeof cacheEntry.analysis === 'string') {
          setInitialAnalysis(cacheEntry.analysis);
          setInitialReasoning(cacheEntry.reasoning || null);
          setIsFromCache(true);
          setLastCachedAnalysis(cacheEntry.analysis);
          setLastCachedReasoning(cacheEntry.reasoning || null);
          setLoading(false);
          return;
        }

        const { reasoning, text } = await generateWithProvider(
          INITIAL_ANALYSIS_PROMPT,
          generateSystemContext()
        );

        const cleanedText = cleanAiHtmlResponse(text);

        // Store in cache
        const updatedCache = {
          ...responseCache,
          [cacheKey]: {
            analysis: cleanedText,
            reasoning: reasoning,
            timestamp: Date.now(),
          },
        };
        setCache(updatedCache);

        const prevCacheEntry = responseCache[cacheKey] as
          | CacheEntry
          | undefined;
        if (prevCacheEntry && typeof prevCacheEntry.analysis === 'string') {
          setLastCachedAnalysis(prevCacheEntry.analysis);
          setLastCachedReasoning(prevCacheEntry.reasoning || null);
        }

        setInitialAnalysis(cleanedText);
        setInitialReasoning(reasoning ?? null);
        setIsFromCache(false);
      } catch (err) {
        setError('Failed to generate initial analysis');
        console.error('Initial Analysis Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!initialAnalysis && questionData.length > 0) {
      performInitialAnalysis();
    }
  }, [query, questionData]);

  const undoInitialAnalysis = () => {
    if (lastCachedAnalysis) {
      setInitialAnalysis(lastCachedAnalysis);
      setInitialReasoning(lastCachedReasoning);
      setIsFromCache(true);
    }
  };

  const refreshInitialAnalysis = async () => {
    try {
      setRefreshingInitialAnalysis(true);
      setIsFromCache(false);
      setError(null);
      const cacheKey = `query_${query.id}`;
      const responseCache: Record<string, CacheEntry> = getCache();
      const prevCacheEntry = responseCache[cacheKey] as CacheEntry | undefined;
      if (prevCacheEntry && typeof prevCacheEntry.analysis === 'string') {
        setLastCachedAnalysis(prevCacheEntry.analysis);
        setLastCachedReasoning(prevCacheEntry.reasoning || null);
      }
      const { reasoning, text } = await generateWithProvider(
        INITIAL_ANALYSIS_PROMPT,
        generateSystemContext()
      );
      const cleanedText = cleanAiHtmlResponse(text);

      // Store in cache
      const updatedCache = {
        ...responseCache,
        [cacheKey]: {
          analysis: cleanedText,
          reasoning,
          timestamp: Date.now(),
        },
      };
      setCache(updatedCache);
      setInitialAnalysis(cleanedText);
      setInitialReasoning(reasoning ?? null);
      setIsFromCache(false);
    } catch (err) {
      setError('Failed to refresh initial analysis');
      console.error('Refresh Initial Analysis Error:', err);
    } finally {
      setRefreshingInitialAnalysis(false);
    }
  };

  const canUndoInitialAnalysis = !!lastCachedAnalysis && !isFromCache;

  return {
    initialAnalysis,
    initialReasoning,
    isFromCache,
    lastCachedAnalysis,
    lastCachedReasoning,
    refreshingInitialAnalysis,
    undoInitialAnalysis,
    refreshInitialAnalysis,
    canUndoInitialAnalysis,
  };
};
