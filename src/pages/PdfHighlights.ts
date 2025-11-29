import type {
  PDFDocumentProxy,
  PDFPageProxy,
  TextContent,
} from 'pdfjs-dist/types/src/display/api';
import {
  findRobustMatch,
  preprocessSearchText,
} from '../utils/robustPdfMatcher';

interface PdfTextItem {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
  dir?: string;
  fontName?: string;
}

export type Rect = { left: number; top: number; width: number; height: number };

function itemToViewportRect(
  item: PdfTextItem,
  viewport: ReturnType<PDFPageProxy['getViewport']>
): Rect {
  const tx = item.transform || [1, 0, 0, 1, 0, 0];

  const fontHeight = Math.hypot(tx[1] || 0, tx[3] || 0) || 10;

  const xPdf = tx[4] ?? 0;
  const yBaselinePdf = tx[5] ?? 0;
  const yTopPdf = yBaselinePdf - fontHeight * 0;
  const yBottomPdf = yBaselinePdf - fontHeight * 0.15;

  const wPdf =
    (item.width as number) ??
    Math.max(1, fontHeight * (item.str?.length ?? 1) * 0.5);

  const vpRect = viewport.convertToViewportRectangle([
    xPdf,
    yTopPdf,
    xPdf + wPdf,
    yBottomPdf,
  ]);

  let left = Math.min(vpRect[0], vpRect[2]);
  let top = Math.min(vpRect[1], vpRect[3]);
  let right = Math.max(vpRect[0], vpRect[2]);
  let bottom = Math.max(vpRect[1], vpRect[3]);

  const verticalPadding = 15;
  const horizontalPadding = -13;

  top = Math.max(0, top - verticalPadding);
  bottom = bottom + 5;
  left = Math.max(0, left - horizontalPadding);
  right = right + horizontalPadding;

  const widthPx = right - left + 32;
  const heightPx = bottom - top;

  return { left, top, width: widthPx, height: heightPx };
}

export async function extractPageTextAndRects(
  page: PDFPageProxy,
  pageWidth: number
): Promise<{
  fullText: string;
  charToItem: { itemIndex: number; offsetInItem: number }[];
  itemRects: Rect[];
}> {
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = pageWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const textContent: TextContent = await page.getTextContent();
  const items = (textContent.items as any[]).map((it) => it as PdfTextItem);

  let fullText = '';
  const charToItem: { itemIndex: number; offsetInItem: number }[] = [];
  const itemRects: Rect[] = [];

  items.forEach((item, itemIndex) => {
    const s = item.str ?? '';
    const rect = itemToViewportRect(item, viewport);
    itemRects.push(rect);

    for (let j = 0; j < s.length; j++) {
      charToItem.push({ itemIndex, offsetInItem: j });
      fullText += s[j];
    }
  });

  return { fullText, charToItem, itemRects };
}

export async function findMatchesOnPage(
  page: PDFPageProxy,
  pageWidth: number,
  search: string | RegExp,
  options?: { caseInsensitive?: boolean }
): Promise<Rect[]> {
  const { fullText, charToItem, itemRects } = await extractPageTextAndRects(
    page,
    pageWidth
  );

  const rects: Rect[] = [];

  if (typeof search === 'string') {
    // Use robust multi-strategy matching
    const cleanedSearch = preprocessSearchText(search);

    console.log('[PdfHighlights] Using robust matcher for:', cleanedSearch);

    const matchResult = findRobustMatch(fullText, cleanedSearch, {
      similarityThreshold: 0.85,
      allowSkipReferences: true,
      tryAllStrategies: false,
      enablePartialMatch: true,
    });

    if (matchResult.found) {
      console.log(
        '[PdfHighlights] ✓ Match found using strategy:',
        matchResult.strategy
      );
      console.log(
        '[PdfHighlights] Confidence:',
        (matchResult.confidence * 100).toFixed(1) + '%'
      );

      const originalStart = matchResult.startIndex;
      const originalEnd = matchResult.endIndex;

      console.log('[PdfHighlights] Match positions:', {
        originalStart,
        originalEnd,
      });
      console.log(
        '[PdfHighlights] Matched text in PDF:',
        fullText.substring(originalStart, originalEnd).replace(/\n/g, '\\n')
      );

      // Get rectangles for this range - create individual rectangles per text item
      const startChar = charToItem[originalStart];
      const endChar = charToItem[originalEnd - 1];

      if (startChar && endChar) {
        const startItem = startChar.itemIndex;
        const endItem = endChar.itemIndex;

        // Create a rectangle for each text item in the range
        for (let ii = startItem; ii <= endItem; ii++) {
          const r = itemRects[ii];
          if (!r) continue;
          rects.push({
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
          });
        }
      }
    } else {
      console.warn('[PdfHighlights] ✗ No match found using robust matcher');
      console.warn('  - Search text:', cleanedSearch);
      console.warn('  - PDF text (first 500):', fullText.substring(0, 500));
    }
  } else {
    // RegExp search - use original approach
    const f =
      (search.flags.includes('g') ? search.flags : search.flags + 'g') +
      (options?.caseInsensitive && !search.flags.includes('i') ? 'i' : '');
    const re = new RegExp(search.source, f);

    let match: RegExpExecArray | null;
    while ((match = re.exec(fullText)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      const startChar = charToItem[start];
      const endChar = charToItem[end - 1];
      if (!startChar || !endChar) continue;

      const startItem = startChar.itemIndex;
      const endItem = endChar.itemIndex;

      for (let ii = startItem; ii <= endItem; ii++) {
        const r = itemRects[ii];
        if (!r) continue;
        rects.push({
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
        });
      }
    }
  }

  return rects;
}

export async function findMatchesInDocument(
  pdfDoc: PDFDocumentProxy,
  pageWidth: number,
  search: string | RegExp,
  options?: { caseInsensitive?: boolean; maxPages?: number }
): Promise<Record<number, Rect[]>> {
  const res: Record<number, Rect[]> = {};
  const pageCount = Math.min(
    pdfDoc.numPages || 0,
    options?.maxPages ?? pdfDoc.numPages ?? 0
  );
  for (let p = 1; p <= pageCount; p++) {
    try {
      const page = await pdfDoc.getPage(p);
      const rects = await findMatchesOnPage(page, pageWidth, search, options);
      if (rects.length) res[p] = rects;
    } catch (err) {
      console.error('Error processing page', p, err);
    }
  }
  return res;
}
