import type {
  ParentContext,
  SiblingContext,
  PreviousEntryContext,
  TokenLimits,
} from '../types/context';
import { DEFAULT_TOKEN_LIMITS } from '../types/context';

const CHARS_PER_TOKEN = 4;

export class TokenEstimator {
  private tokenLimits: TokenLimits;

  constructor(tokenLimits?: Partial<TokenLimits>) {
    this.tokenLimits = {
      ...DEFAULT_TOKEN_LIMITS,
      ...tokenLimits,
    };
  }

  public estimateTokens(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    return Math.ceil(text.length / CHARS_PER_TOKEN);
  }

  public estimateParentContextTokens(parentContext: ParentContext): number {
    const questionTokens = this.estimateTokens(parentContext.questionText);
    const answerText =
      typeof parentContext.answer === 'string'
        ? parentContext.answer
        : JSON.stringify(parentContext.answer);
    const answerTokens = this.estimateTokens(answerText);

    const formattingOverhead = 50;

    return questionTokens + answerTokens + formattingOverhead;
  }

  public estimateSiblingContextTokens(
    siblingContext: SiblingContext[]
  ): number {
    if (!siblingContext || siblingContext.length === 0) {
      return 0;
    }

    let totalTokens = 0;

    for (const sibling of siblingContext) {
      const questionTokens = this.estimateTokens(sibling.questionText);
      const answerText =
        typeof sibling.answer === 'string'
          ? sibling.answer
          : JSON.stringify(sibling.answer);
      const answerTokens = this.estimateTokens(answerText);

      const perSiblingOverhead = 10;

      totalTokens += questionTokens + answerTokens + perSiblingOverhead;
    }

    const sectionOverhead = 50;

    return totalTokens + sectionOverhead;
  }

  public estimatePreviousEntryContextTokens(
    previousEntryContext: PreviousEntryContext[]
  ): number {
    if (!previousEntryContext || previousEntryContext.length === 0) {
      return 0;
    }

    let totalTokens = 0;

    for (const entry of previousEntryContext) {
      const entryOverhead = 15;
      totalTokens += entryOverhead;

      for (const question of entry.questions) {
        const questionTokens = this.estimateTokens(question.questionText);
        const answerText =
          typeof question.answer === 'string'
            ? question.answer
            : JSON.stringify(question.answer);
        const answerTokens = this.estimateTokens(answerText);

        const perQuestionOverhead = 5;

        totalTokens += questionTokens + answerTokens + perQuestionOverhead;
      }
    }

    const sectionOverhead = 50;

    return totalTokens + sectionOverhead;
  }

  public calculateTotalTokens(contexts: {
    parentContext?: ParentContext;
    siblingContext?: SiblingContext[];
    previousEntryContext?: PreviousEntryContext[];
  }): {
    parentTokens: number;
    siblingTokens: number;
    previousEntryTokens: number;
    totalTokens: number;
  } {
    const parentTokens = contexts.parentContext
      ? this.estimateParentContextTokens(contexts.parentContext)
      : 0;

    const siblingTokens = contexts.siblingContext
      ? this.estimateSiblingContextTokens(contexts.siblingContext)
      : 0;

    const previousEntryTokens = contexts.previousEntryContext
      ? this.estimatePreviousEntryContextTokens(contexts.previousEntryContext)
      : 0;

    return {
      parentTokens,
      siblingTokens,
      previousEntryTokens,
      totalTokens: parentTokens + siblingTokens + previousEntryTokens,
    };
  }

  public checkLimits(contexts: {
    parentContext?: ParentContext;
    siblingContext?: SiblingContext[];
    previousEntryContext?: PreviousEntryContext[];
  }): {
    parentExceeded: boolean;
    siblingExceeded: boolean;
    previousEntryExceeded: boolean;
    anyExceeded: boolean;
  } {
    const tokens = this.calculateTotalTokens(contexts);

    const parentExceeded = tokens.parentTokens > this.tokenLimits.parentContext;
    const siblingExceeded =
      tokens.siblingTokens > this.tokenLimits.siblingContext;
    const previousEntryExceeded =
      tokens.previousEntryTokens > this.tokenLimits.previousEntryContext;

    return {
      parentExceeded,
      siblingExceeded,
      previousEntryExceeded,
      anyExceeded: parentExceeded || siblingExceeded || previousEntryExceeded,
    };
  }

  public getTokenLimits(): TokenLimits {
    return { ...this.tokenLimits };
  }

  public updateTokenLimits(limits: Partial<TokenLimits>): void {
    this.tokenLimits = {
      ...this.tokenLimits,
      ...limits,
    };
  }
}

export const tokenEstimator = new TokenEstimator();
