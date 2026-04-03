/**
 * Prompt Assembler - Uses EXACT frontend prompt generation logic
 *
 * This module assembles prompts exactly the same way as the frontend
 * backendAIService.generateSuggestions method to ensure 100% identical prompts.
 */

import type { ProcessedQuestionInfo } from './question-info-processor';
import type { FormattedPDFMetadata } from './pdf-metadata-formatter';

export interface AssembledPrompt {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  metadata: {
    promptLength: number;
    systemPromptLength: number;
    userPromptLength: number;
    hasMetadata: boolean;
    hasOptions: boolean;
    questionType: string;
    assembledAt: number;
  };
}

export class FrontendPromptAssembler {
  private readonly SYSTEM_PROMPT = `You are an AI assistant helping researchers extract information from academic papers.
Your task is to analyze the provided PDF content and suggest answers to specific questions.

The PDF content is organized by chunks and pages (e.g., [PAGE 1], [PAGE 3], [PAGE 4]).
Use these markers to identify the exact source of your evidence.

For each suggestion:
1. Provide a clear, concise answer
2. Include supporting evidence with exact page numbers and text excerpts
3. Rank suggestions by relevance and confidence
4. If the question includes "Available Options", your suggestions MUST use ONLY those exact choices

CRITICAL INSTRUCTIONS FOR EVIDENCE EXCERPTS:
- Extract EXACT text from the PDF - copy it word-for-word as it appears
- Use the exact page numbers from the chunks headers (e.g., [PAGE 3] means content is from page 3)
- Keep excerpts between 10-50 words for best highlighting results
- If the text has references like [1] or [Smith 2020], include them as they appear
- The excerpt will be used to highlight text in the PDF, so accuracy is critical


Generate exactly 3 suggestions in the following JSON format:
{
  "suggestions": [
    {
      "rank": 1,
      "text": "suggested answer",
      "confidence": 0.95,
      "evidence": [
        {
          "pageNumber": 3,
          "excerpt": "exact text copied from page 3 without modifications"
        }
      ]
    }
  ]
}`;

  assemblePrompt(
    questionInfo: ProcessedQuestionInfo,
    pdfMetadata: FormattedPDFMetadata,
    pdfContent: string
  ): AssembledPrompt {
    if (!questionInfo.questionText || !questionInfo.questionText.trim()) {
      throw new Error('Question text is required');
    }

    if (!pdfContent || !pdfContent.trim()) {
      throw new Error('PDF content is required');
    }

    const systemPrompt = this.SYSTEM_PROMPT;

    const userPrompt = this.buildUserPrompt(
      questionInfo,
      pdfMetadata,
      pdfContent
    );

    const temperature = 0.3;
    const maxTokens = 2000;

    const promptLength = systemPrompt.length + userPrompt.length;

    return {
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens,
      metadata: {
        promptLength,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        hasMetadata: pdfMetadata.metadataText.length > 0,
        hasOptions: questionInfo.hasOptions,
        questionType: questionInfo.questionType,
        assembledAt: Date.now(),
      },
    };
  }

  private buildUserPrompt(
    questionInfo: ProcessedQuestionInfo,
    pdfMetadata: FormattedPDFMetadata,
    pdfContent: string
  ): string {
    const metadataSection = pdfMetadata.metadataText;

    let questionSection = `Question: ${questionInfo.questionText}\n`;
    questionSection += `Question Type: ${questionInfo.questionType}`;

    if (questionInfo.hasOptions && questionInfo.questionOptions) {
      questionSection += `\nAvailable Options: ${questionInfo.questionOptions.join(', ')}`;
    }

    const contentSection = `PDF Content:\n${pdfContent}`;

    const instructionsSection = `Generate exactly 3 suggestions with supporting evidence from the PDF content above.

REMEMBER: For evidence excerpts, copy the EXACT text from the PDF. The excerpts will be used to highlight text in the PDF viewer, so they must match exactly.`;

    const userPrompt = `${metadataSection}

${questionSection}

${contentSection}

${instructionsSection}`;

    return userPrompt;
  }

  /**
   * Assemble prompt without feedback/context (for evaluation)
   * This is the simplified version for testing without user feedback
   */
  assembleEvaluationPrompt(
    questionInfo: ProcessedQuestionInfo,
    pdfMetadata: FormattedPDFMetadata,
    pdfContent: string,
    siblingContextSection?: string
  ): AssembledPrompt {
    if (siblingContextSection) {
      return this.assemblePromptWithContext(
        questionInfo,
        pdfMetadata,
        pdfContent,
        siblingContextSection
      );
    }
    return this.assemblePrompt(questionInfo, pdfMetadata, pdfContent);
  }

  /**
   * Assemble prompt with sibling context injected into user prompt
   */
  private assemblePromptWithContext(
    questionInfo: ProcessedQuestionInfo,
    pdfMetadata: FormattedPDFMetadata,
    pdfContent: string,
    siblingContextSection: string
  ): AssembledPrompt {
    const systemPrompt = this.SYSTEM_PROMPT;
    const metadataSection = pdfMetadata.metadataText;

    let questionSection = `Question: ${questionInfo.questionText}\n`;
    questionSection += `Question Type: ${questionInfo.questionType}`;
    if (questionInfo.hasOptions && questionInfo.questionOptions) {
      questionSection += `\nAvailable Options: ${questionInfo.questionOptions.join(', ')}`;
    }

    const contentSection = `PDF Content:\n${pdfContent}`;
    const instructionsSection = `Generate exactly 3 suggestions with supporting evidence from the PDF content above.

REMEMBER: For evidence excerpts, copy the EXACT text from the PDF. The excerpts will be used to highlight text in the PDF viewer, so they must match exactly.`;

    const userPrompt = `${metadataSection}
${siblingContextSection}
${questionSection}

NOTE: The above is the SPECIFIC question you need to generate suggestions for. The sibling context section above is provided only as background — do NOT answer those questions. Focus your suggestions ONLY on the question above.

${contentSection}

${instructionsSection}`;

    const promptLength = systemPrompt.length + userPrompt.length;

    return {
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 2000,
      metadata: {
        promptLength,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        hasMetadata: pdfMetadata.metadataText.length > 0,
        hasOptions: questionInfo.hasOptions,
        questionType: questionInfo.questionType,
        assembledAt: Date.now(),
      },
    };
  }
}
