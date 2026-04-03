/**
 * Evaluation Runner - Complete evaluation using EXACT frontend functions
 */

import * as fs from 'fs';
import * as path from 'path';

import { FrontendPDFExtractor } from './pdf-content-extractor';
import { FrontendQuestionProcessor } from './question-info-processor';
import { FrontendPDFMetadataFormatter } from './pdf-metadata-formatter';
import { FrontendPromptAssembler } from './prompt-assembler';
import { FrontendBackendCaller } from './backend-service-caller';
import { FrontendTemplateLoader } from './template-loader';
import { GroundTruthMapper } from './ground-truth-mapper';
import { SiblingContextProvider } from './sibling-context-provider';
import {
  SimpleMetricsCalculator,
  type QuestionResult,
  type EvaluationSummary as SimpleEvaluationSummary,
  type Suggestion,
} from './simple-metrics-calculator';

import type { ProcessedQuestionInfo } from './question-info-processor';

export interface EvaluationQuestion {
  id: string;
  text: string;
  type: string;
  options?: string[];
  groundTruth: any;
}

export interface EvaluationResult {
  questionId: string;
  questionText: string;
  questionType: string;
  prediction: string;
  suggestions: Suggestion[]; // All 3 suggestions
  groundTruth: any;
  success: boolean;
  confidence: number;
  evidence: Array<{
    pageNumber: number;
    excerpt: string;
  }>;
  processingTime: number;
  error?: string;
  metadata: {
    promptLength: number;
    pdfContentLength: number;
    backendDuration: number;
  };
  llmInteraction: {
    systemPrompt: string;
    userPrompt: string;
    fullPrompt: string;
    rawResponse: string;
    parsedResponse: any;
    requestTimestamp: number;
    responseTimestamp: number;
    promptTokens?: number;
    responseTokens?: number;
    totalTokens?: number;
  };
  metrics?: QuestionResult;
}

export interface PaperEvaluationResult {
  paperId: string;
  title: string;
  pdfPath: string;
  questions: EvaluationResult[];
  pdfMetadata: {
    filename: string;
    totalPages: number;
    totalWords: number;
  };
  processingTime: number;
  error?: string;
}

export interface EvaluationSummary {
  totalPapers: number;
  successfulPapers: number;
  failedPapers: number;
  totalQuestions: number;
  successfulQuestions: number;
  failedQuestions: number;
  averageProcessingTime: number;
  simpleMetrics: SimpleEvaluationSummary;
}

export class FrontendExactEvaluationRunner {
  private pdfExtractor: FrontendPDFExtractor;
  private questionProcessor: FrontendQuestionProcessor;
  private metadataFormatter: FrontendPDFMetadataFormatter;
  private promptAssembler: FrontendPromptAssembler;
  private backendCaller: FrontendBackendCaller;
  private templateLoader: FrontendTemplateLoader;
  private groundTruthMapper: GroundTruthMapper;
  private siblingContextProvider: SiblingContextProvider;
  private metricsCalculator: SimpleMetricsCalculator;

  constructor(
    backendUrl: string = 'http://localhost:5001',
    options: { useBERTScore?: boolean } = {}
  ) {
    this.pdfExtractor = new FrontendPDFExtractor(backendUrl);
    this.questionProcessor = new FrontendQuestionProcessor();
    this.metadataFormatter = new FrontendPDFMetadataFormatter();
    this.promptAssembler = new FrontendPromptAssembler();
    this.backendCaller = new FrontendBackendCaller(backendUrl);
    this.templateLoader = new FrontendTemplateLoader();
    this.groundTruthMapper = new GroundTruthMapper();
    this.siblingContextProvider = new SiblingContextProvider();
    this.metricsCalculator = new SimpleMetricsCalculator(options);
  }

