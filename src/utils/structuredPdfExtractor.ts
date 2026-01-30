import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

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

  // Extract text from a single page with proper line breaks
  private async extractPageText(
    pdfDoc: PDFDocumentProxy,
    pageNumber: number
  ): Promise<string> {
    const page = await pdfDoc.getPage(pageNumber);
    const textContent = await page.getTextContent();

    let lastY = -1;
    const lines: string[] = [];
    let currentLine = '';

    for (const item of textContent.items) {
      if (!('str' in item)) continue;

      const text = (item as any).str;
      const y = (item as any).transform[5];

      if (lastY !== -1 && Math.abs(y - lastY) > 5) {
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = text;
      } else {
        currentLine += (currentLine ? ' ' : '') + text;
      }

      lastY = y;
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    return lines.join('\n');
  }

  // Extract structured document from PDF
  async extractStructuredDocument(
    pdfUrl: string,
    filename?: string
  ): Promise<StructuredDocument> {
    console.log('[StructuredPDFExtractor] Extracting PDF:', filename || pdfUrl);

    // Check cache
    const cached = this.documentCache.get(pdfUrl);
    if (cached) {
      console.log('[StructuredPDFExtractor] Using cached document');
      return cached;
    }

    const extractionStart = Date.now();
    const pdfDoc = await this.loadDocument(pdfUrl);
    const pages: PageContent[] = [];

    console.log(
      `[StructuredPDFExtractor] PDF loaded: ${pdfDoc.numPages} pages`
    );

    // Extract text page by page
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const text = await this.extractPageText(pdfDoc, pageNum);
      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

      pages.push({
        pageNumber: pageNum,
        text,
        wordCount,
      });
    }

    const fullText = pages.map((p) => p.text).join('\n\n');
    const totalWords = fullText.split(/\s+/).filter((w) => w.length > 0).length;

    const extractionTime = Date.now() - extractionStart;

    const document: StructuredDocument = {
      metadata: {
        filename: filename || pdfUrl.split('/').pop() || 'document.pdf',
        totalPages: pdfDoc.numPages,
        totalWords,
        extractedAt: Date.now(),
      },
      pages,
      fullText,
    };

    console.log('[StructuredPDFExtractor] Extraction complete:', {
      filename: document.metadata.filename,
      totalPages: document.metadata.totalPages,
      totalWords: document.metadata.totalWords,
      extractionTime: `${extractionTime}ms`,
    });

    this.documentCache.set(pdfUrl, document);
    return document;
  }

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
      tokenEstimate: estimateTokens(content),
    };
  }

  /**
   * Get full document content with page markers
   */
  getFullContent(document: StructuredDocument): RetrievalResult {
    const content = document.pages
      .map((p) => `[PAGE ${p.pageNumber}]\n${p.text}`)
      .join('\n\n');

    return {
      content,
      pages: document.pages.map((p) => p.pageNumber),
      tokenEstimate: estimateTokens(content),
    };
  }

  formatFullDocumentWithPageMarkers(document: StructuredDocument): string {
    return document.pages
      .map((p) => `[PAGE ${p.pageNumber}]\n${p.text}`)
      .join('\n\n');
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

if (typeof window !== 'undefined') {
  (window as any).structuredPdfExtractor = structuredPdfExtractor;
  (window as any).clearPdfCache = () => {
    structuredPdfExtractor.clearAllCaches();
    console.log(
      '✅ PDF cache cleared! Upload a new PDF to see extraction logs.'
    );
  };
}
