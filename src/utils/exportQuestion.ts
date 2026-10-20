import DOMPurify from 'dompurify';
import { prepareQueryForExecution } from '../helpers/fetch_query';
import type { Query } from '../constants/queries_chart_info';
import { getTemplateConfig } from '../constants/template_config';

import type {
  Content,
  ContentText,
  TableCell,
  TDocumentDefinitions,
} from 'pdfmake/interfaces';
import type { ParagraphChild } from 'docx';

export type ExportFormat = 'html' | 'txt' | 'pdf' | 'docx';

export interface ExportSections {
  explanation: boolean;
  requiredData: boolean;
  analysisMethod: boolean;
  charts: boolean;
  interpretation: boolean;
  sparql: boolean;
}

// Select the content once for every format.
function buildReport(
  query: Query,
  templateId: string,
  tabIndex: number,
  selected: ExportSections
) {
  const info = query.dataAnalysisInformation;
  const getContent = (value?: string | string[]) =>
    Array.isArray(value) ? (value[tabIndex] ?? '') : (value ?? '');

  const sections = [
    {
      enabled: selected.explanation,
      title: 'Question explanation',
      content: info.questionExplanation ?? '',
    },
    {
      enabled: selected.requiredData,
      title: 'Required data',
      content: getContent(info.requiredDataForAnalysis),
    },
    {
      enabled: selected.analysisMethod,
      title: 'Analysis method',
      content: getContent(info.dataAnalysis),
    },
    {
      enabled: selected.interpretation,
      title: 'Interpretation',
      content: getContent(info.dataInterpretation),
    },
  ];

  if (selected.sparql) {
    const queries = (
      tabIndex === 1 && query.uid_2
        ? [query.sparqlQuery2]
        : [
            query.sparqlQuery,
            ...(query.uid_2_merge ? [query.sparqlQuery2] : []),
          ]
    ).filter((sparql): sparql is string => Boolean(sparql?.trim()));

    queries.forEach((sparql, index) => {
      sections.push({
        enabled: true,
        title:
          queries.length > 1 ? `SPARQL query ${index + 1}` : 'SPARQL query',
        content: `<pre><code>${escapeHtml(prepareQueryForExecution(sparql))}</code></pre>`,
      });
    });
  }

  return {
    title: `${query.id}. ${info.question}`,
    theme: getTemplateConfig(templateId).title,
    templateId,
    tabNumber: tabIndex + 1,
    sourceUrl: window.location.href,
    templateUrl: `https://orkg.org/template/${encodeURIComponent(templateId)}`,
    sections: sections
      .filter((section) => section.enabled && section.content.trim())
      .map((section) => ({
        title: section.title,
        content: DOMPurify.sanitize(section.content, {
          USE_PROFILES: { html: true },
        }),
      })),
  };
}

type Report = ReturnType<typeof buildReport>;

function parseReportHtml(html: string): Document {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  parsed.querySelectorAll('style, script, template').forEach((element) => {
    element.remove();
  });
  return parsed;
}

type HtmlBlock =
  | { kind: 'text'; html: string }
  | { kind: 'table'; table: ReturnType<typeof readReportTable> };