  async evaluatePaper(
    paperId: string,
    title: string,
    pdfPath: string,
    questions: EvaluationQuestion[],
    withContext: boolean = false,
    allQuestionsForContext?: EvaluationQuestion[]
  ): Promise<PaperEvaluationResult> {
    const startTime = Date.now();

    console.log(`\n=== Evaluating Paper: ${paperId} ===`);
    console.log(`Title: ${title}`);
    console.log(`PDF: ${pdfPath}`);
    console.log(`Questions: ${questions.length}`);

    try {
      console.log('Step 1: Extracting structured document...');
      const baseResult = await this.pdfExtractor.extractPDFContent(pdfPath);

      if (!baseResult.success) {
        throw new Error(`PDF extraction failed: ${baseResult.error}`);
      }

      console.log(
        `Structured document extracted: ${baseResult.metadata.totalPages} pages, ${baseResult.metadata.totalWords} words`
      );

      console.log('Step 2: Formatting PDF metadata...');
      const formattedMetadata = this.metadataFormatter.formatPDFMetadata(
        baseResult.structuredDocument,
        path.basename(pdfPath)
      );

      console.log(`Metadata formatted`);

      console.log('Step 3: Processing questions...');
      const evaluationResults: EvaluationResult[] = [];

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionStartTime = Date.now();

        console.log(
          `  [${i + 1}/${questions.length}] Processing: ${question.id} (${question.type})`
        );

        try {
          const questionPdfResult =
            await this.pdfExtractor.getChunkedContentForQuestion(
              baseResult.structuredDocument!,
              question.text,
              4000
            );

          if (!questionPdfResult.success) {
            throw new Error(
              `Question-specific PDF extraction failed: ${questionPdfResult.error}`
            );
          }

          console.log(
            `Question-specific content: ${questionPdfResult.pdfContent.length} chars`
          );

          const questionInfo: ProcessedQuestionInfo =
            this.questionProcessor.processQuestionInfo({
              id: question.id,
              text: question.text,
              type: question.type,
              options: question.options,
            });

          const assembledPrompt = this.promptAssembler.assembleEvaluationPrompt(
            questionInfo,
            formattedMetadata,
            questionPdfResult.pdfContent,
            withContext
              ? this.siblingContextProvider.buildSiblingContextSection(
                  question.id,
                  allQuestionsForContext || questions
                )
              : undefined
          );

          console.log(
            ` Prompt assembled: ${assembledPrompt.metadata.promptLength} chars`
          );

          const backendResult = await this.backendCaller.callBackendService(
            assembledPrompt,
            question.id,
            questionPdfResult.pdfContent,
            question.options
          );

          if (!backendResult.success) {
            throw new Error(`Backend call failed: ${backendResult.error}`);
          }

          const suggestions: Suggestion[] = backendResult.suggestions
            .slice(0, 3)
            .map((s, index) => ({
              position: index + 1,
              text: s.text,
              confidence: s.confidence,
              evidence: s.evidence,
            }));

          const predictionText =
            suggestions.length > 0 ? suggestions[0].text : '';
          const prediction =
            typeof predictionText === 'string'
              ? predictionText
              : Array.isArray(predictionText)
                ? predictionText.join(', ')
                : String(predictionText);
          const confidence =
            suggestions.length > 0 ? suggestions[0].confidence : 0;
          const evidence =
            suggestions.length > 0 ? suggestions[0].evidence : [];

          const metrics = await this.metricsCalculator.calculateQuestionMetrics(
            suggestions,
            question.groundTruth,
            question.type,
            question.id
          );

          const processingTime = Date.now() - questionStartTime;

          evaluationResults.push({
            questionId: question.id,
            questionText: question.text,
            questionType: question.type,
            prediction,
            suggestions,
            groundTruth: question.groundTruth,
            success: true,
            confidence,
            evidence,
            processingTime,
            metadata: {
              promptLength: assembledPrompt.metadata.promptLength,
              pdfContentLength: questionPdfResult.pdfContent.length,
              backendDuration: backendResult.metadata.duration,
            },
            llmInteraction: backendResult.llmInteraction,
            metrics,
          });

          console.log(`Completed in ${processingTime}ms`);
          console.log(`Prediction: ${prediction.substring(0, 100)}...`);
        } catch (error) {
          const processingTime = Date.now() - questionStartTime;
          console.log(
            `    ✗ Failed: ${error instanceof Error ? error.message : String(error)}`
          );

          evaluationResults.push({
            questionId: question.id,
            questionText: question.text,
            questionType: question.type,
            prediction: '',
            suggestions: [],
            groundTruth: question.groundTruth,
            success: false,
            confidence: 0,
            evidence: [],
            processingTime,
            error: error instanceof Error ? error.message : String(error),
            metadata: {
              promptLength: 0,
              pdfContentLength: baseResult.pdfContent.length,
              backendDuration: 0,
            },
            llmInteraction: {
              systemPrompt: '',
              userPrompt: '',
              fullPrompt: '',
              rawResponse: '',
              parsedResponse: null,
              requestTimestamp: Date.now(),
              responseTimestamp: Date.now(),
              promptTokens: 0,
              responseTokens: 0,
              totalTokens: 0,
            },
            metrics: undefined,
          });
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(
        `Paper completed in ${totalTime}ms (${evaluationResults.length} questions)`
      );

      return {
        paperId,
        title,
        pdfPath,
        questions: evaluationResults,
        pdfMetadata: formattedMetadata.metadata,
        processingTime: totalTime,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.log(
        `Paper failed: ${error instanceof Error ? error.message : String(error)}`
      );

      return {
        paperId,
        title,
        pdfPath,
        questions: [],
        pdfMetadata: {
          filename: '',
          totalPages: 0,
          totalWords: 0,
        },
        processingTime: totalTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  loadQuestionsFromTemplate(): EvaluationQuestion[] {
    const templateQuestions = this.templateLoader.getEvaluationQuestions();

    const questions: EvaluationQuestion[] = templateQuestions.map(
      (templateQ) => ({
        id: templateQ.id,
        text: templateQ.label,
        type: templateQ.type,
        options: templateQ.options,
        groundTruth: null,
      })
    );

    console.log(`Loaded ${questions.length} questions from frontend template`);
    return questions;
  }

  mapQuestionsToGroundTruth(
    questions: EvaluationQuestion[],
    metadata: any
  ): EvaluationQuestion[] {
    return this.groundTruthMapper.mapQuestionsToGroundTruth(
      questions,
      metadata
    );
  }

  async loadPapersFromDataset(
    datasetPath: string,
    limit?: number,
    offset?: number
  ): Promise<
    Array<{
      paperId: string;
      title: string;
      pdfPath: string;
      metadata: any;
    }>
  > {
    const indexPath = path.join(datasetPath, 'dataset_index.json');

    if (!fs.existsSync(indexPath)) {
      throw new Error(`Dataset index not found: ${indexPath}`);
    }

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const allPapers = index.papers || [];

    const validPapers = [];
    for (const paperInfo of allPapers) {
      const paperId = paperInfo.paper_id?.split('/').pop() || paperInfo.id;
      const paperDir = path.join(datasetPath, paperId);
      const metadataPath = path.join(paperDir, 'metadata.json');
      const pdfPath = path.join(paperDir, 'paper.pdf');

      if (fs.existsSync(metadataPath) && fs.existsSync(pdfPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        validPapers.push({
          paperId,
          title: metadata.title || paperId,
          pdfPath,
          metadata,
        });
      }
    }

    console.log(
      `Found ${validPapers.length} valid papers (with PDF) out of ${allPapers.length} total`
    );

    const start = offset || 0;
    let loadedPapers = validPapers;
    if (limit) {
      loadedPapers = validPapers.slice(start, start + limit);
    } else if (start > 0) {
      loadedPapers = validPapers.slice(start);
    }

    console.log(
      `Loaded ${loadedPapers.length} papers (offset: ${start}, limit: ${limit || 'all'})`
    );
    return loadedPapers;
  }

  async runEvaluation(
    datasetPath: string,
    outputPath: string,
    options: {
      limit?: number;
      offset?: number;
      modelTag?: string;
      withContext?: boolean;
      backendUrl?: string;
      skipExisting?: boolean;
      onlyQuestions?: string[];
    } = {}
  ): Promise<EvaluationSummary> {
    const startTime = Date.now();

    console.log('='.repeat(80));
    console.log('FRONTEND-EXACT EVALUATION RUNNER');
    console.log('='.repeat(80));
    console.log(`Dataset: ${datasetPath}`);
    console.log(`Output: ${outputPath}`);
    console.log(`Offset: ${options.offset || 0}`);
    console.log(`Limit: ${options.limit || 'all'}`);
    if (options.modelTag) {
      console.log(`Model Tag: ${options.modelTag}`);
    }
    console.log(
      `Sibling Context: ${options.withContext ? 'enabled (ground truth)' : 'disabled'}`
    );
    if (options.skipExisting) {
      console.log(
        `Skip Existing: enabled — will only evaluate missing questions`
      );
    }

    let existingData: any = null;
    const existingQuestions = new Set<string>();
    if (options.skipExisting && fs.existsSync(outputPath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
        for (const paper of existingData.results || []) {
          for (const q of paper.questions || []) {
            if (q.success) {
              existingQuestions.add(`${paper.paperId}::${q.questionId}`);
            }
          }
        }
        console.log(
          `Loaded ${existingQuestions.size} existing question results from ${outputPath}`
        );
      } catch (e) {
        console.warn(`Could not load existing results: ${e}`);
        existingData = null;
      }
    }

    const papers = await this.loadPapersFromDataset(
      datasetPath,
      options.limit,
      options.offset
    );

    if (papers.length === 0) {
      throw new Error('No papers found in dataset');
    }

    const results: PaperEvaluationResult[] = [];
    let successfulPapers = 0;
    let failedPapers = 0;

    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i];
      console.log(`\n[${i + 1}/${papers.length}] Processing ${paper.paperId}`);

      const templateQuestions = this.loadQuestionsFromTemplate();
      const allQuestions = this.mapQuestionsToGroundTruth(
        templateQuestions,
        paper.metadata
      );

      if (allQuestions.length === 0) {
        console.log(`  Skipping - no questions found`);
        continue;
      }

      let questionsToEval = allQuestions;

      if (options.onlyQuestions && options.onlyQuestions.length > 0) {
        questionsToEval = questionsToEval.filter((q) =>
          options.onlyQuestions!.includes(q.id)
        );
        if (questionsToEval.length === 0) {
          continue;
        }
      }

      if (options.skipExisting && existingQuestions.size > 0) {
        questionsToEval = allQuestions.filter(
          (q) => !existingQuestions.has(`${paper.paperId}::${q.id}`)
        );
        const skipped = allQuestions.length - questionsToEval.length;
        if (skipped > 0) {
          console.log(
            `  Skipping ${skipped} already-evaluated questions, ${questionsToEval.length} new`
          );
        }
        if (questionsToEval.length === 0) {
          console.log(`  All questions already evaluated — skipping paper`);
          continue;
        }
      }

      const result = await this.evaluatePaper(
        paper.paperId,
        paper.title,
        paper.pdfPath,
        questionsToEval,
        options.withContext || false,
        allQuestions
      );

      if (options.skipExisting && existingData) {
        const existingPaper = (existingData.results || []).find(
          (p: any) => p.paperId === paper.paperId
        );
        if (existingPaper) {
          existingPaper.questions.push(...result.questions);
        } else {
          existingData.results.push(result);
        }
      }

      results.push(result);

      if (result.error) {
        failedPapers++;
      } else {
        successfulPapers++;
      }
    }

    if (options.skipExisting && existingData) {
      const mergedSummary = this.calculateEvaluationSummary(
        existingData.results
      );
      existingData.summary = mergedSummary;
      existingData.configuration.skipExistingMerge = true;
      existingData.configuration.mergedAt = new Date().toISOString();
      fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2));

      const totalTime = Date.now() - startTime;
      console.log('\n' + '='.repeat(80));
      console.log('EVALUATION COMPLETE (merged with existing)');
      console.log('='.repeat(80));
      console.log(
        `New questions evaluated: ${results.reduce((s, r) => s + r.questions.length, 0)}`
      );
      console.log(`Total papers in file: ${existingData.results.length}`);
      console.log(`Results saved to: ${outputPath}`);
      console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);

      return mergedSummary;
    }

    const summary = this.calculateEvaluationSummary(results);

    const finalResults = {
      timestamp: new Date().toISOString(),
      configuration: {
        datasetPath,
        offset: options.offset || 0,
        limit: options.limit,
        modelTag: options.modelTag || null,
        withContext: options.withContext || false,
        backendUrl: options.backendUrl,
        evaluationType: 'frontend-exact',
      },
      summary,
      results,
    };

    fs.writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));

