import type {
  PDFDocumentProxy,
  PDFPageProxy,
  TextContent,
} from 'pdfjs-dist/types/src/display/api';

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
  const yTopPdf = yBaselinePdf;
  const yBottomPdf = yBaselinePdf + fontHeight;

  const wPdf =
    (item.width as number) ??
    Math.max(1, fontHeight * (item.str?.length ?? 1) * 0.5);
  const hPdf = fontHeight;

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

  const tweakFactor = 0.12;
  const tweak = hPdf * tweakFactor * (viewport.scale ?? 1);

  top = Math.max(0, top - tweak);
  const widthPx = right - left;
  const heightPx = bottom - top;

  return { left, top, width: widthPx, height: heightPx };
}

export async function extractPageTextAndRects(
  page: PDFPageProxy,
  pageWidth: number
): Promise<{
  fullText: string;
  charToItem: { itemIndex: number; offsetInItem: number }[];
  items: PdfTextItem[];
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

  return { fullText, charToItem, items, itemRects };
}

export async function findMatchesOnPage(
  page: PDFPageProxy,
  pageWidth: number,
  search: string | RegExp,
  options?: { caseInsensitive?: boolean }
): Promise<Rect[]> {
  const { fullText, charToItem, items, itemRects } =
    await extractPageTextAndRects(page, pageWidth);

  const flags = options?.caseInsensitive ? 'gi' : 'g';
  let re: RegExp;
  if (typeof search === 'string') {
    const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    re = new RegExp(esc, flags);
  } else {
    const f =
      (search.flags.includes('g') ? search.flags : search.flags + 'g') +
      (options?.caseInsensitive && !search.flags.includes('i') ? 'i' : '');
    re = new RegExp(search.source, f);
  }

  const rects: Rect[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(fullText)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    const startChar = charToItem[start];
    const endChar = charToItem[end - 1];
    if (!startChar || !endChar) {
      continue;
    }
    const startItem = startChar.itemIndex;
    const endItem = endChar.itemIndex;

    let left = Number.POSITIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;

    for (let ii = startItem; ii <= endItem; ii++) {
      const r = itemRects[ii];
      if (!r) continue;
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.left + r.width);
      bottom = Math.max(bottom, r.top + r.height);
    }

    if (!isFinite(left)) continue;
    rects.push({ left, top, width: right - left, height: bottom - top });
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
