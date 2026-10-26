import { parseReportHtml } from './htmlContent';
import type { Report } from './types';
import { readReportTable } from './tables';

// Convert formatted text to plain text and retain link destinations.
function htmlToText(html: string, sourceUrl: string): string {
  const parsed = parseReportHtml(html);
  if (
    parsed.body.children.length === 1 &&
    parsed.body.firstElementChild?.tagName === 'PRE'
  ) {
    return parsed.body.firstElementChild.textContent ?? '';
  }

  parsed.body.querySelectorAll('table').forEach((table) => {
    table.replaceWith(
      parsed.createTextNode(`\n\n${tableToText(table, sourceUrl)}\n\n`)
    );
  });

  parsed.body.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href) return;

    const url = new URL(href, sourceUrl).href;
    const label = anchor.textContent?.trim() ?? '';

    anchor.textContent = label === url ? url : `${label} (${url})`;
  });

  parsed.body.querySelectorAll('br').forEach((element) => {
    element.replaceWith('\n');
  });

  parsed.body
    .querySelectorAll('h1, h2, h3, h4, p, div, section, li, ul, ol, tr')
    .forEach((element) => {
      element.append('\n\n');
    });

  return (parsed.body.textContent ?? '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function exportTxt(report: Report, underline?: '=' | '-'): string {
  const sections = report.sections.map(
    (section) =>
      `${section.title}\n${htmlToText(section.content, report.sourceUrl)}`
  );

  return [
    underline
      ? `${report.title}\n${underline.repeat(Math.min(report.title.length, 72))}`
      : report.title,
    ...report.metadata.map(
      (item) =>
        `${item.label}: ${item.value}${item.url ? ` (${item.url})` : ''}`
    ),
    ...sections,
  ].join('\n\n');
}

function tableToText(element: HTMLTableElement, sourceUrl: string): string {
  const table = readReportTable(element);
  if (!table.rows.length || !table.columnCount) return '';

  const expanded: string[][] = table.rows.map(() =>
    Array<string>(table.columnCount).fill('')
  );

  // Repeat merged cell content in every position it covers.
  table.rows.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell === null) return;

      const text = htmlToText(cell.html, sourceUrl).replace(/\s+/g, ' ').trim();

      for (let r = 0; r < cell.rowSpan; r += 1) {
        for (let c = 0; c < cell.colSpan; c += 1) {
          expanded[rowIndex + r][columnIndex + c] = text;
        }
      }
    });
  });

  let headerRows = table.headerRows;

  // Also recognize leading TH rows when THEAD is missing.
  if (headerRows === 0) {
    while (
      headerRows < table.rows.length &&
      table.rows[headerRows].every((cell) => cell === null || cell.header)
    ) {
      headerRows += 1;
    }
  }

  const headers = Array.from(
    { length: table.columnCount },
    (_, columnIndex) => {
      const labels = expanded
        .slice(0, headerRows)
        .map((row) => row[columnIndex])
        .filter((label) => label !== '');

      return [...new Set(labels)].join(' / ') || `Column ${columnIndex + 1}`;
    }
  );

  const dataRows = expanded.slice(headerRows);

  if (dataRows.length === 0) {
    return headers.join('\n');
  }

  return dataRows
    .map((row) =>
      row
        .map((value, columnIndex) => `${headers[columnIndex]}: ${value}`)
        .join('\n')
    )
    .join('\n\n');
}