function splitHtmlBlocks(html: string): HtmlBlock[] {
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

function hasWideTable(report: Report): boolean {
  return report.sections.some((section) =>
    Array.from(parseReportHtml(section.content).querySelectorAll('table')).some(
      (table) => readReportTable(table).columnCount > 8
    )
  );
}

function escapeHtml(text: string): string {
  const element = document.createElement('span');
  element.textContent = text;
  return element.innerHTML;
}

// Generate HTML while preserving formatted section content.
function exportHtml(report: Report, chartSvg?: string): string {
  const sections = report.sections
    .map(
      (section) =>
        `<section>
          <h2>${escapeHtml(section.title)}</h2>
          ${section.content}
        </section>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(report.title)}</title>
  <style>
    body {
      max-width: 900px;
      margin: 40px auto;
      padding: 0 24px;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #222;
    }
    h1, h2 { color: #b84040; }
    a { overflow-wrap: anywhere; }
    img { max-width: 100%; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; }
    table { border-collapse: collapse; max-width: 100%; }
    th, td { border: 1px solid #ccc; padding: 8px; }
    .export-chart { overflow-x: auto; }
    .export-chart svg {
      display: block;
      max-width: 100%;
      height: auto;
    }

    .report-chart {
      margin: 24px 0;
    }

    .chart-controls:not([hidden]) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .chart-controls button {
      padding: 8px 16px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  <p>${escapeHtml(report.theme)} · Template ID: ${escapeHtml(report.templateId)}</p>
  <p>Scope: current tab (${report.tabNumber})</p>
  <p>
    <a href="${encodeURI(report.sourceUrl).replace(/"/g, '%22').replace(/&/g, '&amp;')}">Source question</a> ·
    <a href="${report.templateUrl}">ORKG template</a>
  </p>
  ${sections}
  ${
    chartSvg
      ? `
  <section class="export-chart">
    <h2>Chart</h2>
    ${chartSvg}
    <nav class="chart-controls" aria-label="Detailed charts" hidden>
      <button type="button" data-chart-step="-1" aria-label="Previous chart">
        ←
      </button>
      <span data-chart-counter role="status" aria-live="polite"></span>
      <button type="button" data-chart-step="1" aria-label="Next chart">
        →
      </button>
    </nav>
  </section>
`
      : ''
  }
  ${
    chartSvg
      ? `<script>
  const section = document.querySelector('.export-chart');
  const charts = Array.from(
    section.querySelectorAll('[data-chart-kind="detail"]')
  );
  const controls = section.querySelector('.chart-controls');

  if (charts.length > 1) {
    let current = 0;

    const showChart = (index) => {
      current = (index + charts.length) % charts.length;

      charts.forEach((chart, i) => {
        chart.hidden = i !== current;
      });

      controls.querySelector('[data-chart-counter]').textContent =
        (current + 1) + ' / ' + charts.length;
    };

    controls.querySelectorAll('[data-chart-step]').forEach((button) => {
      button.addEventListener('click', () => {
        showChart(current + Number(button.dataset.chartStep));
      });
    });

    showChart(0);
    controls.hidden = false;
  }
</script>`
      : ''
  }
</body>
</html>`;
}

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

function exportTxt(report: Report): string {
  const sections = report.sections.map(
    (section) =>
      `${section.title}\n${htmlToText(section.content, report.sourceUrl)}`
  );

  return [
    report.title,
    `${report.theme} · Template ID: ${report.templateId}`,
    `Scope: current tab (${report.tabNumber})`,
    `Source question: ${report.sourceUrl}`,
    `ORKG template: ${report.templateUrl}`,
    ...sections,
  ].join('\n\n');
}

// Preserve text and links from the existing HTML sections.
function htmlToLinkedText(html: string, sourceUrl: string): ContentText[] {
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
  return content;
}

interface ReportTableCell {
  html: string;
  header: boolean;
  rowSpan: number;
  colSpan: number;
}

function readReportTable(table: HTMLTableElement) {
  const htmlRows = Array.from(table.rows);
  const rows: (ReportTableCell | null)[][] = htmlRows.map(() => []);

  htmlRows.forEach((row, rowIndex) => {
    let column = 0;

    Array.from(row.cells).forEach((cell) => {
      // Skip positions occupied by cells from previous rows.
      while (rows[rowIndex][column] !== undefined) {
        column += 1;
      }

      const groupRows = Array.from(row.parentElement?.children ?? []);
      const remainingGroupRows = groupRows.length - groupRows.indexOf(row);

      const rowSpan = Math.min(
        cell.rowSpan === 0 ? remainingGroupRows : cell.rowSpan,
        htmlRows.length - rowIndex
      );
      const colSpan = cell.colSpan;

      // Reserve all positions covered by the merged cell.
      for (let r = 0; r < rowSpan; r += 1) {
        for (let c = 0; c < colSpan; c += 1) {
          rows[rowIndex + r][column + c] = null;
        }
      }

      rows[rowIndex][column] = {
        html: cell.innerHTML,
        header: cell.tagName === 'TH',
        rowSpan,
        colSpan,
      };

      column += colSpan;
    });
  });

  const columnCount = Math.max(0, ...rows.map((row) => row.length));

  // Keep every row rectangular, including empty positions.
  for (const row of rows) {
    for (let column = 0; column < columnCount; column += 1) {
      if (row[column] === undefined) {
        row[column] = {
          html: '',
          header: false,
          rowSpan: 1,
          colSpan: 1,
        };
      }
    }
  }

  return {
    rows,
    columnCount,
    headerRows: table.tHead?.rows.length ?? 0,
  };
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

function htmlToPdfBlocks(html: string, sourceUrl: string): Content[] {
  return splitHtmlBlocks(html).map<Content>((block) => {
    if (block.kind === 'text') {
      return {
        text: htmlToLinkedText(block.html, sourceUrl),
        margin: [0, 0, 0, 8],
      };
    }

    const { table } = block;
    const body: TableCell[][] = table.rows.map((row) =>
      row.map(
        (cell): TableCell =>
          cell === null
            ? {}
            : {
                text: htmlToLinkedText(cell.html, sourceUrl),
                rowSpan: cell.rowSpan,
                colSpan: cell.colSpan,
                bold: cell.header,
                fillColor: cell.header ? '#eeeeee' : undefined,
              }
      )
    );

    return {
      table: {
        headerRows: table.headerRows,
        widths: Array(table.columnCount).fill('*'),
        body,
      },
      fontSize: table.columnCount > 8 ? 8 : 10,
      lineHeight: 1,
      margin: [0, 8, 0, 12],
    };
  });
}

async function chartsToPng(chartHtml: string) {
  const container = document.createElement('div');
  container.innerHTML = chartHtml;
  const figures = container.querySelectorAll('figure.report-chart');

  if (!figures.length) {
    throw new Error('No charts available for export.');
  }

  const images = [];

  for (const figure of figures) {
    const svg = figure.querySelector('svg');
    if (!svg) throw new Error('Chart SVG is missing.');

    const content = new XMLSerializer().serializeToString(svg);
    const imageSrc =
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(content);

    const image = new Image();
    image.src = imageSrc;
    await image.decode();

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('Chart dimensions are missing.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth * 2;
    canvas.height = image.naturalHeight * 2;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable.');

    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    images.push({
      title: figure.querySelector('h3')?.textContent?.trim() ?? '',
      dataUrl: canvas.toDataURL('image/png'),
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
  }

  return images;
}

async function exportPdf(report: Report, chartHtml?: string): Promise<Blob> {
  const charts = chartHtml ? await chartsToPng(chartHtml) : [];
  // Load the PDF library and embedded fonts only when PDF is requested.
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);

  pdfMake.addVirtualFileSystem(fonts);

  const landscape = hasWideTable(report);

  const definition: TDocumentDefinitions = {
    pageOrientation: landscape ? 'landscape' : 'portrait',
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 11,
      lineHeight: 1.3,
    },
    content: [
      {
        text: report.title,
        fontSize: 20,
        bold: true,
        color: '#b84040',
        margin: [0, 0, 0, 14],
      },
      {
        text: `${report.theme} · Template ID: ${report.templateId}`,
        margin: [0, 0, 0, 6],
      },
      {
        text: `Scope: current tab (${report.tabNumber})`,
        margin: [0, 0, 0, 6],
      },
      {
        text: [
          {
            text: 'Source question',
            link: report.sourceUrl,
            color: '#245a9c',
            decoration: 'underline',
          },
          { text: ' · ' },
          {
            text: 'ORKG template',
            link: report.templateUrl,
            color: '#245a9c',
            decoration: 'underline',
          },
        ],
        margin: [0, 0, 0, 16],
      },
      ...report.sections.flatMap((section): Content[] => [
        {
          text: section.title,
          fontSize: 14,
          bold: true,
          color: '#b84040',
          margin: [0, 12, 0, 6],
          headlineLevel: 1,
        },
        ...htmlToPdfBlocks(section.content, report.sourceUrl),
      ]),
      ...charts.map(
        (chart): Content => ({
          unbreakable: true,
          stack: [
            {
              text: chart.title || 'Chart',
              fontSize: 14,
              bold: true,
              margin: [0, 12, 0, 6],
            },
            {
              image: chart.dataUrl,
              fit: landscape ? [760, 440] : [515, 650],
              margin: [0, 0, 0, 12],
            },
          ],
        })
      ),
    ],
    pageBreakBefore: (currentNode, nodeContainer) =>
      currentNode.headlineLevel === 1 &&
      nodeContainer.getFollowingNodesOnPage().length === 0,
  };

  return pdfMake.createPdf(definition).getBlob();
}

async function exportDocx(report: Report, chartHtml?: string): Promise<Blob> {
  const {
    Document,
    Paragraph,
    TextRun,
    ExternalHyperlink,
    HeadingLevel,
    Packer,
    Table,
    TableRow,
    TableCell,
    WidthType,
    TableLayoutType,
    PageOrientation,
    ImageRun,
  } = await import('docx');
  const charts = chartHtml ? await chartsToPng(chartHtml) : [];

  const landscape = hasWideTable(report);

  const createLink = (label: string, url: string) =>
    new ExternalHyperlink({
      link: url,
      children: [
        new TextRun({
          text: label,
          style: 'Hyperlink',
        }),
      ],
    });

  const createParagraph = (html: string, fontSize = 22, bold = false) =>
    new Paragraph({
      spacing: { after: 80 },
      children: htmlToLinkedText(
        html,
        report.sourceUrl
      ).flatMap<ParagraphChild>((part) => {
        const text = typeof part.text === 'string' ? part.text : '';

        const runs = text.split('\n').map(
          (line, index) =>
            new TextRun({
              text: line,
              break: index > 0 ? 1 : 0,
              size: part.fontSize ? part.fontSize * 2 : fontSize,
              bold,
              ...(part.link ? { style: 'Hyperlink' } : {}),
            })
        );

        return part.link
          ? [
              new ExternalHyperlink({
                link: part.link,
                children: runs,
              }),
            ]
          : runs;
      }),
    });

  const createContent = (html: string) =>
    splitHtmlBlocks(html).flatMap<
      InstanceType<typeof Paragraph> | InstanceType<typeof Table>
    >((block) => {
      if (block.kind === 'text') {
        return [createParagraph(block.html)];
      }

      const { table } = block;
      const availableWidth = (landscape ? 16838 : 11906) - 1600;
      return [
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          layout: TableLayoutType.FIXED,
          columnWidths: Array(table.columnCount).fill(
            Math.floor(availableWidth / table.columnCount)
          ),
          margins: {
            top: 60,
            bottom: 60,
            left: 60,
            right: 60,
          },
          rows: table.rows.map(
            (row, rowIndex) =>
              new TableRow({
                tableHeader: rowIndex < table.headerRows,
                children: row
                  .filter((cell) => cell !== null)
                  .map(
                    (cell) =>
                      new TableCell({
                        columnSpan: cell.colSpan,
                        rowSpan: cell.rowSpan,
                        shading: cell.header ? { fill: 'EEEEEE' } : undefined,
                        children: [
                          createParagraph(
                            cell.html,
                            table.columnCount > 8 ? 16 : 20,
                            cell.header
                          ),
                        ],
                      })
                  ),
              })
          ),
        }),
        new Paragraph({ text: '' }),
      ];
    });

  const sections = report.sections.flatMap((section) => [
    new Paragraph({
      text: section.title,
      heading: HeadingLevel.HEADING_1,
      keepNext: true,
      spacing: { before: 240, after: 120 },
    }),
    ...createContent(section.content),
  ]);

  const chartParagraphs = charts.flatMap((chart) => {
    const scale = Math.min(
      (landscape ? 1000 : 680) / chart.width,
      (landscape ? 550 : 850) / chart.height,
      1
    );

    const data = Uint8Array.from(
      atob(chart.dataUrl.split(',')[1]),
      (character) => character.charCodeAt(0)
    );

    return [
      new Paragraph({
        text: chart.title || 'Chart',
        heading: HeadingLevel.HEADING_2,
        keepNext: true,
      }),
      new Paragraph({
        children: [
          new ImageRun({
            type: 'png',
            data,
            transformation: {
              width: Math.round(chart.width * scale),
              height: Math.round(chart.height * scale),
            },
          }),
        ],
        keepLines: true,
        spacing: { after: 240 },
      }),
    ];
  });

  const document = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22,
          },
          paragraph: {
            spacing: { after: 120 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
              orientation: landscape
                ? PageOrientation.LANDSCAPE
                : PageOrientation.PORTRAIT,
            },
            margin: {
              top: 800,
              bottom: 800,
              left: 800,
              right: 800,
            },
          },
        },
        children: [
          new Paragraph({
            text: report.title,
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            text: `${report.theme} · Template ID: ${report.templateId}`,
          }),
          new Paragraph({
            text: `Scope: current tab (${report.tabNumber})`,
          }),
          new Paragraph({
            children: [
              createLink('Source question', report.sourceUrl),
              new TextRun(' · '),
              createLink('ORKG template', report.templateUrl),
            ],
          }),
          ...sections,
          ...chartParagraphs,
        ],
      },
    ],
  });

  return Packer.toBlob(document);
}

function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string
): void {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], {
          type: `${mimeType};charset=utf-8`,
        });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportQuestion(
  query: Query,
  templateId: string,
  tabIndex: number,
  sections: ExportSections,
  format: ExportFormat,
  chartSvg?: string
): Promise<void> {
  if (format !== 'txt' && sections.charts && !chartSvg) {
    throw new Error('No chart available for export.');
  }

  const report = buildReport(query, templateId, tabIndex, sections);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `Q${query.id}_${date}.${format}`;

  switch (format) {
    case 'html':
      downloadFile(
        exportHtml(report, sections.charts ? chartSvg : undefined),
        filename,
        'text/html'
      );
      break;
    case 'txt':
      downloadFile(exportTxt(report), filename, 'text/plain');
      break;
    case 'pdf':
      downloadFile(
        await exportPdf(report, sections.charts ? chartSvg : undefined),
        filename,
        'application/pdf'
      );
      break;

    case 'docx':
      downloadFile(
        await exportDocx(report, sections.charts ? chartSvg : undefined),
        filename,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      break;
  }
}
