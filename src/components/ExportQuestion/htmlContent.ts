import { readReportTable } from './tables';
import type { ContentText } from 'pdfmake/interfaces';

export function parseReportHtml(html: string): Document {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  parsed.querySelectorAll('style, script, template').forEach((element) => {
    element.remove();
  });
  return parsed;
}

type HtmlBlock =
  | { kind: 'text'; html: string }
  | { kind: 'table'; table: ReturnType<typeof readReportTable> };

export function splitHtmlBlocks(html: string): HtmlBlock[] {
  const parsed = parseReportHtml(html);
  const blocks: HtmlBlock[] = [];
  const pending = document.createElement('div');

  const flushText = () => {
    if (pending.textContent?.trim()) {
      blocks.push({ kind: 'text', html: pending.innerHTML });
    }
    pending.replaceChildren();
  };

  const visit = (node: Node): void => {
    if (node instanceof HTMLTableElement) {
      flushText();
      const table = readReportTable(node);
      if (table.rows.length && table.columnCount) {
        blocks.push({ kind: 'table', table });
      }
    } else if (
      node instanceof Element &&
      node.matches('p, h1, h2, h3, h4, h5, h6, pre, blockquote') &&
      !node.querySelector('table')
    ) {
      flushText();
      pending.append(node.cloneNode(true));
      flushText();
    } else if (node instanceof Element && node.querySelector('table')) {
      node.childNodes.forEach(visit);
    } else {
      pending.append(node.cloneNode(true));
    }
  };

  parsed.body.childNodes.forEach(visit);
  flushText();
  return blocks;
}

export function escapeHtml(text: string): string {
  const element = document.createElement('span');
  element.textContent = text;
  return element.innerHTML;
}

// Preserve text and links from the existing HTML sections.
export function htmlToLinkedText(
  html: string,
  sourceUrl: string
): ContentText[] {
  const parsed = parseReportHtml(html);
  const content: ContentText[] = [];

  const visit = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      content.push({ text: (node.textContent ?? '').replace(/\s+/g, ' ') });
      return;
    }

    if (!(node instanceof Element)) return;

    if (node.tagName === 'PRE') {
      content.push({
        text: node.textContent ?? '',
        fontSize: 9,
        preserveLeadingSpaces: true,
      });
      return;
    }

    if (node.tagName === 'BR') {
      content.push({ text: '\n' });
      return;
    }

    if (node.tagName === 'A') {
      const href = node.getAttribute('href');

      if (href) {
        content.push({
          text: node.textContent ?? '',
          link: new URL(href, sourceUrl).href,
          color: '#245a9c',
          decoration: 'underline',
          noWrap: true,
        });
        return;
      }
    }

    node.childNodes.forEach(visit);

    if (node.matches('p, div, li, ul, ol, h1, h2, h3, h4, tr')) {
      content.push({ text: '\n\n' });
    } else if (node.matches('th, td')) {
      content.push({ text: '  ' });
    }
  };

  parsed.body.childNodes.forEach(visit);

  while (content.length) {
    const last = content[content.length - 1];

    if (typeof last.text !== 'string' || last.text.trim()) {
      break;
    }

    content.pop();
  }

  return content;
}
