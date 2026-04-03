/**
 * Simple Metrics Calculator - Clean and intuitive evaluation metrics
 */

import { getBERTScoreCalculator, BERTScoreResult } from './bertscore-wrapper';

export interface Suggestion {
  position: number;
  text: string | string[];
  confidence: number;
  evidence: Array<{
    pageNumber: number;
    excerpt: string;
  }>;
}

export interface SuggestionMetrics {
  position: number;
  text: string;
  isCorrect: boolean;
  bertScore?: number;
  accuracy?: boolean;
  f1Score?: number;
}

export interface QuestionResult {
  questionId: string;
  questionType: string;
  groundTruth: string;

  suggestion1Correct: boolean;
  suggestion2Correct: boolean;
  suggestion3Correct: boolean;
  anyCorrect: boolean;

  suggestions: SuggestionMetrics[];
}

export interface SuggestionPerformance {
  position: number; // 1, 2, or 3
  totalQuestions: number;

  textQuestions: {
    count: number;
    avgBertScore: number;
  };

  selectQuestions: {
    count: number;
    accuracy: number;
  };

  multiSelectQuestions: {
    count: number;
    avgF1Score: number;
  };
}

export interface EvaluationSummary {
  totalQuestions: number;

  suggestion1: SuggestionPerformance;
  suggestion2: SuggestionPerformance;
  suggestion3: SuggestionPerformance;

  anyCorrect: {
    count: number;
    percentage: number;
  };

  allCorrect: {
    count: number;
    percentage: number;
  };
}

export class SimpleMetricsCalculator {
  private useBERTScore: boolean;
  private bertScoreCalculator: ReturnType<
    typeof getBERTScoreCalculator
  > | null = null;

  constructor(options: { useBERTScore?: boolean } = {}) {
    this.useBERTScore = options.useBERTScore ?? false;

    if (this.useBERTScore) {
      this.bertScoreCalculator = getBERTScoreCalculator();
    }
  }

  async calculateQuestionMetrics(
    suggestions: Suggestion[],
    groundTruth: any,
    questionType: string,
    questionId: string
  ): Promise<QuestionResult> {
    if (Array.isArray(groundTruth)) {
      return this.calculateArrayGroundTruthMetrics(
        suggestions,
        groundTruth,
        questionType,
        questionId
      );
    }

    const normalizedGroundTruth = this.normalizeAnswer(String(groundTruth));

    const suggestionMetrics: SuggestionMetrics[] = [];

    for (let index = 0; index < suggestions.length; index++) {
      const suggestion = suggestions[index];
      const position = index + 1;
      const suggestionTextStr = this.textToString(suggestion.text);
      const normalizedPrediction = this.normalizeAnswer(suggestionTextStr);

      let isCorrect = false;
      let bertScore: number | undefined;
      let accuracy: boolean | undefined;
      let f1Score: number | undefined;

      switch (questionType.toLowerCase()) {
        case 'text':
          if (this.useBERTScore && this.bertScoreCalculator) {
            try {
              const result = await this.bertScoreCalculator.calculateSingle(
                normalizedPrediction,
                normalizedGroundTruth
              );
              bertScore = result.f1;
              console.log(
                `BERTScore calculated for ${questionId}: F1=${bertScore.toFixed(4)}`
              );
            } catch (error) {
              console.error(`BERTScore failed for ${questionId}:`, error);
              console.error(
                `Error type: ${error instanceof Error ? error.constructor.name : typeof error}`
              );
              console.error(
                `Error message: ${error instanceof Error ? error.message : String(error)}`
              );
              console.error(`Falling back to token-based F1`);
              const fallbackResult = this.calculateTokenBasedF1(
                normalizedPrediction,
                normalizedGroundTruth
              );
              bertScore = fallbackResult.f1;
            }
          } else {
            console.warn(
              `BERTScore not enabled, using token-based F1 for ${questionId}`
            );
            const fallbackResult = this.calculateTokenBasedF1(
              normalizedPrediction,
              normalizedGroundTruth
            );
            bertScore = fallbackResult.f1;
          }
          isCorrect = bertScore > 0.5;
          break;

        case 'select':
        case 'single_select':
        case 'text_object':
        case 'url':
          const exactMatch = normalizedPrediction === normalizedGroundTruth;
          const partialMatch =
            !exactMatch &&
            this.isPartialMatch(normalizedPrediction, normalizedGroundTruth);
          accuracy = exactMatch;
          isCorrect = exactMatch || partialMatch;
          break;

        case 'boolean':
          const boolPred = this.normalizeBooleanAnswer(normalizedPrediction);
          const boolGT = this.normalizeBooleanAnswer(normalizedGroundTruth);
          const boolMatch = boolPred === boolGT;
          accuracy = boolMatch;
          isCorrect = boolMatch;
          break;

        case 'multi_select':
        case 'repeat_text':
          const f1ScoreResult = this.calculateMultiSelectF1Enhanced(
            normalizedPrediction,
            this.parseMultiSelectItems(normalizedGroundTruth)
          );
          f1Score = f1ScoreResult;
          isCorrect = f1Score > 0.5;
          break;

        default:
          console.warn(
            `Unknown question type: ${questionType} for question ${questionId}`
          );
          isCorrect = false;
          break;
      }

      suggestionMetrics.push({
        position,
        text: suggestionTextStr,
        isCorrect,
        bertScore,
        accuracy,
        f1Score,
      });
    }

    return {
      questionId,
      questionType,
      groundTruth: String(groundTruth),
      suggestion1Correct: suggestionMetrics[0]?.isCorrect || false,
      suggestion2Correct: suggestionMetrics[1]?.isCorrect || false,
      suggestion3Correct: suggestionMetrics[2]?.isCorrect || false,
      anyCorrect: suggestionMetrics.some((s) => s.isCorrect),
      suggestions: suggestionMetrics,
    };
  }

