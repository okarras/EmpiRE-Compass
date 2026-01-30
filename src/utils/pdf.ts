import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { findMatchesOnPage } from '../pages/PdfHighlights';
import type { Evidence, EvidenceHighlight, HighlightRect } from './suggestions';
import { preprocessSearchText } from './robustPdfMatcher';

if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

//  Service for extracting text from PDF documents with caching

export class PDFTextExtractor {
  private fullTextCache: Map<string, string> = new Map();
  private pageTextCache: Map<string, Map<number, string>> = new Map();
  private documentCache: Map<string, PDFDocumentProxy> = new Map();

  async extractFullText(pdfUrl: string): Promise<string> {
    const cached = this.fullTextCache.get(pdfUrl);
    if (cached) {
      return cached;
    }

    try {
      const pdfDoc = await this.loadDocument(pdfUrl);
      const textPromises: Promise<string>[] = [];

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        textPromises.push(
          this.extractPageTextInternal(pdfDoc, pdfUrl, pageNum)
        );
      }

      const fullText = (await Promise.all(textPromises)).join('\n\n');
      this.fullTextCache.set(pdfUrl, fullText);
      return fullText;
    } catch (error) {
      console.error('Error extracting full text from PDF:', error);
      throw new Error(
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async extractPageText(pdfUrl: string, pageNumber: number): Promise<string> {
    const pageCache = this.pageTextCache.get(pdfUrl);
    if (pageCache?.has(pageNumber)) {
      return pageCache.get(pageNumber)!;
    }

    try {
      const pdfDoc = await this.loadDocument(pdfUrl);

      if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
        throw new Error(
          `Invalid page number: ${pageNumber}. Document has ${pdfDoc.numPages} pages.`
        );
      }

      return await this.extractPageTextInternal(pdfDoc, pdfUrl, pageNumber);
    } catch (error) {
      console.error(`Error extracting text from page ${pageNumber}:`, error);
      throw new Error(
        `Failed to extract text from page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async extractPageRange(
    pdfUrl: string,
    startPage: number,
    endPage: number
  ): Promise<string> {
    try {
      const pdfDoc = await this.loadDocument(pdfUrl);

      if (startPage < 1 || endPage > pdfDoc.numPages || startPage > endPage) {
        throw new Error(
          `Invalid page range: ${startPage}-${endPage}. Document has ${pdfDoc.numPages} pages.`
        );
      }

      const textPromises: Promise<string>[] = [];
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        textPromises.push(
          this.extractPageTextInternal(pdfDoc, pdfUrl, pageNum)
        );
      }

      const pageTexts = await Promise.all(textPromises);
      return pageTexts.join('\n\n');
    } catch (error) {
      console.error(
        `Error extracting text from page range ${startPage}-${endPage}:`,
        error
      );
      throw new Error(
        `Failed to extract text from page range: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  clearCache(): void {
    this.fullTextCache.clear();
    this.pageTextCache.clear();
    this.documentCache.clear();
  }

  clearDocumentCache(pdfUrl: string): void {
    this.fullTextCache.delete(pdfUrl);
    this.pageTextCache.delete(pdfUrl);
    this.documentCache.delete(pdfUrl);
  }

  private async loadDocument(pdfUrl: string): Promise<PDFDocumentProxy> {
    const cached = this.documentCache.get(pdfUrl);
    if (cached) {
      return cached;
    }

    try {
      const loadingTask = pdfjs.getDocument(pdfUrl);
      const pdfDoc = await loadingTask.promise;

      this.documentCache.set(pdfUrl, pdfDoc);
      return pdfDoc;
    } catch (error) {
      console.error('Error loading PDF document:', error);
      throw new Error(
        `Failed to load PDF document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async extractPageTextInternal(
    pdfDoc: PDFDocumentProxy,
    pdfUrl: string,
    pageNumber: number
  ): Promise<string> {
    const pageCache = this.pageTextCache.get(pdfUrl);
    if (pageCache?.has(pageNumber)) {
      return pageCache.get(pageNumber)!;
    }

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();

      if (!this.pageTextCache.has(pdfUrl)) {
        this.pageTextCache.set(pdfUrl, new Map());
      }
      this.pageTextCache.get(pdfUrl)!.set(pageNumber, pageText);

      return pageText;
    } catch (error) {
      console.error(`Error extracting text from page ${pageNumber}:`, error);
      throw error;
    }
  }

  async getDocumentInfo(pdfUrl: string): Promise<{
    numPages: number;
    filename: string;
  }> {
    try {
      const pdfDoc = await this.loadDocument(pdfUrl);

      return {
        numPages: pdfDoc.numPages,
        filename: pdfUrl.split('/').pop() || 'document.pdf',
      };
    } catch (error) {
      console.error('Error getting document info:', error);
      throw new Error(
        `Failed to get document info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const pdfTextExtractor = new PDFTextExtractor();

export async function loadPDFDocument(
  pdfUrl: string
): Promise<PDFDocumentProxy> {
  try {
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdfDoc = await loadingTask.promise;
    return pdfDoc;
  } catch (error) {
    console.error('Error loading PDF document:', error);
    throw new Error(
      `Failed to load PDF document: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function getCachedDocument(pdfUrl: string): PDFDocumentProxy | null {
  return (pdfTextExtractor as any).documentCache.get(pdfUrl) ?? null;
}

export async function generateEvidenceHighlight(
  pdfDoc: PDFDocumentProxy,
  pageWidth: number,
  evidence: Evidence,
  suggestionId: string
): Promise<EvidenceHighlight | null> {
  try {
    console.log('[Evidence Highlighter] Starting highlight generation:', {
      pageNumber: evidence.pageNumber,
      excerpt: evidence.excerpt,
      pageWidth,
    });

    // Use robust preprocessing to clean the search text
    const searchText = preprocessSearchText(evidence.excerpt);

    console.log('[Evidence Highlighter] Preprocessed search text:', searchText);

    let page = await pdfDoc.getPage(evidence.pageNumber);
    let rects = await findMatchesOnPage(page, pageWidth, searchText, {
      caseInsensitive: true,
    });

    let actualPageNumber = evidence.pageNumber;

    if (rects.length === 0) {
      console.warn(
        `[Evidence Highlighter] No matches on page ${evidence.pageNumber}, searching all pages...`
      );

      // Search all pages in the document
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        if (pageNum === evidence.pageNumber) continue;

        console.log(`[Evidence Highlighter] Trying page ${pageNum}...`);
        page = await pdfDoc.getPage(pageNum);
        rects = await findMatchesOnPage(page, pageWidth, searchText, {
          caseInsensitive: true,
        });

        if (rects.length > 0) {
          actualPageNumber = pageNum;
          console.log(
            `[Evidence Highlighter] Match found on page ${pageNum} (originally page ${evidence.pageNumber})`
          );
          break;
        }
      }
    } else {
      console.log(
        `[Evidence Highlighter] Match found on specified page ${evidence.pageNumber}`
      );
    }

    console.log('[Evidence Highlighter] Found rectangles:', rects);

    if (rects.length === 0) {
      console.warn(
        `[Evidence Highlighter] No matches found for evidence (searched all ${pdfDoc.numPages} pages):`,
        searchText
      );
      return null;
    }

    return {
      evidence: {
        ...evidence,
        pageNumber: actualPageNumber,
      },
      suggestionId,
      rects,
    };
  } catch (error) {
    console.error(
      `Error generating highlight for evidence on page ${evidence.pageNumber}:`,
      error
    );
    return null;
  }
}

export async function generateEvidenceHighlights(
  pdfDoc: PDFDocumentProxy,
  pageWidth: number,
  evidenceList: Evidence[],
  suggestionId: string
): Promise<EvidenceHighlight[]> {
  const highlights = await Promise.all(
    evidenceList.map((evidence) =>
      generateEvidenceHighlight(pdfDoc, pageWidth, evidence, suggestionId)
    )
  );

  return highlights.filter((h): h is EvidenceHighlight => !!h);
}

export function evidenceHighlightsToPageMap(
  highlights: EvidenceHighlight[]
): Record<number, HighlightRect[]> {
  const pageMap: Record<number, HighlightRect[]> = {};

  for (const highlight of highlights) {
    const pageNumber = highlight.evidence.pageNumber;
    if (!pageMap[pageNumber]) {
      pageMap[pageNumber] = [];
    }
    pageMap[pageNumber].push(...highlight.rects);
  }

  return pageMap;
}

export async function generateSingleEvidenceHighlightMap(
  pdfDoc: PDFDocumentProxy,
  pageWidth: number,
  evidence: Evidence,
  suggestionId: string
): Promise<Record<number, HighlightRect[]>> {
  const highlight = await generateEvidenceHighlight(
    pdfDoc,
    pageWidth,
    evidence,
    suggestionId
  );

  if (!highlight) {
    return {};
  }

  return evidenceHighlightsToPageMap([highlight]);
}
