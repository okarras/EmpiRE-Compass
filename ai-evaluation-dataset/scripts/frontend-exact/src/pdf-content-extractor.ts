/**
 * PDF Content Extractor - Uses EXACT frontend logic with semantic chunking
 *
 * This module creates a Node.js compatible version of the frontend
 * structuredPdfExtractor to ensure 100% identical behavior.
 */

import { FrontendStructuredPDFExtractor } from './frontend-pdf-extractor.js';
import type { StructuredDocument, PageContent } from './frontend-types';

const frontendPdfExtractor = new FrontendStructuredPDFExtractor();

export interface PDFExtractionResult {
  success: boolean;
  structuredDocument: StructuredDocument | null;
  pdfContent: string;
  metadata: {
    filename: string;
    totalPages: number;
    totalWords: number;
    pages: PageContent[];
    extractedAt: number;
    usedSemanticChunking?: boolean;
    semanticChunks?: number;
    semanticTokens?: number;
  };
  error?: string;
}

export class FrontendPDFExtractor {
  private backendUrl: string;

  constructor(backendUrl?: string) {
    this.backendUrl =
      backendUrl || process.env.BACKEND_URL || 'http://localhost:5001';
  }

  async extractPDFContent(
    pdfPath: string,
    questionText?: string,
    maxTokens: number = 4000
  ): Promise<PDFExtractionResult> {
    try {
      console.log(`Extracting PDF content from: ${pdfPath}`);

      const structuredDocument =
        await frontendPdfExtractor.extractStructuredDocument(pdfPath);

      if (!structuredDocument) {
        throw new Error('Failed to extract structured document');
      }

      let pdfContent: string;
      let usedSemanticChunking = false;
      let semanticChunks = 0;
      let semanticTokens = 0;

      if (questionText && structuredDocument) {
        try {
          console.log(
            `[PDFExtractor] Using backend semantic chunking for content selection`
          );

          const semanticResult = await this.getSemanticChunks(
            questionText,
            structuredDocument.pages,
            maxTokens
          );

          console.log(
            `[PDFExtractor] Backend returned ${semanticResult.totalChunks} relevant chunks (${semanticResult.totalTokens} tokens)`
          );

          const formattedChunks = semanticResult.chunks
            .map(
              (chunk: {
                text: string;
                pageNumber: number;
                similarity: number;
              }) => {
                return `[Page ${chunk.pageNumber}]\n${chunk.text}`;
              }
            )
            .join('\n\n');

          pdfContent = formattedChunks;
          usedSemanticChunking = true;
          semanticChunks = semanticResult.totalChunks;
          semanticTokens = semanticResult.totalTokens;

          console.log(
            `[PDFExtractor] Formatted content length: ${pdfContent.length} chars`
          );
        } catch (error) {
          console.error(
            '[PDFExtractor] Backend semantic chunking failed, falling back to full text:',
            error
          );

          const fullContentResult =
            frontendPdfExtractor.getFullContent(structuredDocument);
          pdfContent = fullContentResult.content;

          console.log(`Using full text fallback`);
        }
      } else {
        const retrievalResult =
          frontendPdfExtractor.getFullContent(structuredDocument);
        pdfContent = retrievalResult.content;
        console.log(`Using full content fallback`);
      }

      console.log(`Extracted ${pdfContent.length} characters from PDF`);

      return {
        success: true,
        structuredDocument,
        pdfContent,
        metadata: {
          filename: structuredDocument.metadata.filename,
          totalPages: structuredDocument.metadata.totalPages,
          totalWords: structuredDocument.metadata.totalWords,
          pages: structuredDocument.pages,
          extractedAt: Date.now(),
          usedSemanticChunking,
          semanticChunks,
          semanticTokens,
        },
      };
    } catch (error) {
      console.error('PDF extraction failed:', error);

      return {
        success: false,
        structuredDocument: null,
        pdfContent: '',
        metadata: {
          filename: '',
          totalPages: 0,
          totalWords: 0,
          pages: [],
          extractedAt: Date.now(),
        },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  async getChunkedContentForQuestion(
    structuredDocument: StructuredDocument,
    questionText: string,
    maxTokens: number = 4000
  ): Promise<PDFExtractionResult> {
    try {
      const semanticResult = await this.getSemanticChunks(
        questionText,
        structuredDocument.pages,
        maxTokens
      );

      const formattedChunks = semanticResult.chunks
        .map(
          (chunk: { text: string; pageNumber: number; similarity: number }) => {
            return `[Page ${chunk.pageNumber}]\n${chunk.text}`;
          }
        )
        .join('\n\n');

      return {
        success: true,
        structuredDocument,
        pdfContent: formattedChunks,
        metadata: {
          filename: structuredDocument.metadata.filename,
          totalPages: structuredDocument.metadata.totalPages,
          totalWords: structuredDocument.metadata.totalWords,
          pages: structuredDocument.pages,
          extractedAt: Date.now(),
          usedSemanticChunking: true,
          semanticChunks: semanticResult.totalChunks,
          semanticTokens: semanticResult.totalTokens,
        },
      };
    } catch (error) {
      const fullContentResult =
        frontendPdfExtractor.getFullContent(structuredDocument);
      return {
        success: true,
        structuredDocument,
        pdfContent: fullContentResult.content,
        metadata: {
          filename: structuredDocument.metadata.filename,
          totalPages: structuredDocument.metadata.totalPages,
          totalWords: structuredDocument.metadata.totalWords,
          pages: structuredDocument.pages,
          extractedAt: Date.now(),
          usedSemanticChunking: false,
        },
      };
    }
  }

  private async getSemanticChunks(
    question: string,
    pages: Array<{ pageNumber: number; text: string; wordCount: number }>,
    maxTokens: number = 4000
  ): Promise<{
    chunks: Array<{
      text: string;
      pageNumber: number;
      similarity: number;
      tokenEstimate: number;
    }>;
    totalTokens: number;
    totalChunks: number;
  }> {
    try {
      const url = `${this.backendUrl}/api/ai/semantic-chunks`;

      console.log(`[PDFExtractor] Calling backend semantic chunking: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': process.env.DEV_USER_ID || 'evaluation-system',
          'x-user-email':
            process.env.DEV_USER_EMAIL || 'evaluation@frontend-exact.com',
        },
        body: JSON.stringify({
          question,
          pages,
          maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        throw new Error(
          errorData.error || `Semantic chunking failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[PDFExtractor] Semantic chunking error:', error);
      throw error;
    }
  }
}