  private async calculateArrayGroundTruthMetrics(
    suggestions: Suggestion[],
    groundTruthArray: any[],
    questionType: string,
    questionId: string
  ): Promise<QuestionResult> {
    const isMultiSelect = questionType.toLowerCase() === 'multi_select';
    const isRepeatText = questionType.toLowerCase() === 'repeat_text';

    if (isRepeatText) {
      return this.calculateRepeatTextBestMatch(
        suggestions,
        groundTruthArray,
        questionId
      );
    }

    const groundTruthForComparison = isMultiSelect
      ? groundTruthArray.join(', ')
      : groundTruthArray.length > 0
        ? String(groundTruthArray[0])
        : '';

    const normalizedGroundTruth = this.normalizeAnswer(
      groundTruthForComparison
    );

    const suggestionMetrics: SuggestionMetrics[] = [];

    for (let index = 0; index < suggestions.length; index++) {
      const suggestion = suggestions[index];
      const position = index + 1;
      const suggestionTextStr = this.textToString(suggestion.text);
      const normalizedPrediction = this.normalizeAnswer(suggestionTextStr);

      let isCorrect = false;
      let bertScore: number | undefined;
      let accuracy: boolean | undefined;
      let f1Score: number | undefined;

      switch (questionType.toLowerCase()) {
        case 'text':
          if (this.useBERTScore && this.bertScoreCalculator) {
            try {
              const result = await this.bertScoreCalculator.calculateSingle(
                normalizedPrediction,
                normalizedGroundTruth
              );
              bertScore = result.f1;
              console.log(
                `✓ BERTScore calculated for ${questionId} (array GT): F1=${bertScore.toFixed(4)}`
              );
            } catch (error) {
              console.error(
                `✗ BERTScore failed for ${questionId} (array GT):`,
                error
              );
              const fallbackResult = this.calculateTokenBasedF1(
                normalizedPrediction,
                normalizedGroundTruth
              );
              bertScore = fallbackResult.f1;
            }
          } else {
            const tokenResult = this.calculateTokenBasedF1(
              normalizedPrediction,
              normalizedGroundTruth
            );
            bertScore = tokenResult.f1;
          }
          isCorrect = bertScore > 0.5;
          break;

        case 'select':
        case 'single_select':
        case 'text_object':
        case 'url':
          const exactMatch = normalizedPrediction === normalizedGroundTruth;
          const partialMatch =
            !exactMatch &&
            this.isPartialMatch(normalizedPrediction, normalizedGroundTruth);
          accuracy = exactMatch;
          isCorrect = exactMatch || partialMatch;
          break;

        case 'boolean':
          const boolPred = this.normalizeBooleanAnswer(normalizedPrediction);
          const boolGT = this.normalizeBooleanAnswer(normalizedGroundTruth);
          const boolMatch = boolPred === boolGT;
          accuracy = boolMatch;
          isCorrect = boolMatch;
          break;

        case 'multi_select':
          const f1ScoreResult = this.calculateMultiSelectF1Enhanced(
            normalizedPrediction,
            groundTruthArray.map(String)
          );
          f1Score = f1ScoreResult;
          isCorrect = f1Score > 0.3;
          break;

        default:
          console.warn(
            `Unknown question type: ${questionType} for question ${questionId}`
          );
          isCorrect = false;
          break;
      }

      suggestionMetrics.push({
        position,
        text: suggestionTextStr,
        isCorrect,
        bertScore,
        accuracy,
        f1Score,
      });
    }

    return {
      questionId,
      questionType,
      groundTruth: isMultiSelect
        ? groundTruthArray.join(', ')
        : String(groundTruthArray[0] || ''),
      suggestion1Correct: suggestionMetrics[0]?.isCorrect || false,
      suggestion2Correct: suggestionMetrics[1]?.isCorrect || false,
      suggestion3Correct: suggestionMetrics[2]?.isCorrect || false,
      anyCorrect: suggestionMetrics.some((s) => s.isCorrect),
      suggestions: suggestionMetrics,
    };
  }

