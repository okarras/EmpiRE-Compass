/**
 * PDF Metadata Formatter - Uses EXACT frontend metadata formatting
 *
 * This module formats PDF metadata exactly the same way as the frontend
 * to ensure identical prompt generation.
 */

import type { StructuredDocument } from './frontend-types';

export interface FormattedPDFMetadata {
  metadataText: string;
  metadata: {
    filename: string;
    totalPages: number;
    totalWords: number;
    averageWordsPerPage: number;
  };
}

export class FrontendPDFMetadataFormatter {
  formatPDFMetadata(
    structuredDocument: StructuredDocument | null,
    filename?: string
  ): FormattedPDFMetadata {
    if (!structuredDocument) {
      return {
        metadataText: filename ? `\nPDF Filename: ${filename}` : '',
        metadata: {
          filename: filename || '',
          totalPages: 0,
          totalWords: 0,
          averageWordsPerPage: 0,
        },
      };
    }

    const metadata = structuredDocument.metadata;

    const metadataParts: string[] = [];

    if (metadata.filename && metadata.filename.trim()) {
      metadataParts.push(`PDF Filename: ${metadata.filename}`);
    } else if (filename && filename.trim()) {
      metadataParts.push(`PDF Filename: ${filename}`);
    }

    if (metadata.totalPages && metadata.totalPages > 0) {
      metadataParts.push(`Total Pages: ${metadata.totalPages}`);
    }

    if (metadata.totalWords && metadata.totalWords > 0) {
      metadataParts.push(`Total Words: ${metadata.totalWords}`);
    }

    const metadataText =
      metadataParts.length > 0 ? '\n' + metadataParts.join('\n') : '';

    // Calculate additional metadata
    const averageWordsPerPage =
      metadata.totalPages > 0
        ? Math.round(metadata.totalWords / metadata.totalPages)
        : 0;

    return {
      metadataText,
      metadata: {
        filename: metadata.filename || filename || '',
        totalPages: metadata.totalPages,
        totalWords: metadata.totalWords,
        averageWordsPerPage,
      },
    };
  }
}
