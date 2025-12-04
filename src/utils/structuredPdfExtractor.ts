import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

// Section patterns for academic papers (IMRaD format and variations)
const SECTION_PATTERNS: Record<string, RegExp> = {
  abstract: /^abstract$/i,
  introduction: /^(1\.?\s*)?(introduction)$/i,
  background:
    /^(\d\.?\s*)?(background|related\s*work|literature\s*review|state\s*of\s*(the\s*)?art)$/i,
  methods:
    /^(\d\.?\s*)?(method(s|ology)?|materials?\s*(and|&)\s*methods?|experimental\s*(setup|design)|approach|research\s*design)$/i,
  results: /^(\d\.?\s*)?(results?|findings?|experimental\s*results?)$/i,
  discussion: /^(\d\.?\s*)?(discussion|analysis)$/i,
  conclusion: /^(\d\.?\s*)?(conclusion(s)?|summary|concluding\s*remarks?)$/i,
  references: /^(references?|bibliography|works?\s*cited)$/i,
  appendix: /^(appendix|appendices|supplementary)/i,
  acknowledgments: /^(acknowledgments?|acknowledgements?)$/i,
};

// Question type to section mapping
const QUESTION_SECTION_MAP: Record<string, string[]> = {
  objective: ['abstract', 'introduction'],
  research_question: ['abstract', 'introduction'],
  hypothesis: ['introduction', 'methods'],
  methodology: ['methods', 'introduction'],
  participants: ['methods'],
  sample: ['methods'],
  data_collection: ['methods'],
  analysis: ['methods', 'results'],
  results: ['results', 'discussion'],
  findings: ['results', 'discussion', 'abstract'],
  limitations: ['discussion', 'conclusion'],
  future_work: ['conclusion', 'discussion'],
  contribution: ['abstract', 'introduction', 'conclusion'],
  implications: ['discussion', 'conclusion'],
  default: ['abstract', 'introduction', 'conclusion'],
};

export interface PageContent {
  pageNumber: number;
  text: string;
  wordCount: number;
  detectedSections: string[];
}

export interface DocumentSection {
  name: string;
  displayName: string;
  startPage: number;
  endPage: number;
  text: string;
  wordCount: number;
}

export interface DocumentMetadata {
  filename: string;
  totalPages: number;
  totalWords: number;
  extractedAt: number;
  hasStructuredSections: boolean;
}

export interface StructuredDocument {
  metadata: DocumentMetadata;
  pages: PageContent[];
  sections: DocumentSection[];
  fullText: string;
}

export interface RetrievalResult {
  content: string;
  pages: number[];
  sections: string[];
  tokenEstimate: number;
}

// Detects section headers in text and returns matches
function detectSectionInText(text: string): string[] {
  const detected: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 50) {
      // Section headers are typically short
      for (const [sectionKey, pattern] of Object.entries(SECTION_PATTERNS)) {
        if (pattern.test(trimmed)) {
          detected.push(sectionKey);
          break;
        }
      }
    }
  }

  return detected;
}

// Estimates token count (rough approximation: ~4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Extracts structured content from a PDF document
export class StructuredPDFExtractor {
  private documentCache: Map<string, StructuredDocument> = new Map();
  private pdfDocCache: Map<string, PDFDocumentProxy> = new Map();

  // Load PDF document with caching
  private async loadDocument(pdfUrl: string): Promise<PDFDocumentProxy> {
    const cached = this.pdfDocCache.get(pdfUrl);
    if (cached) return cached;

    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdfDoc = await loadingTask.promise;
    this.pdfDocCache.set(pdfUrl, pdfDoc);
    return pdfDoc;
  }

  // Extract text from a single page
  private async extractPageText(
    pdfDoc: PDFDocumentProxy,
    pageNumber: number
  ): Promise<string> {
    const page = await pdfDoc.getPage(pageNumber);
    const textContent = await page.getTextContent();

    return textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
  }

