export interface ParentContext {
  questionText: string;
  answer: string | object;
  questionId: string;
  questionType?: string;
}

export interface SiblingContext {
  questionText: string;
  answer: string | object;
  questionId: string;
  answeredAt: number;
}

export interface PreviousEntryContext {
  entryNumber: number;
  questions: Array<{
    questionText: string;
    answer: string | object;
    questionId: string;
  }>;
}

export interface ContextGatheringConfig {
  includeParent: boolean;
  includeSiblings: boolean;
  maxSiblings: number;
  includePreviousEntries: boolean;
  maxPreviousEntries: number;
  maxAnswerLength: number;
  tokenLimits?: Partial<TokenLimits>;
}

export interface TokenLimits {
  parentContext: number;
  siblingContext: number;
  previousEntryContext: number;
  perSibling: number;
  perPreviousEntry: number;
}

export const DEFAULT_TOKEN_LIMITS: TokenLimits = {
  parentContext: 200,
  siblingContext: 500,
  previousEntryContext: 900,
  perSibling: 100,
  perPreviousEntry: 300,
};

export const DEFAULT_CONTEXT_CONFIG: ContextGatheringConfig = {
  includeParent: true,
  includeSiblings: true,
  maxSiblings: 5,
  includePreviousEntries: true,
  maxPreviousEntries: 3,
  maxAnswerLength: 200,
};
