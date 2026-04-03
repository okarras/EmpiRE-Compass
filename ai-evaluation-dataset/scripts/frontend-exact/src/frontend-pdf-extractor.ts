/**
 * Frontend PDF Extractor - Node.js compatible version of frontend structuredPdfExtractor
 */

import * as fs from 'fs';
import * as path from 'path';
const PDFParser = require('pdf2json');

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

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class FrontendStructuredPDFExtractor {
  private documentCache: Map<string, StructuredDocument> = new Map();

  private async parsePDFFile(pdfPath: string): Promise<{
    fullText: string;
    pages: PageContent[];
    numPages: number;
  }> {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(new Error(`PDF parsing error: ${errData.parserError}`));
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          const pages: PageContent[] = [];
          let fullText = '';

          if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
            for (
              let pageIndex = 0;
              pageIndex < pdfData.Pages.length;
              pageIndex++
            ) {
              const page = pdfData.Pages[pageIndex];
              let pageText = '';

              if (page.Texts && Array.isArray(page.Texts)) {
                const textItems = page.Texts.map(
                  (textItem: any, index: number) => {
                    let text = '';
                    if (textItem.R && Array.isArray(textItem.R)) {
                      for (const run of textItem.R) {
                        if (run.T) {
                          text += decodeURIComponent(run.T) + ' ';
                        }
                      }
                    }
                    return {
                      text: text.trim(),
                      y: textItem.y || 0,
                      x: textItem.x || 0,
                      index,
                    };
                  }
                ).filter((item: any) => item.text.length > 0);

                textItems.sort((a: any, b: any) => {
                  if (Math.abs(a.y - b.y) > 0.1) {
                    return b.y - a.y;
                  }
                  return a.x - b.x;
                });

                const filteredItems = textItems.filter((item: any) => {
                  const text = item.text.toLowerCase();
                  if (
                    text.includes('authorized licensed use') ||
                    text.includes('downloaded on') ||
                    text.includes('restrictions apply') ||
                    text.includes('ieee xplore') ||
                    text.includes('technische informationsbibliothek') ||
                    text.includes('tib') ||
                    text.match(/^\d+\s+\d+$/) ||
                    text.match(/^20\d{2}\s+ieee/) ||
                    text.match(/^\d{4}-\d{4}\/\d{2}/) ||
                    text.match(/^doi\s*10\./) ||
                    text.includes('$31.00') ||
                    (text.length < 10 && text.match(/^\d+$/))
                  ) {
                    return false;
                  }
                  return true;
                });

                pageText = filteredItems
                  .map((item: any) => item.text)
                  .join(' ');
              }

              pageText = pageText
                .replace(/[ \t]+/g, ' ')
                .replace(/\n\s+/g, '\n')
                .replace(/\s+\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

              const wordCount = pageText
                .split(/\s+/)
                .filter((word) => word.length > 0).length;

              pages.push({
                pageNumber: pageIndex + 1,
                text: pageText,
                wordCount,
              });

              fullText += pageText + '\n\n';
            }
          }

          fullText = fullText.trim();

          resolve({
            fullText,
            pages,
            numPages: pdfData.Pages ? pdfData.Pages.length : 0,
          });
        } catch (error) {
          reject(
            new Error(
              `Error processing PDF data: ${error instanceof Error ? error.message : String(error)}`
            )
          );
        }
      });

      pdfParser.loadPDF(pdfPath);
    });
  }

  async extractStructuredDocument(
    pdfPath: string,
    filename?: string
  ): Promise<StructuredDocument> {
    const cached = this.documentCache.get(pdfPath);
    if (cached) return cached;

    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    const pdfData = await this.parsePDFFile(pdfPath);
    const pages = pdfData.pages;

    const fullText = pages.map((p) => p.text).join('\n\n');
    const totalWords = fullText.split(/\s+/).filter((w) => w.length > 0).length;

    const document: StructuredDocument = {
      metadata: {
        filename: filename || path.basename(pdfPath),
        totalPages: pdfData.numPages,
        totalWords,
        extractedAt: Date.now(),
      },
      pages,
      fullText,
    };

    this.documentCache.set(pdfPath, document);
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

  clearCache(pdfUrl: string): void {
    this.documentCache.delete(pdfUrl);
  }

  clearAllCaches(): void {
    this.documentCache.clear();
  }
}
