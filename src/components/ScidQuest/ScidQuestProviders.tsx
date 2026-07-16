import { ReactNode } from 'react';
import { QuestionnaireAIProvider } from '@orkg/scidquest';

interface ScidQuestProvidersProps {
  children: ReactNode;
}

export function ScidQuestProviders({ children }: ScidQuestProvidersProps) {
  return <QuestionnaireAIProvider>{children}</QuestionnaireAIProvider>;
}
