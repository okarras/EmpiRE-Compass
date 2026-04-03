/**
 * Frontend Types - Local definitions to avoid importing problematic frontend files
 */

export interface GenerateSuggestionsRequest {
  questionText: string;
  questionType: string;
  pdfContent: string;
  questionOptions?: string[];
  maxTokens?: number;
  temperature?: number;
  pdfMetadata?: {
    filename?: string;
    totalPages?: number;
  };
}

export interface GenerateSuggestionsResponse {
  suggestions: Suggestion[];
  error?: string;
}

export interface Suggestion {
  rank: number;
  text: string;
  confidence: number;
  evidence: Evidence[];
}

export interface Evidence {
  pageNumber: number;
  excerpt: string;
}

export interface AppError {
  message: string;
  code: string;
}

export type ErrorType =
  | 'validation'
  | 'processing'
  | 'api'
  | 'config'
  | 'network';

export interface PageContent {
  pageNumber: number;
  text: string;
  wordCount: number;
}

export interface DocumentMetadata {
  filename: string;
  totalPages: number;
  totalWords: number;
  extractedAt: number;
}

export interface StructuredDocument {
  metadata: DocumentMetadata;
  pages: PageContent[];
  fullText: string;
}

export interface RetrievalResult {
  content: string;
  pages: number[];
  tokenEstimate: number;
}
