import { ReactNode, useMemo, useEffect } from 'react';
import {
  QuestionnaireAIProvider,
  ScidQuestProvider,
  LLMService,
  useScidQuestContext,
} from '@orkg/scidquest';
import { useAIService } from '../../services/backendAIService';

function SemanticChunkingBypasser() {
  const context = useScidQuestContext();

  useEffect(() => {
    if (context?.adapter) {
      // Get the HTML content and pass it directly to the backend
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (context.adapter as any).getSemanticChunks = async () => {
        throw new Error(
          'BYPASS_LOCAL_ML: Offloading text extraction to backend.'
        );
      };
    }
  }, [context]);

  return null;
}

interface ScidQuestProvidersProps {
  children: ReactNode;
}

export function ScidQuestProviders({ children }: ScidQuestProvidersProps) {
  const aiService = useAIService();

  const llmService: LLMService = useMemo(() => {
    return {
      generateText: async (prompt: string) => {
        const MAX_CHARS = 400000;
        let finalPrompt = prompt;
        if (prompt.length > MAX_CHARS) {
          console.warn(
            `[ScidQuestProviders] Prompt too large (${prompt.length} chars). Truncating to ${MAX_CHARS}.`
          );
          finalPrompt =
            prompt.substring(0, MAX_CHARS) +
            '\n\n...[DOCUMENT TRUNCATED DUE TO LENGTH]...';
        }

        // remind at the model at the end to force into JSON mode or it might forget due to large context size
        finalPrompt += `\n\nCRITICAL REMINDER: You MUST format your entire response as a valid JSON object containing exactly 3 suggestions, exactly matching the requested JSON schema from the instructions above. DO NOT respond with conversational text or markdown formatting. Respond ONLY with raw JSON starting with { and ending with }.`;

        try {
          const res = await aiService.generateText(finalPrompt);

          // intercept the JSON and forcefully map common variations to the exact schema
          let cleanedText = res.text;
          const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);

              if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                parsed.suggestions = parsed.suggestions.map(
                  (s: any, idx: number) => {
                    return {
                      rank: s.rank || s.Rank || idx + 1,
                      text:
                        s.text ||
                        s.Text ||
                        s.answer ||
                        s.Answer ||
                        s.suggestion ||
                        s.value ||
                        '',
                      confidence:
                        s.confidence || s.Confidence || s.score || 0.5,
                      evidence: (s.evidence || s.Evidence || []).map(
                        (e: any) => ({
                          pageNumber:
                            e.pageNumber ||
                            e.PageNumber ||
                            e.page ||
                            e.Page ||
                            1,
                          excerpt:
                            e.excerpt ||
                            e.Excerpt ||
                            e.text ||
                            e.Text ||
                            e.quote ||
                            e.Quote ||
                            '',
                        })
                      ),
                    };
                  }
                );
              }

              cleanedText = JSON.stringify(parsed, null, 2);
            } catch (err) {
              console.warn(
                '[ScidQuestProviders] Failed to parse and normalize JSON:',
                err
              );
            }
          }

          return { text: cleanedText };
        } catch (e: any) {
          console.error('[ScidQuestProviders] AI Service Error:', e);
          throw e; // rethrow so ScidQuest can catch it and reset state
        }
      },
      isConfigured: () => {
        // return aiService.isConfigured();
        return true;
      },
    };
  }, [aiService]);

  return (
    <ScidQuestProvider llmService={llmService}>
      <SemanticChunkingBypasser />
      <QuestionnaireAIProvider>{children}</QuestionnaireAIProvider>
    </ScidQuestProvider>
  );
}