  private async calculateRepeatTextBestMatch(
    suggestions: Suggestion[],
    groundTruthArray: any[],
    questionId: string
  ): Promise<QuestionResult> {
    const gtStrings = groundTruthArray
      .map((g) => String(g))
      .filter((g) => g.trim());
    const suggestionMetrics: SuggestionMetrics[] = [];

    for (let index = 0; index < suggestions.length; index++) {
      const suggestion = suggestions[index];
      const position = index + 1;
      const suggestionTextStr = this.textToString(suggestion.text);
      const normalizedPrediction = this.normalizeAnswer(suggestionTextStr);

      let bestBertScore = 0;

      for (const gt of gtStrings) {
        const normalizedGT = this.normalizeAnswer(gt);
        let score: number;

        if (this.useBERTScore && this.bertScoreCalculator) {
          try {
            const result = await this.bertScoreCalculator.calculateSingle(
              normalizedPrediction,
              normalizedGT
            );
            score = result.f1;
          } catch {
            score = this.calculateTokenBasedF1(
              normalizedPrediction,
              normalizedGT
            ).f1;
          }
        } else {
          score = this.calculateTokenBasedF1(
            normalizedPrediction,
            normalizedGT
          ).f1;
        }

        if (score > bestBertScore) {
          bestBertScore = score;
        }
      }

      console.log(
        `BERTScore best-match for ${questionId} S${position}: ${bestBertScore.toFixed(4)} (across ${gtStrings.length} GT entries)`
      );

      suggestionMetrics.push({
        position,
        text: suggestionTextStr,
        isCorrect: bestBertScore > 0.5,
        bertScore: bestBertScore,
      });
    }

    return {
      questionId,
      questionType: 'repeat_text',
      groundTruth: gtStrings.join(' | '),
      suggestion1Correct: suggestionMetrics[0]?.isCorrect || false,
      suggestion2Correct: suggestionMetrics[1]?.isCorrect || false,
      suggestion3Correct: suggestionMetrics[2]?.isCorrect || false,
      anyCorrect: suggestionMetrics.some((s) => s.isCorrect),
      suggestions: suggestionMetrics,
    };
  }

  calculateSummaryMetrics(
    questionResults: QuestionResult[]
  ): EvaluationSummary {
    const totalQuestions = questionResults.length;

    const anyCorrect = questionResults.filter((q) => q.anyCorrect).length;
    const allCorrect = questionResults.filter(
      (q) =>
        q.suggestion1Correct && q.suggestion2Correct && q.suggestion3Correct
    ).length;

    const suggestion1 = this.calculateSuggestionPerformance(questionResults, 1);
    const suggestion2 = this.calculateSuggestionPerformance(questionResults, 2);
    const suggestion3 = this.calculateSuggestionPerformance(questionResults, 3);

    return {
      totalQuestions,
      suggestion1,
      suggestion2,
      suggestion3,

      anyCorrect: {
        count: anyCorrect,
        percentage:
          totalQuestions > 0 ? (anyCorrect / totalQuestions) * 100 : 0,
      },

      allCorrect: {
        count: allCorrect,
        percentage:
          totalQuestions > 0 ? (allCorrect / totalQuestions) * 100 : 0,
      },
    };
  }

