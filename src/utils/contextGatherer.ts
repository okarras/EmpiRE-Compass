import type {
  SiblingContext,
  PreviousEntryContext,
  ContextGatheringConfig,
  ParentContext,
  TokenLimits,
} from '../types/context';
import { DEFAULT_CONTEXT_CONFIG } from '../types/context';
import { TokenEstimator } from './tokenEstimator';

interface QuestionDefinition {
  id: string;
  label?: string;
  [key: string]: any;
}

export class ContextGatherer {
  private config: ContextGatheringConfig;
  private tokenEstimator: TokenEstimator;
  private visitedQuestions: Set<string>;

  constructor(
    config?: Partial<ContextGatheringConfig>,
    tokenLimits?: Partial<TokenLimits>
  ) {
    this.config = {
      ...DEFAULT_CONTEXT_CONFIG,
      ...config,
    };
    const limitsToUse = this.config.tokenLimits || tokenLimits;
    this.tokenEstimator = new TokenEstimator(limitsToUse);
    this.visitedQuestions = new Set<string>();
  }

  public gatherSiblingContext(
    currentQuestionId: string,
    siblingQuestionIds: string[],
    allAnswers: Record<string, any>,
    questionDefinitions: Record<string, QuestionDefinition>
  ): SiblingContext[] {
    try {
      if (!this.config.includeSiblings) {
        return [];
      }

      this.resetVisitedQuestions();

      this.markQuestionVisited(currentQuestionId);

      const siblings: SiblingContext[] = [];

      for (const siblingId of siblingQuestionIds) {
        try {
          if (siblingId === currentQuestionId) {
            continue;
          }

          if (this.hasVisitedQuestion(siblingId)) {
            console.warn(
              `[ContextGatherer] Circular reference detected for sibling question: ${siblingId}`
            );
            continue;
          }

          const answer = allAnswers[siblingId];
          if (!answer || !this.isAnswerValid(answer)) {
            continue;
          }

          const questionDef = questionDefinitions[siblingId];
          if (!questionDef) {
            console.warn(
              `[ContextGatherer] Question definition not found for sibling: ${siblingId}`
            );
            continue;
          }

          this.markQuestionVisited(siblingId);

          siblings.push({
            questionText: questionDef.label || questionDef.id,
            answer: this.formatAnswer(answer),
            questionId: siblingId,
            answeredAt: this.getAnswerTimestamp(answer),
          });
        } catch (error) {
          console.error(
            `[ContextGatherer] Error processing sibling ${siblingId}:`,
            error
          );
          continue;
        }
      }

      return siblings
        .sort((a, b) => b.answeredAt - a.answeredAt)
        .slice(0, this.config.maxSiblings);
    } catch (error) {
      console.error(
        '[ContextGatherer] Error gathering sibling context:',
        error
      );
      return [];
    }
  }

  public gatherPreviousEntryContext(
    currentEntryIndex: number,
    allEntries: any[],
    questionDefinitions: QuestionDefinition[]
  ): PreviousEntryContext[] {
    try {
      if (!this.config.includePreviousEntries) {
        return [];
      }

      if (currentEntryIndex === 0) {
        return [];
      }

      this.resetVisitedQuestions();

      const previousEntries: PreviousEntryContext[] = [];
      const startIndex = Math.max(
        0,
        currentEntryIndex - this.config.maxPreviousEntries
      );

      for (let i = startIndex; i < currentEntryIndex; i++) {
        try {
          const entry = allEntries[i];
          if (!entry) {
            console.warn(`[ContextGatherer] Entry ${i} is undefined or null`);
            continue;
          }

          const answeredQuestions = [];

          for (const questionDef of questionDefinitions) {
            try {
              if (this.hasVisitedQuestion(questionDef.id)) {
                console.warn(
                  `[ContextGatherer] Circular reference detected for question in entry ${i + 1}: ${questionDef.id}`
                );
                continue;
              }

              const answer = entry[questionDef.id];
              if (answer && this.isAnswerValid(answer)) {
                this.markQuestionVisited(questionDef.id);

                answeredQuestions.push({
                  questionText: questionDef.label || questionDef.id,
                  answer: this.formatAnswer(answer),
                  questionId: questionDef.id,
                });
              }
            } catch (error) {
              console.error(
                `[ContextGatherer] Error processing question ${questionDef.id} in entry ${i + 1}:`,
                error
              );
              continue;
            }
          }

          if (answeredQuestions.length > 0) {
            previousEntries.push({
              entryNumber: i + 1,
              questions: answeredQuestions,
            });
          }
        } catch (error) {
          console.error(
            `[ContextGatherer] Error processing entry ${i}:`,
            error
          );
          continue;
        }
      }

      return previousEntries;
    } catch (error) {
      console.error(
        '[ContextGatherer] Error gathering previous entry context:',
        error
      );
      return [];
    }
  }

