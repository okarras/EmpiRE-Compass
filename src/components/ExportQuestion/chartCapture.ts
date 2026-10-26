import type { ChartImage } from './types';
import { chartsToPng } from './png';
import { buildSvgChartFigure } from './svg';

export async function getMainChartImages(chartHtml?: string | ChartImage[]) {
  if (Array.isArray(chartHtml)) return chartHtml;
  return chartHtml ? chartsToPng(chartHtml, false, true) : [];
}

export function getDynamicChartElements(frame?: HTMLIFrameElement | null) {
  const chartDocument = frame?.contentDocument;
  if (!chartDocument || chartDocument.readyState !== 'complete') {
    throw new Error('The generated chart is not ready for export.');
  }
  const elements = Array.from(
    chartDocument.querySelectorAll('canvas, svg')
  ).filter((element) => {
    const { width, height } = element.getBoundingClientRect();
    return (
      width > 0 &&
      height > 0 &&
      !element.parentElement?.closest('svg') &&
      chartDocument.defaultView?.getComputedStyle(element).visibility !==
        'hidden'
    );
  });
  if (!elements.length) throw new Error('No canvas or SVG chart found.');
  return elements;
}

export function supportsDynamicSvgExport(
  frame?: HTMLIFrameElement | null
): boolean {
  try {
    return getDynamicChartElements(frame).every(
      (element) => element.localName === 'svg'
    );
  } catch {
    return false;
  }
}

export async function captureDynamicCharts(
  frame?: HTMLIFrameElement | null
): Promise<ChartImage[]> {
  const elements = getDynamicChartElements(frame);
  const images: ChartImage[] = [];
  for (const [index, element] of elements.entries()) {
    const title =
      elements.length === 1
        ? 'AI-Generated Chart'
        : `AI-Generated Chart ${index + 1}`;
    if (element.localName === 'svg') {
      const figure = buildSvgChartFigure(element as SVGSVGElement, title);
      images.push(...(await chartsToPng(figure.outerHTML)));
      continue;
    }
    const source = element as HTMLCanvasElement;
    if (!source.width || !source.height)
      throw new Error('Chart dimensions are missing.');
    // Wait for the existing drawing to settle without rerunning the chart calculation.
    let previous = '';
    let stableFrames = 0;
    for (let attempt = 0; attempt < 120 && stableFrames < 3; attempt += 1) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );
      const current = source.toDataURL('image/png');
      stableFrames = current === previous ? stableFrames + 1 : 0;
      previous = current;
    }
    if (stableFrames < 3)
      throw new Error(
        'The chart is still changing. Please wait and try again.'
      );
    const pixels = source
      .getContext('2d')
      ?.getImageData(0, 0, source.width, source.height).data;
    if (
      pixels &&
      !pixels.some((value, index) => index % 4 === 3 && value > 0)
    ) {
      throw new Error('The generated chart is not ready for export.');
    }
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0);
    images.push({
      title,
      display: null,
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    });
    canvas.width = 0;
    canvas.height = 0;
  }
  return images;
}