  private calculateSuggestionPerformance(
    questionResults: QuestionResult[],
    position: number
  ): SuggestionPerformance {
    const totalQuestions = questionResults.length;

    const suggestionsAtPosition = questionResults
      .map((q) => q.suggestions.find((s) => s.position === position))
      .filter((s) => s !== undefined) as SuggestionMetrics[];

    const textSuggestions = suggestionsAtPosition.filter(
      (s) => s.bertScore !== undefined
    );
    const textCount = questionResults.filter(
      (q) => q.questionType === 'text'
    ).length;
    const avgBertScore =
      textSuggestions.length > 0
        ? this.average(textSuggestions.map((s) => s.bertScore!))
        : 0;

    const selectSuggestions = suggestionsAtPosition.filter(
      (s) => s.accuracy !== undefined
    );
    const selectCount = questionResults.filter((q) =>
      ['select', 'single_select', 'boolean', 'text_object', 'url'].includes(
        q.questionType
      )
    ).length;
    const selectAccuracy =
      selectSuggestions.length > 0
        ? selectSuggestions.filter((s) => s.accuracy === true).length /
          selectSuggestions.length
        : 0;

    const multiSelectSuggestions = suggestionsAtPosition.filter(
      (s) => s.f1Score !== undefined
    );
    const multiSelectCount = questionResults.filter((q) =>
      ['multi_select', 'repeat_text'].includes(q.questionType)
    ).length;
    const avgF1Score =
      multiSelectSuggestions.length > 0
        ? this.average(multiSelectSuggestions.map((s) => s.f1Score!))
        : 0;

    return {
      position,
      totalQuestions,
      textQuestions: {
        count: textCount,
        avgBertScore,
      },
      selectQuestions: {
        count: selectCount,
        accuracy: selectAccuracy,
      },
      multiSelectQuestions: {
        count: multiSelectCount,
        avgF1Score,
      },
    };
  }

  private normalizeBooleanAnswer(answer: string): string {
    const normalized = answer.toLowerCase().trim();

    if (
      normalized === 'yes' ||
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'y'
    ) {
      return 'true';
    }
    if (
      normalized === 'no' ||
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'n'
    ) {
      return 'false';
    }
    if (/^(yes|true)\b/.test(normalized)) {
      return 'true';
    }
    if (/^(no|false)\b/.test(normalized)) {
      return 'false';
    }

    return normalized;
  }

  private calculateTokenBasedF1(
    prediction: string,
    groundTruth: string
  ): { f1: number } {
    const predTokens = this.tokenize(prediction);
    const truthTokens = this.tokenize(groundTruth);

    if (predTokens.length === 0 && truthTokens.length === 0) return { f1: 1.0 };
    if (predTokens.length === 0 || truthTokens.length === 0) return { f1: 0.0 };

    const intersection = predTokens.filter((token) =>
      truthTokens.includes(token)
    );
    const precision = intersection.length / predTokens.length;
    const recall = intersection.length / truthTokens.length;
    const f1 =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;

    return { f1 };
  }

  private calculateMultiSelectF1(
    prediction: string,
    groundTruth: string
  ): number {
    const predItems = this.parseMultiSelectItems(prediction);
    const truthItems = this.parseMultiSelectItems(groundTruth);

    if (predItems.length === 0 && truthItems.length === 0) return 1.0;
    if (predItems.length === 0 || truthItems.length === 0) return 0.0;

    const exactIntersection = predItems.filter((item) =>
      truthItems.includes(item)
    );
    const exactPrecision = exactIntersection.length / predItems.length;
    const exactRecall = exactIntersection.length / truthItems.length;
    const exactF1 =
      exactPrecision + exactRecall > 0
        ? (2 * exactPrecision * exactRecall) / (exactPrecision + exactRecall)
        : 0;

    const stemmedPred = predItems.map((i) => this.simpleStem(i));
    const stemmedTruth = truthItems.map((i) => this.simpleStem(i));
    const stemmedIntersection = stemmedPred.filter((item) =>
      stemmedTruth.includes(item)
    );
    const stemmedPrecision = stemmedIntersection.length / stemmedPred.length;
    const stemmedRecall = stemmedIntersection.length / stemmedTruth.length;
    const stemmedF1 =
      stemmedPrecision + stemmedRecall > 0
        ? (2 * stemmedPrecision * stemmedRecall) /
          (stemmedPrecision + stemmedRecall)
        : 0;

    return Math.max(exactF1, stemmedF1);
  }

