import { useState } from 'react';
import { useAIService } from '../services/backendAIService';
import { useDynamicQuestion } from '../context/DynamicQuestionContext';
import { useAppSelector } from '../store/hooks';
import { generateQuestionAlignmentPrompt } from '../utils/promptGenerator';
import { PredicatesMapping } from '../components/Graph/types';

export function usePredicateAlignment(options: {
  question: string;
  templateMapping: PredicatesMapping | undefined;
  templateId: string | undefined;
  targetClassId: string | undefined;
  onQuestionChange: (question: string) => void;
  setError: (error: string | null) => void;
}) {
  const {
    question,
    templateMapping,
    templateId,
    targetClassId,
    onQuestionChange,
    setError,
  } = options;

  const aiService = useAIService();
  const { state, updateCosts } = useDynamicQuestion();
  const {
    provider,
    openaiModel,
    groqModel,
    mistralModel,
    googleModel,
    openrouterModel,
  } = useAppSelector((s) => s.ai);

  const currentModel =
    provider === 'openai'
      ? openaiModel
      : provider === 'groq'
        ? groqModel
        : provider === 'mistral'
          ? mistralModel
          : provider === 'google'
            ? googleModel
            : openrouterModel;

  const [aligningQuestion, setAligningQuestion] = useState(false);

  const handleAlignQuestionWithSchema = async () => {
    if (!question.trim()) {
      setError('Enter a draft question first.');
      return;
    }
    if (!templateMapping || Object.keys(templateMapping).length === 0) {
      setError('Template schema is not loaded yet.');
      return;
    }
    if (!aiService.isConfigured()) {
      setError('Please configure your AI settings first.');
      return;
    }

    setAligningQuestion(true);
    setError(null);

    try {
      const prompt = generateQuestionAlignmentPrompt(
        templateMapping,
        (templateId || 'R186491').toUpperCase(),
        question,
        targetClassId ?? undefined
      );
      const result = await aiService.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 500,
        provider,
        model: currentModel,
        systemContext:
          'You rewrite research questions to align with a given knowledge graph template. Output only the single rewritten question.',
      });
      const text = result.text.trim().replace(/^["']|["']$/g, '');
      if (text) onQuestionChange(text);
      if (result.cost) {
        updateCosts([
          ...state.costs,
          {
            ...result.cost,
            section: 'Align question with schema',
          },
        ]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to align question with schema'
      );
    } finally {
      setAligningQuestion(false);
    }
  };

  return { aligningQuestion, handleAlignQuestionWithSchema };
}