    const totalTime = Date.now() - startTime;
    console.log('\n' + '='.repeat(80));
    console.log('EVALUATION COMPLETE');
    console.log('='.repeat(80));
    console.log(
      `Papers: ${summary.totalPapers} (${summary.successfulPapers} successful, ${summary.failedPapers} failed)`
    );
    console.log(
      `Questions: ${summary.totalQuestions} (${summary.successfulQuestions} successful, ${summary.failedQuestions} failed)`
    );

    console.log('\n--- EVALUATION RESULTS ---');
    const s = summary.simpleMetrics;

    console.log(`Total Questions: ${s.totalQuestions}`);
    console.log('');

    [s.suggestion1, s.suggestion2, s.suggestion3].forEach((suggestionData) => {
      console.log(`Suggestion ${suggestionData.position}:`);

      if (suggestionData.textQuestions.count > 0) {
        console.log(
          ` Text Questions (${suggestionData.textQuestions.count}): BERTScore ${(suggestionData.textQuestions.avgBertScore * 100).toFixed(1)}%`
        );
      }

      if (suggestionData.selectQuestions.count > 0) {
        console.log(
          `Select Questions (${suggestionData.selectQuestions.count}): Accuracy ${(suggestionData.selectQuestions.accuracy * 100).toFixed(1)}%`
        );
      }

      if (suggestionData.multiSelectQuestions.count > 0) {
        console.log(
          `Multi-Select Questions (${suggestionData.multiSelectQuestions.count}): F1 Score ${(suggestionData.multiSelectQuestions.avgF1Score * 100).toFixed(1)}%`
        );
      }

      console.log('');
    });