  // Extract structured document from PDF
  async extractStructuredDocument(
    pdfUrl: string,
    filename?: string
  ): Promise<StructuredDocument> {
    // Check cache
    const cached = this.documentCache.get(pdfUrl);
    if (cached) return cached;

    const pdfDoc = await this.loadDocument(pdfUrl);
    const pages: PageContent[] = [];
    const sectionMap: Map<string, { startPage: number; texts: string[] }> =
      new Map();
    let currentSection: string | null = null;

    // Extract text page by page
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const text = await this.extractPageText(pdfDoc, pageNum);
      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
      const detectedSections = detectSectionInText(text);

      pages.push({
        pageNumber: pageNum,
        text,
        wordCount,
        detectedSections,
      });

      // Track sections
      for (const section of detectedSections) {
        if (!sectionMap.has(section)) {
          sectionMap.set(section, { startPage: pageNum, texts: [] });
        }
        currentSection = section;
      }

      // Add text to current section
      if (currentSection && sectionMap.has(currentSection)) {
        sectionMap.get(currentSection)!.texts.push(text);
      }
    }

    // Build sections array
    const sections: DocumentSection[] = [];
    for (const [name, data] of sectionMap.entries()) {
      const text = data.texts.join('\n\n');
      sections.push({
        name,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        startPage: data.startPage,
        endPage: data.startPage + data.texts.length - 1,
        text,
        wordCount: text.split(/\s+/).filter((w) => w.length > 0).length,
      });
    }

    // Sort sections by start page
    sections.sort((a, b) => a.startPage - b.startPage);

    const fullText = pages.map((p) => p.text).join('\n\n');
    const totalWords = fullText.split(/\s+/).filter((w) => w.length > 0).length;

    const document: StructuredDocument = {
      metadata: {
        filename: filename || pdfUrl.split('/').pop() || 'document.pdf',
        totalPages: pdfDoc.numPages,
        totalWords,
        extractedAt: Date.now(),
        hasStructuredSections: sections.length > 0,
      },
      pages,
      sections,
      fullText,
    };

