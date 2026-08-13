import { ReactNode, useMemo } from 'react';
import {
  QuestionnaireAIProvider,
  ScidQuestProvider,
  LLMService,
} from '@orkg/scidquest';
import { useAIService } from '../../services/backendAIService';

interface ScidQuestProvidersProps {
  children: ReactNode;
}

export function ScidQuestProviders({ children }: ScidQuestProvidersProps) {
  const aiService = useAIService();

  // Bridges local AI service to the @orkg/scidquest LLM interface.
  const llmService: LLMService = useMemo(() => {
    return {
      generateText: async (prompt: string) => {
        const res = await aiService.generateText(prompt);
        return { text: res.text };
      },
      isConfigured: () => {
        // return aiService.isConfigured();
        return true;
      },
    };
  }, [aiService]);

  return (
    <ScidQuestProvider llmService={llmService}>
      <QuestionnaireAIProvider>{children}</QuestionnaireAIProvider>
    </ScidQuestProvider>
  );
}
