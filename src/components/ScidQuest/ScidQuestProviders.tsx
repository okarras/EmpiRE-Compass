import { ReactNode, useMemo, useRef } from 'react';
import { ScidQuestProvider, LLMService } from '@orkg/scidquest';
import { useAIService } from '../../services/backendAIService';

interface ScidQuestProvidersProps {
  children: ReactNode;
}

/**
 * Bridges EmpiRE-Compass' AI service to the `LLMService` contract ScidQuest
 * expects.
 *
 * The library builds its own prompts: `prompt` carries the user message and
 * `options.systemContext` the schema instructions, which differ between
 * suggestion and verification calls. Both must be forwarded verbatim — the
 * library normalizes the responses itself, so nothing here inspects or rewrites
 * the model output.
 *
 * `QuestionnaireAIProvider` is deliberately absent: `ResearchQuestionnaireApp`
 * mounts one internally, and a second instance would split the AI history it
 * persists.
 */
export function ScidQuestProviders({ children }: ScidQuestProvidersProps) {
  const aiService = useAIService();

  // useAIService() returns a fresh instance on every render. Reading it through
  // a ref keeps the LLMService identity stable, so ScidQuestProvider does not
  // rebuild its adapter (and drop in-flight requests) on unrelated re-renders,
  // while calls still use the current AI configuration.
  const aiServiceRef = useRef(aiService);
  aiServiceRef.current = aiService;

  const llmService: LLMService = useMemo(
    () => ({
      generateText: async (prompt, options) => {
        const { text, reasoning, usage } =
          await aiServiceRef.current.generateText(prompt, {
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
            systemContext: options?.systemContext,
            signal: options?.signal,
          });

        return { text, reasoning, usage };
      },
      isConfigured: () => aiServiceRef.current.isConfigured(),
    }),
    []
  );

  return <ScidQuestProvider llmService={llmService}>{children}</ScidQuestProvider>;
}