    this.documentCache.set(pdfUrl, document);
    return document;
  }

  // Classify question to determine relevant sections
  classifyQuestion(questionText: string): string[] {
    const lowerQuestion = questionText.toLowerCase();

    // Check for specific keywords
    if (
      lowerQuestion.includes('objective') ||
      lowerQuestion.includes('aim') ||
      lowerQuestion.includes('goal') ||
      lowerQuestion.includes('purpose')
    ) {
      return QUESTION_SECTION_MAP.objective;
    }

    if (
      lowerQuestion.includes('research question') ||
      lowerQuestion.includes('rq')
    ) {
      return QUESTION_SECTION_MAP.research_question;
    }

    if (
      lowerQuestion.includes('hypothesis') ||
      lowerQuestion.includes('hypotheses')
    ) {
      return QUESTION_SECTION_MAP.hypothesis;
    }

    if (
      lowerQuestion.includes('method') ||
      lowerQuestion.includes('approach') ||
      lowerQuestion.includes('procedure') ||
      lowerQuestion.includes('design')
    ) {
      return QUESTION_SECTION_MAP.methodology;
    }

    if (
      lowerQuestion.includes('participant') ||
      lowerQuestion.includes('subject') ||
      lowerQuestion.includes('respondent')
    ) {
      return QUESTION_SECTION_MAP.participants;
    }

    if (
      lowerQuestion.includes('sample') ||
      lowerQuestion.includes('population')
    ) {
      return QUESTION_SECTION_MAP.sample;
    }

    if (
      lowerQuestion.includes('data collection') ||
      lowerQuestion.includes('instrument') ||
      lowerQuestion.includes('survey') ||
      lowerQuestion.includes('interview')
    ) {
      return QUESTION_SECTION_MAP.data_collection;
    }

    if (
      lowerQuestion.includes('analysis') ||
      lowerQuestion.includes('statistical') ||
      lowerQuestion.includes('qualitative')
    ) {
      return QUESTION_SECTION_MAP.analysis;
    }

    if (
      lowerQuestion.includes('result') ||
      lowerQuestion.includes('finding') ||
      lowerQuestion.includes('outcome')
    ) {
      return QUESTION_SECTION_MAP.results;
    }

    if (
      lowerQuestion.includes('limitation') ||
      lowerQuestion.includes('threat') ||
      lowerQuestion.includes('validity')
    ) {
      return QUESTION_SECTION_MAP.limitations;
    }

    if (
      lowerQuestion.includes('future') ||
      lowerQuestion.includes('recommendation')
    ) {
      return QUESTION_SECTION_MAP.future_work;
    }

    if (
      lowerQuestion.includes('contribution') ||
      lowerQuestion.includes('novelty')
    ) {
      return QUESTION_SECTION_MAP.contribution;
    }

    if (
      lowerQuestion.includes('implication') ||
      lowerQuestion.includes('impact')
    ) {
      return QUESTION_SECTION_MAP.implications;
    }

    return QUESTION_SECTION_MAP.default;
  }

  // Retrieve relevant content for a question
  retrieveForQuestion(
    document: StructuredDocument,
    questionText: string,
    maxTokens: number = 4000
  ): RetrievalResult {
    const relevantSectionNames = this.classifyQuestion(questionText);
    const includedSections: string[] = [];
    const includedPages: Set<number> = new Set();
    let content = '';
    let currentTokens = 0;

    // Always try to include abstract first (if available and fits)
    const abstractSection = document.sections.find(
      (s) => s.name === 'abstract'
    );
    if (abstractSection) {
      const abstractTokens = estimateTokens(abstractSection.text);
      if (currentTokens + abstractTokens < maxTokens) {
        content += `[ABSTRACT - Page ${abstractSection.startPage}]\n${abstractSection.text}\n\n`;
        currentTokens += abstractTokens;
        includedSections.push('abstract');
        includedPages.add(abstractSection.startPage);
      }
    }

    // Add relevant sections
    for (const sectionName of relevantSectionNames) {
      if (sectionName === 'abstract') continue; // Already handled

      const section = document.sections.find((s) => s.name === sectionName);
      if (section) {
        const sectionTokens = estimateTokens(section.text);
        if (currentTokens + sectionTokens < maxTokens) {
          content += `[${section.displayName.toUpperCase()} - Pages ${section.startPage}-${section.endPage}]\n${section.text}\n\n`;
          currentTokens += sectionTokens;
          includedSections.push(sectionName);
          for (let p = section.startPage; p <= section.endPage; p++) {
            includedPages.add(p);
          }
        }
      }
    }

    // If no sections found or very little content, fall back to page-based retrieval
    if (currentTokens < 500 && document.pages.length > 0) {
      // Include first few pages and last page (often has conclusion)
      const fallbackPages = [
        ...document.pages.slice(0, 3),
        document.pages[document.pages.length - 1],
      ].filter(
        (p, i, arr) => arr.findIndex((x) => x.pageNumber === p.pageNumber) === i
      );

      for (const page of fallbackPages) {
        const pageTokens = estimateTokens(page.text);
        if (currentTokens + pageTokens < maxTokens) {
          content += `[PAGE ${page.pageNumber}]\n${page.text}\n\n`;
          currentTokens += pageTokens;
          includedPages.add(page.pageNumber);
        }
      }
    }

    return {
      content: content.trim(),
      pages: Array.from(includedPages).sort((a, b) => a - b),
      sections: includedSections,
      tokenEstimate: currentTokens,
    };
  }

  // Get content for specific pages
  getPageContent(
    document: StructuredDocument,
    pageNumbers: number[]
  ): RetrievalResult {
    const pages = document.pages.filter((p) =>
      pageNumbers.includes(p.pageNumber)
    );
    const content = pages
      .map((p) => `[PAGE ${p.pageNumber}]\n${p.text}`)
      .join('\n\n');

    return {
      content,
      pages: pageNumbers,
      sections: [],
      tokenEstimate: estimateTokens(content),
    };
  }

  // Get full document content (fallback)
  getFullContent(document: StructuredDocument): RetrievalResult {
    const content = document.pages
      .map((p) => `[PAGE ${p.pageNumber}]\n${p.text}`)
      .join('\n\n');

    return {
      content,
      pages: document.pages.map((p) => p.pageNumber),
      sections: document.sections.map((s) => s.name),
      tokenEstimate: estimateTokens(content),
    };
  }

  // Clear cache for a specific document
  clearCache(pdfUrl: string): void {
    this.documentCache.delete(pdfUrl);
    this.pdfDocCache.delete(pdfUrl);
  }

  // Clear all caches
  clearAllCaches(): void {
    this.documentCache.clear();
    this.pdfDocCache.clear();
  }
}

// Singleton instance
export const structuredPdfExtractor = new StructuredPDFExtractor();