  private isPartialMatch(prediction: string, groundTruth: string): boolean {
    return prediction.includes(groundTruth) || groundTruth.includes(prediction);
  }

  private parseMultiSelectItems(text: string): string[] {
    const items = text
      .split(/[,;]/)
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);
    return items;
  }

  private simpleStem(word: string): string {
    let w = word.toLowerCase().trim();
    if (w.endsWith('nesses')) return w.slice(0, -6);
    if (w.endsWith('ments')) return w.slice(0, -5);
    if (w.endsWith('ages') && w.length > 5) {
      const candidate = w.slice(0, -4);
      if (candidate.length >= 3) return candidate;
    }
    if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
    if (w.endsWith('es') && w.length > 3) {
      const noEs = w.slice(0, -2);
      if (
        noEs.endsWith('ss') ||
        noEs.endsWith('x') ||
        noEs.endsWith('sh') ||
        noEs.endsWith('ch')
      ) {
        return noEs;
      }
      return w.slice(0, -1);
    }
    if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3)
      return w.slice(0, -1);
    return w;
  }

  private getMatchVariants(term: string): string[] {
    const t = term.toLowerCase().trim();
    const variants = new Set<string>();
    variants.add(t);
    variants.add(this.simpleStem(t));

    for (let i = 2; i < t.length - 1; i++) {
      const left = t.slice(0, i);
      const right = t.slice(i);
      if (left.length >= 2 && right.length >= 2) {
        variants.add(`${left} ${right}`);
        variants.add(`${left}-${right}`);
      }
    }

    if (t.includes(' ')) {
      variants.add(t.replace(/\s+/g, ''));
      variants.add(t.replace(/\s+/g, '-'));
    }
    if (t.includes('-')) {
      variants.add(t.replace(/-/g, ''));
      variants.add(t.replace(/-/g, ' '));
    }

    return Array.from(variants);
  }

  private itemFoundInText(item: string, text: string): boolean {
    const variants = this.getMatchVariants(item);
    const textLower = text.toLowerCase();

    for (const variant of variants) {
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (variant.includes(' ') || variant.includes('-')) {
        if (textLower.includes(variant)) return true;
      }
      const regex = new RegExp(`\\b${escaped}\\b`);
      if (regex.test(textLower)) return true;
    }

    const stemmedItem = this.simpleStem(item);
    const textWords = textLower.split(/[^a-z0-9]+/).filter((w) => w.length > 0);
    for (const word of textWords) {
      if (this.simpleStem(word) === stemmedItem) return true;
    }

    return false;
  }

  private calculateMultiSelectF1Enhanced(
    prediction: string,
    groundTruthItems: string[]
  ): number {
    const standardF1 = this.calculateMultiSelectF1(
      prediction,
      groundTruthItems.join(', ')
    );

    const predItems = this.parseMultiSelectItems(prediction).map((i) =>
      this.simpleStem(i)
    );
    const truthItems = groundTruthItems.map((i) =>
      this.simpleStem(i.toLowerCase().trim())
    );
    let stemmedF1 = 0;
    if (predItems.length > 0 && truthItems.length > 0) {
      const intersection = predItems.filter((item) =>
        truthItems.includes(item)
      );
      const precision = intersection.length / predItems.length;
      const recall = intersection.length / truthItems.length;
      stemmedF1 =
        precision + recall > 0
          ? (2 * precision * recall) / (precision + recall)
          : 0;
    }

    const foundItems = groundTruthItems.filter((item) =>
      this.itemFoundInText(item, prediction)
    );
    let extractedF1 = 0;
    if (foundItems.length > 0) {
      const precision = 1.0;
      const recall = foundItems.length / groundTruthItems.length;
      extractedF1 =
        precision + recall > 0
          ? (2 * precision * recall) / (precision + recall)
          : 0;
    }

    return Math.max(standardF1, stemmedF1, extractedF1);
  }

  private textToString(text: string | string[]): string {
    if (typeof text === 'string') {
      return text;
    }
    if (Array.isArray(text)) {
      return text.map((item) => String(item)).join(', ');
    }
    return String(text || '');
  }

  private normalizeAnswer(answer: string): string {
    return answer
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s,;]/g, '');
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
}