  private formatAnswer(answer: any): string {
    try {
      let formatted: string;

      if (typeof answer === 'string') {
        formatted = answer;
      } else if (Array.isArray(answer)) {
        formatted = answer.join(', ');
      } else if (typeof answer === 'object' && answer !== null) {
        if ('value' in answer) {
          return this.formatAnswer(answer.value);
        }
        try {
          formatted = JSON.stringify(answer);
        } catch (jsonError) {
          console.warn(
            '[ContextGatherer] Error stringifying answer object:',
            jsonError
          );
          formatted = '[Complex Object]';
        }
      } else {
        formatted = String(answer);
      }

      if (formatted.length > this.config.maxAnswerLength) {
        return formatted.substring(0, this.config.maxAnswerLength - 3) + '...';
      }

      return formatted;
    } catch (error) {
      console.error('[ContextGatherer] Error formatting answer:', error);
      return '[Error formatting answer]';
    }
  }

  private isAnswerValid(answer: any): boolean {
    try {
      if (answer === null || answer === undefined) {
        return false;
      }

      if (typeof answer === 'object' && 'value' in answer) {
        return this.isAnswerValid(answer.value);
      }

      if (typeof answer === 'string') {
        return answer.trim().length > 0;
      }

      if (Array.isArray(answer)) {
        return answer.length > 0;
      }

      return true;
    } catch (error) {
      console.error('[ContextGatherer] Error validating answer:', error);
      return false;
    }
  }

  private getAnswerTimestamp(answer: any): number {
    try {
      if (
        typeof answer === 'object' &&
        answer !== null &&
        'timestamp' in answer
      ) {
        const timestamp = answer.timestamp;
        if (typeof timestamp === 'number' && !isNaN(timestamp)) {
          return timestamp;
        }
      }

      return Date.now();
    } catch (error) {
      console.error('[ContextGatherer] Error getting answer timestamp:', error);
      return Date.now();
    }
  }

  public updateConfig(config: Partial<ContextGatheringConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    if (config.tokenLimits) {
      this.tokenEstimator.updateTokenLimits(config.tokenLimits);
    }
  }

  public getConfig(): ContextGatheringConfig {
    return { ...this.config };
  }

  public truncateSiblingContext(
    siblingContext: SiblingContext[],
    maxTokens: number
  ): SiblingContext[] {
    if (!siblingContext || siblingContext.length === 0) {
      return [];
    }

    const truncated: SiblingContext[] = [];
    let currentTokens = 0;

    const sectionOverhead = 50;
    currentTokens += sectionOverhead;

    for (const sibling of siblingContext) {
      const siblingTokens =
        this.tokenEstimator.estimateTokens(sibling.questionText) +
        this.tokenEstimator.estimateTokens(
          typeof sibling.answer === 'string'
            ? sibling.answer
            : JSON.stringify(sibling.answer)
        ) +
        10;

      if (currentTokens + siblingTokens <= maxTokens) {
        truncated.push(sibling);
        currentTokens += siblingTokens;
      } else {
        break;
      }
    }

    return truncated;
  }

