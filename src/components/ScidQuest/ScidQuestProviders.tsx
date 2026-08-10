import { ReactNode, useMemo } from 'react';
import { QuestionnaireAIProvider, ScidQuestProvider } from '@orkg/scidquest';
import { useAIService } from '../../services/backendAIService';

interface ScidQuestProvidersProps {
  children: ReactNode;
}

export function ScidQuestProviders({ children }: ScidQuestProvidersProps) {
  const aiService = useAIService();

  // Bridges local AI service to the @orkg/scidquest LLM interface.
  const llmService = useMemo(() => {
    return {
      generateSuggestions: async (context: unknown) => {
        const prompt =
          typeof context === 'string' ? context : JSON.stringify(context);
        const res = await aiService.generateText(prompt);
        return res.text;
      },
      verifyAnswer: async (context: unknown) => {
        const prompt =
          typeof context === 'string' ? context : JSON.stringify(context);
        const res = await aiService.generateText(prompt);
        return res.text;
      },
      prompt: async (promptStr: string) => {
        const res = await aiService.generateText(promptStr);
        return res.text;
      },
      generate: async (promptStr: string) => {
        const res = await aiService.generateText(promptStr);
        return res.text;
      },
    };
  }, [aiService]);

  return (
    // Bypasses type checking due to @orkg/scidquest interface mismatch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <ScidQuestProvider llmService={llmService as any}>
      <QuestionnaireAIProvider>{children}</QuestionnaireAIProvider>
    </ScidQuestProvider>
  );
}