    console.log('Coverage:');
    console.log(
      `  At least one correct: ${s.anyCorrect.count}/${s.totalQuestions} (${s.anyCorrect.percentage.toFixed(1)}%)`
    );
    console.log(
      `  All three correct: ${s.allCorrect.count}/${s.totalQuestions} (${s.allCorrect.percentage.toFixed(1)}%)`
    );

    console.log(`\nTotal Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`Results saved to: ${outputPath}`);

    return summary;
  }

  private calculateEvaluationSummary(
    results: PaperEvaluationResult[]
  ): EvaluationSummary {
    let totalQuestions = 0;
    let successfulQuestions = 0;
    let failedQuestions = 0;
    let totalProcessingTime = 0;

    const successfulPapers = results.filter((r) => !r.error).length;
    const failedPapers = results.filter((r) => r.error).length;

    const allQuestionResults: QuestionResult[] = [];

    for (const result of results) {
      totalProcessingTime += result.processingTime;

      for (const question of result.questions) {
        totalQuestions++;

        if (question.success) {
          successfulQuestions++;

          if (question.metrics) {
            allQuestionResults.push(question.metrics);
          }
        } else {
          failedQuestions++;
        }
      }
    }

    const averageProcessingTime =
      results.length > 0 ? totalProcessingTime / results.length : 0;

    const simpleMetrics =
      this.metricsCalculator.calculateSummaryMetrics(allQuestionResults);

    return {
      totalPapers: results.length,
      successfulPapers,
      failedPapers,
      totalQuestions,
      successfulQuestions,
      failedQuestions,
      averageProcessingTime,
      simpleMetrics,
    };
  }

  async testBackend(): Promise<{ connected: boolean; error?: string }> {
    return this.backendCaller.testConnection();
  }

  async testBERTScore(): Promise<{ available: boolean; error?: string }> {
    try {
      const calculator = this.metricsCalculator as any;
      if (!calculator.useBERTScore || !calculator.bertScoreCalculator) {
        return {
          available: false,
          error: 'BERTScore not enabled (use USE_BERTSCORE=true)',
        };
      }

      console.log('Testing BERTScore availability...');
      const isAvailable = await calculator.bertScoreCalculator.isAvailable();

      if (isAvailable) {
        console.log('BERTScore is available and working');
        return { available: true };
      } else {
        return {
          available: false,
          error:
            'BERTScore test failed - check Python environment and dependencies',
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('BERTScore test error:', errorMsg);
      return {
        available: false,
        error: `BERTScore test error: ${errorMsg}`,
      };
    }
  }
}