  public truncatePreviousEntryContext(
    previousEntryContext: PreviousEntryContext[],
    maxTokens: number
  ): PreviousEntryContext[] {
    if (!previousEntryContext || previousEntryContext.length === 0) {
      return [];
    }

    const truncated: PreviousEntryContext[] = [];
    let currentTokens = 0;

    const sectionOverhead = 50;
    currentTokens += sectionOverhead;

    for (const entry of previousEntryContext) {
      let entryTokens = 15;

      for (const question of entry.questions) {
        const questionTokens = this.tokenEstimator.estimateTokens(
          question.questionText
        );
        const answerTokens = this.tokenEstimator.estimateTokens(
          typeof question.answer === 'string'
            ? question.answer
            : JSON.stringify(question.answer)
        );
        entryTokens += questionTokens + answerTokens + 5;
      }

      if (currentTokens + entryTokens <= maxTokens) {
        truncated.push(entry);
        currentTokens += entryTokens;
      } else {
        const partialEntry = this.truncateEntryQuestions(
          entry,
          maxTokens - currentTokens
        );
        if (partialEntry && partialEntry.questions.length > 0) {
          truncated.push(partialEntry);
        }
        break;
      }
    }

    return truncated;
  }

  private truncateEntryQuestions(
    entry: PreviousEntryContext,
    maxTokens: number
  ): PreviousEntryContext | null {
    const truncatedQuestions = [];
    let currentTokens = 15;

    for (const question of entry.questions) {
      const questionTokens = this.tokenEstimator.estimateTokens(
        question.questionText
      );
      const answerTokens = this.tokenEstimator.estimateTokens(
        typeof question.answer === 'string'
          ? question.answer
          : JSON.stringify(question.answer)
      );
      const totalQuestionTokens = questionTokens + answerTokens + 5;

      if (currentTokens + totalQuestionTokens <= maxTokens) {
        truncatedQuestions.push(question);
        currentTokens += totalQuestionTokens;
      } else {
        break;
      }
    }

    if (truncatedQuestions.length === 0) {
      return null;
    }

    return {
      entryNumber: entry.entryNumber,
      questions: truncatedQuestions,
    };
  }

  public applyTokenLimits(contexts: {
    parentContext?: ParentContext;
    siblingContext?: SiblingContext[];
    previousEntryContext?: PreviousEntryContext[];
  }): {
    parentContext?: ParentContext;
    siblingContext?: SiblingContext[];
    previousEntryContext?: PreviousEntryContext[];
    truncated: boolean;
  } {
    try {
      const limits = this.tokenEstimator.getTokenLimits();
      let truncated = false;

      const parentContext = contexts.parentContext;

      let siblingContext = contexts.siblingContext;
      if (siblingContext && siblingContext.length > 0) {
        try {
          const siblingTokens =
            this.tokenEstimator.estimateSiblingContextTokens(siblingContext);
          if (siblingTokens > limits.siblingContext) {
            siblingContext = this.truncateSiblingContext(
              siblingContext,
              limits.siblingContext
            );
            truncated = true;
          }
        } catch (error) {
          console.error(
            '[ContextGatherer] Error processing sibling context for token limits:',
            error
          );
          siblingContext = [];
          truncated = true;
        }
      }

      let previousEntryContext = contexts.previousEntryContext;
      if (previousEntryContext && previousEntryContext.length > 0) {
        try {
          const previousEntryTokens =
            this.tokenEstimator.estimatePreviousEntryContextTokens(
              previousEntryContext
            );
          if (previousEntryTokens > limits.previousEntryContext) {
            previousEntryContext = this.truncatePreviousEntryContext(
              previousEntryContext,
              limits.previousEntryContext
            );
            truncated = true;
          }
        } catch (error) {
          console.error(
            '[ContextGatherer] Error processing previous entry context for token limits:',
            error
          );
          previousEntryContext = [];
          truncated = true;
        }
      }

      return {
        parentContext,
        siblingContext,
        previousEntryContext,
        truncated,
      };
    } catch (error) {
      console.error('[ContextGatherer] Error applying token limits:', error);
      return {
        parentContext: contexts.parentContext,
        siblingContext: contexts.siblingContext,
        previousEntryContext: contexts.previousEntryContext,
        truncated: false,
      };
    }
  }

  public getTokenEstimator(): TokenEstimator {
    return this.tokenEstimator;
  }

  private resetVisitedQuestions(): void {
    this.visitedQuestions.clear();
  }

  private hasVisitedQuestion(questionId: string): boolean {
    return this.visitedQuestions.has(questionId);
  }

  private markQuestionVisited(questionId: string): void {
    this.visitedQuestions.add(questionId);
  }
}

export const contextGatherer = new ContextGatherer();
