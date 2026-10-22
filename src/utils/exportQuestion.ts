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

export type ExportChartMode = 'relative' | 'absolute' | 'both';

export type ExportFormat = 'html' | 'txt' | 'pdf' | 'docx' | 'svg' | 'png';

export interface ExportSections {
  explanation: boolean;
  requiredData: boolean;
  analysisMethod: boolean;
  charts: boolean;
  interpretation: boolean;
  sparql: boolean;
}

export interface ExportChartGroup {
  tabIndex: number;
  normalized: boolean;
  html: string;
}

export interface QuestionHtmlExport {
  query: Query;
  chartGroups: ExportChartGroup[];
}

function getExportTab(query: Query, index: number) {
  const secondary = index === 1;
  const name = (
    secondary ? query.tabs?.tab2_name : query.tabs?.tab1_name
  )?.trim();
  const chartSettings = secondary ? query.chartSettings2 : query.chartSettings;
  return {
    name,
    label: name || (secondary ? 'Data Analysis' : 'Data Collection'),
    id: (secondary ? query.uid_2 : query.uid) || `tab-${index + 1}`,
    chartSettings,
    supportsNormalization: !chartSettings?.doesntHaveNormalization,
  };
}

export function getExportChartModes(
  query: Query,
  tabIndex: number,
  mode: ExportChartMode,
  firstNormalized = true
): boolean[] {
  if (!getExportTab(query, tabIndex).supportsNormalization) return [false];
  return mode === 'both'
    ? [firstNormalized, !firstNormalized]
    : [mode === 'relative'];
}

function requireChartGroup(
  groups: ExportChartGroup[],
  tabIndex: number,
  normalized?: boolean,
  message = 'Chart capture is missing for a report tab.'
): ExportChartGroup {
  const group = groups.find(
    (item) =>
      item.tabIndex === tabIndex &&
      (normalized === undefined || item.normalized === normalized)
  );
  if (!group) throw new Error(message);
  return group;
}

// Select the content once for every format.
function buildReport(
  query: Query,
  templateId: string,
  tabIndex: number,
  selected: ExportSections,
  format: ExportFormat,
  normalized: boolean,
  exportedAt: Date
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
    const sparql =
      tabIndex === 1 && query.uid_2 ? query.sparqlQuery2 : query.sparqlQuery;
    if (sparql?.trim()) {
      sections.push({
        enabled: true,
        title: 'SPARQL query',
        content: `<pre><code>${escapeHtml(prepareQueryForExecution(sparql))}</code></pre>`,
      });
    }
  }

  const sourceUrl = `https://empire-compass.tib.eu/${encodeURIComponent(templateId)}/questions/${encodeURIComponent(String(query.id))}`;
  const tab = getExportTab(query, tabIndex);
  const hasCharts =
    format !== 'txt' && selected.charts && Boolean(tab.chartSettings);
  const chartDisplay = !tab.supportsNormalization
    ? 'Absolute'
    : format === 'html'
      ? 'Relative / Absolute (switchable)'
      : normalized
        ? 'Relative'
        : 'Absolute';

  const metadata: { label: string; value: string; url?: string }[] = [
    {
      label: 'Theme',
      value: getTemplateConfig(templateId).title,
      url: `https://orkg.org/template/${encodeURIComponent(templateId)}`,
    },
    ...(tab.name ? [{ label: 'Analysis', value: tab.name }] : []),
    ...(hasCharts ? [{ label: 'Chart display', value: chartDisplay }] : []),
    { label: 'Export date', value: exportedAt.toLocaleDateString('en-GB') },
    {
      label: 'Source question',
      value: `Question ${query.id}`,
      url: sourceUrl,
    },
  ];

  return {
    title: `${query.id}. ${info.question}`,
    metadata,
    sourceUrl,
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

function getReportSections(report: Report, hasCharts: boolean) {
  const sections = [...report.sections];
  if (
    hasCharts &&
    !sections.some((section) => section.title === 'Interpretation')
  ) {
    const index = sections.findIndex((section) =>
      section.title.startsWith('SPARQL query')
    );
    sections.splice(index < 0 ? sections.length : index, 0, {
      title: 'Interpretation',
      content: '',
    });
  }
  return sections;
}

function getSparqlUrl(sparql: string): string {
  return `https://orkg.org/sparql#${encodeURIComponent(sparql)}`;
}

function getSectionQuery(section: Report['sections'][number]) {
  return section.title.startsWith('SPARQL query')
    ? parseReportHtml(section.content).querySelector('code')?.textContent
    : null;
}

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

function escapeHtml(text: string): string {
  const element = document.createElement('span');
  element.textContent = text;
  return element.innerHTML;
}

// Generate HTML while preserving formatted section content.
function exportHtml(
  tabs: { label: string; report: Report; charts?: string }[],
  activeTab: number,
  collection?: {
    title: string;
    questions: { id: number; title: string; html: string }[];
  }
): string {
  const report = (tabs[activeTab] ?? tabs[0]).report;
  const renderTab = (report: Report, chartSvg?: string): string => {
    const orderedSections = getReportSections(report, Boolean(chartSvg)).map(
      (section) => ({
        ...section,
        title: sectionTitles[section.title] ?? section.title,
      })
    );

    const charts = chartSvg
      ? `
      ${chartSvg}
      <nav class="chart-controls" aria-label="Detailed charts" hidden>
        <button type="button" data-chart-step="-1" aria-label="Previous chart">
          <
        </button>
        <span data-chart-counter role="status" aria-live="polite"></span>
        <button type="button" data-chart-step="1" aria-label="Next chart">
          >
        </button>
      </nav>
    `
      : '';

    const sections = orderedSections
      .map((section) => {
        const containsCharts =
          section.title === 'Data Interpretation' && Boolean(chartSvg);

        const sparql = getSectionQuery(section);

        const queryLink = sparql
          ? `<p>
        <a
          class="sparql-link"
          href="${escapeHtml(getSparqlUrl(sparql))}"
          target="_blank"
          rel="noopener noreferrer"
        >Open query in ORKG</a>
      </p>`
          : '';

        return `
        <section${containsCharts ? ' class="export-chart"' : ''}>
          <h2>${escapeHtml(section.title)}</h2>
          ${queryLink}
          ${containsCharts ? charts : ''}
          ${section.content}
        </section>
      `;
      })
      .join('\n');

    return `
  ${report.metadata
    .map(
      (item) => `<p>
        <strong>${escapeHtml(item.label)}:</strong>
        ${
          item.url
            ? `<a href="${escapeHtml(item.url).replace(/"/g, '&quot;')}">${escapeHtml(item.value)}</a>`
            : escapeHtml(item.value)
        }
      </p>`
    )
    .join('\n')}
  ${sections}
`;
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(collection?.title ?? report.title)}</title>
  <style>
    html {
      background: #f5f5f5;
    }

    .sparql-link {
      display: inline-block;
      padding: 8px 14px;
      border: 1px solid #e86161;
      border-radius: 6px;
      color: #e86161;
      text-decoration: none;
      font-size: 14px;
    }

    .sparql-link:hover {
      background: #fff3f3;
    }

    body {
      box-sizing: border-box;
      width: calc(100% - 32px);
      max-width: 1200px;
      margin: 40px auto;
      font-family: "Roboto", "Helvetica", "Arial", sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: rgba(0, 0, 0, 0.87);
    }
    .report-content {
      padding: 32px;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 16px;
    }

    .report-content [data-report-tab] > p {
      margin: 4px 0;
      font-size: 14px;
      color: #666;
    }

    h1, h2 {
      color: #e86161;
      line-height: 1.4;
    }

    h1 {
      margin: 0 0 32px;
      padding-bottom: 12px;
      border-bottom: 4px solid #e86161;
      color: #e86161;
      font-size: 40px;
      font-weight: 700;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    body > p {
      margin: 4px 0;
      font-size: 14px;
      color: #666;
    }

    section {
      margin-top: 24px;
      overflow-x: auto;
    }

    section + section {
      padding-top: 24px;
      border-top: 1px solid #eee;
    }

    h2 {
      margin: 0 0 12px;
      font-size: 18px;
      font-weight: 700;
    }

    h3 {
      margin: 24px 0 12px;
      font-size: 18px;
      line-height: 1.4;
    }

    p {
      margin: 0 0 16px;
    }

    section > :last-child {
      margin-bottom: 0;
    }

    @media (max-width: 600px) {
      body {
        margin: 16px auto;
      }
      .report-content {
          padding: 20px;
        }

      h1 {
        font-size: 24px;
      }
    }

    a {
      color: #245a9c;
      overflow-wrap: anywhere;
    }

    img {
      max-width: 100%;
    }

    pre {
      padding: 16px;
      background: #f5f7f9;
      border: 1px solid #e1e5e9;
      border-radius: 6px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    table {
      border-collapse: collapse;
      min-width: 100%;
      margin: 20px 0;
    }

    body table th,
    body table td,
    body table.tg th,
    body table.tg td {
      padding: 10px 12px;
      border: 1px solid #d8dee5;
      font-family: inherit;
      font-size: 13px;
      line-height: 1.45;
      vertical-align: middle;
    }

    body table th {
      background: #eef2f6;
      font-weight: bold;
    }

    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .export-chart svg {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
    }

    .report-chart h3 {
      text-align: center;
    }

    .report-chart {
      margin: 24px 0;
    }

    .detail-chart-frame {
      position: relative;
      padding: 0 48px 32px;
    }

    .chart-controls:not([hidden]) {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: none;
    }

    .chart-controls button {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: 1px solid #eee;
      border-radius: 50%;
      background: #fff;
      color: #777;
      box-shadow: 0 2px 4px #0002;
      font-size: 30px;
      line-height: 1;
      cursor: pointer;
      pointer-events: auto;
    }

    .chart-controls button:hover {
      background: #eee;
      color: #333;
    }

    .chart-controls button:focus-visible {
      outline: 2px solid #e86161;
    }

    .chart-controls [data-chart-counter] {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      color: #777;
      font-size: 13px;
    }
    .chart-options {
      margin: 20px 0 28px;
    }

    .chart-options > p {
      margin: 0 0 12px;
      color: #666;
      font-size: 16px;
    }

    .chart-mode-buttons {
      display: inline-flex;
      overflow: hidden;
      border: 1px solid #ddd;
      border-radius: 10px;
    }

    .chart-mode-buttons button {
      padding: 8px 10px;
      border: 0;
      background: #fafafa;
      color: #999;
      font: inherit;
      cursor: pointer;
      font-size: 14px;
    }

    .chart-mode-buttons button + button {
      border-left: 1px solid #ddd;
    }

    .chart-mode-buttons button:hover {
      background: #f0f0f0;
      color: #666;
    }

    .chart-mode-buttons button[aria-pressed="true"] {
      background: #d5d5d5;
      color: #222;
      font-weight: 600;
    }

    .chart-mode-buttons button:focus-visible {
      outline: 2px solid #e86161;
      outline-offset: -3px;
    }
    .collection-question {
      margin-top: 48px;
      scroll-margin-top: 24px;
    }

    .collection-question > h2 {
      font-size: 28px;
      padding-bottom: 12px;
      border-bottom: 3px solid #e86161;
    }

    .report-contents {
      margin-bottom: 32px;
    }

    .report-contents li {
      margin: 8px 0;
    }

    .report-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      overflow-x: auto;
    }

    .report-tabs button {
      padding: 12px 16px;
      border: 0;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: #666;
      font: inherit;
      text-transform: uppercase;
      white-space: nowrap;
      cursor: pointer;
    }

    .report-tabs button[aria-pressed="true"] {
      border-bottom-color: #e86161;
      color: #e86161;
    }

    .report-tabs button:focus-visible {
      outline: 2px solid #e86161;
      outline-offset: -2px;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(collection?.title ?? report.title)}</h1>
  ${
    collection
      ? `<nav class="report-content report-contents" aria-label="Contents">
    <h2>Contents</h2>
    <ol>${collection.questions.map((question) => `<li value="${question.id}"><a href="#question-${question.id}">${escapeHtml(question.title)}</a></li>`).join('\n')}</ol>
  </nav>
  ${collection.questions.map((question) => question.html).join('\n')}`
      : `
  ${
    tabs.length > 1
      ? `<nav class="report-tabs" aria-label="Question analyses">
        ${tabs.map((tab, index) => `<button type="button" data-report-target="${index}" aria-pressed="${index === activeTab}">${escapeHtml(tab.label)}</button>`).join('\n')}
      </nav>`
      : ''
  }
  <main class="report-content">
  ${tabs
    .map(
      (
        tab,
        index
      ) => `<div data-report-tab="${index}"${index === activeTab ? '' : ' hidden'}>
        ${renderTab(tab.report, tab.charts)}
      </div>`
    )
    .join('\n')}
  </main>`
  }
  ${
    collection
      ? ''
      : `<script>
{
const root = document.currentScript.closest('[data-question-report]') || document;
const panels = Array.from(root.querySelectorAll('[data-report-tab]'));
const tabButtons = Array.from(root.querySelectorAll('[data-report-target]'));

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.reportTab !== button.dataset.reportTarget;
    });
    tabButtons.forEach((item) => {
      item.setAttribute('aria-pressed', String(item === button));
    });
  });
});

root.querySelectorAll('.export-chart').forEach((section) => {
  const controls = section.querySelector('.chart-controls');
  const templates = Array.from(
    section.querySelectorAll('template[data-chart-mode]')
  );

  let charts = [];
  let current = 0;

  const showChart = () => {
    charts.forEach((chart, index) => {
      chart.hidden = index !== current;
    });

    controls.hidden = charts.length <= 1;
    controls.querySelector('[data-chart-counter]').textContent =
      charts.length ? (current + 1) + ' / ' + charts.length : '';
  };

  const updateCharts = () => {
    charts = Array.from(
      section.querySelectorAll('[data-chart-kind="detail"]')
    );

    if (charts.length) {
      const frame = document.createElement('div');
      frame.className = 'detail-chart-frame';

      charts[0].before(frame);
      charts.forEach((chart) => frame.append(chart));
      frame.append(controls);
    }

    current = Math.min(current, Math.max(charts.length - 1, 0));
    showChart();
  };

  controls.querySelectorAll('[data-chart-step]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!charts.length) return;

      current =
        (current + Number(button.dataset.chartStep) + charts.length) %
        charts.length;

      showChart();
    });
  });

  if (templates.length) {
    const options = document.createElement('div');
    options.className = 'chart-options';

    const heading = document.createElement('p');
    heading.textContent = 'Chart Options';

    const buttons = document.createElement('div');
    buttons.className = 'chart-mode-buttons';
    buttons.setAttribute('role', 'group');
    buttons.setAttribute('aria-label', 'Chart display');

    const viewer = document.createElement('div');

    const showMode = (template) => {
      viewer.replaceChildren(template.content.cloneNode(true));

      buttons.querySelectorAll('button').forEach((button) => {
        button.setAttribute(
          'aria-pressed',
          String(button.dataset.mode === template.dataset.chartMode)
        );
      });

      updateCharts();
    };

    ['relative', 'absolute'].forEach((mode) => {
      const template = templates.find(
        (item) => item.dataset.chartMode === mode
      );
      if (!template) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.mode = mode;
      button.textContent = mode.toUpperCase();
      button.addEventListener('click', () => showMode(template));
      buttons.append(button);
    });

    options.append(heading, buttons);
    templates[0].before(options, viewer);

    showMode(templates[0]);
  } else {
    updateCharts();
  }
});
}
  </script>`
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

function exportTxt(report: Report, underline?: '=' | '-'): string {
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

function splitReportTable(table: ReturnType<typeof readReportTable>) {
  if (!table.columnCount) return [];
  const parts: number[][] = [];
  for (let start = 1; start < table.columnCount || start === 1; ) {
    let end = Math.min(start + 8, table.columnCount);
    // Keep grouped columns together whenever a group fits in one part.
    while (
      end > start &&
      end < table.columnCount &&
      table.rows.some((row) =>
        row.some(
          (cell, column) =>
            cell &&
            cell.colSpan < table.columnCount &&
            column < end &&
            column + cell.colSpan > end
        )
      )
    )
      end -= 1;
    if (end === start) end = Math.min(start + 8, table.columnCount);
    parts.push([
      0,
      ...Array.from({ length: end - start }, (_, index) => start + index),
    ]);
    if (end >= table.columnCount) break;
    start = end;
  }

  return parts.map((columns) => ({
    headerRows: table.headerRows,
    columnCount: columns.length,
    rows: table.rows.map((row) => {
      const cells: (ReportTableCell | null)[] = columns.map(() => null);
      row.forEach((cell, column) => {
        if (!cell) return;
        const included = columns.filter(
          (index) => index >= column && index < column + cell.colSpan
        );
        if (included.length)
          cells[columns.indexOf(included[0])] = {
            ...cell,
            colSpan: included.length,
          };
      });
      return cells;
    }),
  }));
}

function htmlToPdfBlocks(
  html: string,
  sourceUrl: string,
  pageWidth: number
): Content[] {
  return splitHtmlBlocks(html).flatMap<Content>((block) => {
    if (block.kind === 'text') {
      return {
        text: htmlToLinkedText(block.html, sourceUrl),
        margin: [0, 0, 0, 8],
      };
    }

    const { table } = block;
    if (!table.columnCount) return [];
    return splitReportTable(table).map((part): Content => {
      const body: TableCell[][] = part.rows.map((row) =>
        row.map(
          (cell): TableCell =>
            cell
              ? {
                  text: htmlToLinkedText(cell.html, sourceUrl),
                  rowSpan: cell.rowSpan,
                  colSpan: cell.colSpan,
                  bold: cell.header,
                  fillColor: cell.header ? '#eeeeee' : undefined,
                }
              : {}
        )
      );
      return {
        style: 'reportTable',
        table: {
          headerRows: table.headerRows,
          widths: Array(part.columnCount).fill(
            (pageWidth - part.columnCount * 5 - 1) / part.columnCount
          ),
          body,
        },
        layout: {
          paddingLeft: () => 2,
          paddingRight: () => 2,
        },
        fontSize: table.columnCount > 8 ? 8 : 10,
        lineHeight: 1,
        margin: [0, 8, 0, 12],
      };
    });
  });
}

async function chartsToPng(
  chartHtml: string,
  includeTitle = false,
  mainChartsOnly = false
) {
  const container = document.createElement('div');
  container.innerHTML = chartHtml;
  const figures = container.querySelectorAll(
    `figure.report-chart${mainChartsOnly ? ':not([data-chart-kind="detail"])' : ''}`
  );

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

    const title = figure.querySelector('h3')?.textContent?.trim() ?? '';
    const headingHeight = includeTitle && title ? 48 : 0;

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth * 2;
    canvas.height = (image.naturalHeight + headingHeight) * 2;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable.');

    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (headingHeight) {
      context.fillStyle = '#222';
      context.font = 'bold 36px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(
        title,
        canvas.width / 2,
        headingHeight,
        canvas.width - 48
      );
    }

    context.drawImage(
      image,
      0,
      headingHeight * 2,
      image.naturalWidth * 2,
      image.naturalHeight * 2
    );

    images.push({
      title,
      display: figure.getAttribute('data-chart-display'),
      dataUrl: canvas.toDataURL('image/png'),
      width: image.naturalWidth,
      height: image.naturalHeight + headingHeight,
    });
    // Release the large bitmap immediately and let the browser handle input/paint.
    canvas.width = 0;
    canvas.height = 0;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  return images;
}

async function getMainChartImages(chartHtml?: string) {
  return chartHtml ? chartsToPng(chartHtml, false, true) : [];
}

interface ReportChapter {
  report: Report;
  chartHtml?: string;
  id: string;
  level: 1 | 2;
}

const sectionTitles: Record<string, string> = {
  'Question explanation': 'Explanation of the Competency Question',
  'Required data': 'Required Data for Analysis',
  'Analysis method': 'Data Analysis',
  Interpretation: 'Data Interpretation',
};

function pdfReportContent(
  report: Report,
  charts: Awaited<ReturnType<typeof chartsToPng>>,
  chapter?: ReportChapter
): Content[] {
  const pdfSections = getReportSections(report, charts.length > 0);
  const multipleChartModes =
    new Set(charts.map((chart) => chart.display)).size > 1;

  return [
    {
      text: report.title,
      fontSize: chapter?.level === 2 ? 16 : 20,
      ...(chapter
        ? {
            id: chapter.id,
            headlineLevel: 1,
            ...(chapter.level === 1 ? { pageBreak: 'before' as const } : {}),
          }
        : {}),
      bold: true,
      color: '#e86161',
      margin: [
        0,
        chapter?.level === 2 ? 16 : 0,
        0,
        chapter?.level === 2 ? 8 : 14,
      ],
    },
    ...(chapter?.level === 2
      ? []
      : [
          {
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 0,
                x2: 515.28,
                y2: 0,
                lineWidth: 2,
                lineColor: '#e86161',
              },
            ],
            margin: [0, 0, 0, 16],
          } as Content,
        ]),
    ...report.metadata.map(
      (item, index): Content => ({
        text: [
          { text: `${item.label}: `, bold: true },
          {
            text: item.value,
            ...(item.url
              ? {
                  link: item.url,
                  color: '#245a9c',
                  decoration: 'underline' as const,
                  noWrap: true,
                }
              : {}),
          },
        ],
        fontSize: 10,
        color: '#666666',
        margin: [0, 0, 0, index === report.metadata.length - 1 ? 16 : 4],
      })
    ),
    ...pdfSections.flatMap((section): Content[] => {
      const sparql = getSectionQuery(section);

      const blocks = htmlToPdfBlocks(section.content, report.sourceUrl, 515.28);
      const body: Content[] = sparql
        ? [{ stack: blocks, fontSize: 8, lineHeight: 1.1 }]
        : blocks;

      const heading: Content = {
        text: sectionTitles[section.title] ?? section.title,
        ...(sparql
          ? {
              link: getSparqlUrl(sparql),
              decoration: 'underline' as const,
              noWrap: true,
            }
          : {}),
        fontSize: 14,
        bold: true,
        color: '#e86161',
        margin: [0, 12, 0, 6],
        headlineLevel: 1,
      };
      if (sparql) {
        // Keep short queries intact; long queries must still be allowed to span pages.
        const lines = sparql
          .split('\n')
          .reduce(
            (count, line) => count + Math.max(1, Math.ceil(line.length / 64)),
            0
          );
        if (lines <= 55) {
          return [
            {
              unbreakable: true,
              stack: [heading, ...body],
            },
          ];
        }
      }
      return [
        ...(section.title === 'Interpretation' && charts.length
          ? []
          : [heading]),

        ...(section.title === 'Interpretation'
          ? charts.flatMap((chart, index): Content[] => [
              {
                unbreakable: true,
                stack: [
                  ...(index === 0 ? [heading] : []),
                  ...(multipleChartModes &&
                  chart.display &&
                  chart.display !== charts[index - 1]?.display
                    ? [
                        {
                          text: chart.display,
                          bold: true,
                          fontSize: 12,
                          margin: [0, 12, 0, 6],
                          headlineLevel: 1,
                        } as Content,
                      ]
                    : []),
                  {
                    text: chart.title || 'Chart',
                    fontSize: 11,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 12, 0, 6],
                  },
                  {
                    image: chart.dataUrl,
                    fit: [515, 300],
                    alignment: 'center',
                    margin: [0, 0, 0, 12],
                  },
                ],
              },
            ])
          : []),

        ...body,
      ];
    }),
  ];
}

async function exportPdf(
  report: Report,
  chartHtml?: string,
  chapters?: ReportChapter[]
): Promise<Blob> {
  const charts = await getMainChartImages(chartHtml);
  // Load the PDF library and embedded fonts only when PDF is requested.
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);

  pdfMake.addVirtualFileSystem(fonts);

  const content = pdfReportContent(report, charts);
  if (chapters) {
    const context = document.createElement('canvas').getContext('2d');
    if (!context) throw new Error('Could not measure contents headings.');
    // Measure slightly larger than the PDF font to leave room for font differences.
    context.font = '12px sans-serif';
    content.push(
      {
        text: 'Contents',
        fontSize: 16,
        bold: true,
        color: '#e86161',
        margin: [0, 12, 0, 12],
      },
      {
        style: 'reportContents',
        table: {
          widths: ['*', 30],
          dontBreakRows: true,
          body: chapters.map((chapter) => {
            const indent = chapter.level === 2 ? 16 : 0;
            const width = 515.28 - indent - 60;
            const lines: string[] = [];
            let line = '';
            for (const word of chapter.report.title.split(/\s+/)) {
              const next = line ? `${line} ${word}` : word;
              if (line && context.measureText(next).width > width) {
                lines.push(line);
                line = word;
              } else {
                line = next;
              }
            }
            if (line) lines.push(line);
            return [
              {
                // One link per complete line, rather than per word.
                stack: lines.map((text) => ({
                  text,
                  noWrap: true,
                  linkToDestination: chapter.id,
                })),
                margin: [indent, 4, 0, 4],
              },
              {
                text: [{ pageReference: chapter.id }],
                noWrap: true,
                alignment: 'right',
                margin: [0, 4, 0, 4],
              },
            ];
          }),
        },
        layout: 'noBorders',
      }
    );
    for (const chapter of chapters) {
      const images = await getMainChartImages(chapter.chartHtml);
      content.push(...pdfReportContent(chapter.report, images, chapter));
    }
  }

  const definition: TDocumentDefinitions = {
    pageOrientation: 'portrait',
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 52],
    footer: (currentPage, pageCount) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: 'center',
      fontSize: 9,
      color: '#777777',
      margin: [0, 16, 0, 0],
    }),
    defaultStyle: {
      font: 'Roboto',
      fontSize: 11,
      lineHeight: 1.3,
    },
    content,
    pageBreakBefore: (currentNode, nodeContainer) => {
      if (
        currentNode.table &&
        currentNode.style === 'reportTable' &&
        currentNode.pageNumbers.length > 1 &&
        nodeContainer.getPreviousNodesOnPage().length > 0
      ) {
        return true;
      }

      return (
        currentNode.headlineLevel === 1 &&
        nodeContainer.getFollowingNodesOnPage().length === 0
      );
    },
  };

  return pdfMake.createPdf(definition).getBlob();
}

async function exportDocx(
  report: Report,
  chartHtml?: string,
  chapters?: ReportChapter[]
): Promise<Blob> {
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
    Footer,
    PageNumber,
    AlignmentType,
    BorderStyle,
    TableOfContents,
  } = await import('docx');
  const charts = await getMainChartImages(chartHtml);

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

  const createReportContent = (
    report: Report,
    charts: Awaited<ReturnType<typeof chartsToPng>>,
    chapter?: ReportChapter
  ) => {
    const createParagraph = (
      html: string,
      fontSize = 22,
      bold = false,
      keepNext = false
    ) =>
      new Paragraph({
        spacing: { after: 120, line: 276 },
        keepNext,
        keepLines: bold || keepNext,
        widowControl: true,
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

        const availableWidth = 11906 - 1600;
        return splitReportTable(block.table).flatMap((table) => [
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
                  cantSplit: true,
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
                              block.table.columnCount > 8 ? 16 : 20,
                              cell.header,
                              rowIndex < table.rows.length - 1
                            ),
                          ],
                        })
                    ),
                })
            ),
          }),
          new Paragraph({ text: '' }),
        ]);
      });

    const chartParagraphs = charts.flatMap((chart) => {
      const scale = Math.min(680 / chart.width, 400 / chart.height, 1);

      const data = Uint8Array.from(
        atob(chart.dataUrl.split(',')[1]),
        (character) => character.charCodeAt(0)
      );

      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          children: [
            new TextRun({ text: chart.title || 'Chart', bold: true, size: 22 }),
          ],
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
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        }),
      ];
    });

    const reportSections = getReportSections(report, charts.length > 0);
    const sections = reportSections.flatMap((section) => {
      const sparql = getSectionQuery(section);

      const title = new TextRun({
        text: sectionTitles[section.title] ?? section.title,
        bold: true,
        color: 'E86161',
        size: 28,
        ...(sparql ? { underline: {} } : {}),
      });

      return [
        new Paragraph({
          children: [
            sparql
              ? new ExternalHyperlink({
                  link: getSparqlUrl(sparql),
                  children: [title],
                })
              : title,
          ],
          heading: chapter ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_1,
          keepNext: true,
          spacing: { before: 240, after: 120 },
        }),
        ...(section.title === 'Interpretation' ? chartParagraphs : []),
        ...createContent(section.content),
      ];
    });

    return [
      new Paragraph({
        children: [
          new TextRun({
            text: report.title,
            size: chapter?.level === 2 ? 32 : 40,
            bold: true,
            color: 'E86161',
          }),
        ],
        heading: chapter
          ? chapter.level === 1
            ? HeadingLevel.HEADING_1
            : HeadingLevel.HEADING_2
          : HeadingLevel.TITLE,
        pageBreakBefore: chapter?.level === 1,
        keepNext: true,
        spacing: { before: chapter?.level === 2 ? 240 : 0, after: 240 },
      }),
      ...report.metadata.map(
        (item) =>
          new Paragraph({
            children: [
              new TextRun({ text: `${item.label}: `, bold: true, size: 20 }),
              item.url
                ? createLink(item.value, item.url)
                : new TextRun({ text: item.value, size: 20, color: '666666' }),
            ],
            spacing: { after: 80 },
          })
      ),
      ...sections,
    ];
  };
  const children = createReportContent(report, charts);
  if (chapters) {
    children.push(
      new Paragraph({
        keepNext: true,
        children: [
          new TextRun({
            text: 'Contents',
            bold: true,
            size: 32,
            color: 'E86161',
          }),
        ],
      })
    );
  }
  const chapterContent: (
    | InstanceType<typeof Paragraph>
    | InstanceType<typeof Table>
  )[] = [];
  for (const chapter of chapters ?? []) {
    const images = await getMainChartImages(chapter.chartHtml);
    chapterContent.push(
      ...createReportContent(chapter.report, images, chapter)
    );
  }
  const document = new Document({
    features: { updateFields: true },
    styles: {
      default: {
        title: {
          run: {
            font: 'Arial',
            size: 40,
            bold: true,
            color: 'E86161',
          },
          paragraph: {
            spacing: { after: 240 },
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 16,
                color: 'E86161',
                space: 8,
              },
            },
          },
        },
        heading1: {
          run: {
            font: 'Arial',
            size: 28,
            bold: true,
            color: 'E86161',
          },
        },
        heading2: {
          run: {
            font: 'Arial',
            size: 24,
            bold: true,
            color: 'E86161',
          },
        },
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
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: 800,
              bottom: 800,
              left: 800,
              right: 800,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [
                      PageNumber.CURRENT,
                      ' / ',
                      PageNumber.TOTAL_PAGES,
                    ],
                    font: 'Arial',
                    size: 18,
                    color: '777777',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...children,
          ...(chapters
            ? [
                new TableOfContents('Contents', {
                  hyperlink: true,
                  headingStyleRange: '1-2',
                }),
              ]
            : []),
          ...chapterContent,
        ],
      },
    ],
  });

  return Packer.toBlob(document);
}

function buildChartZipGroups(
  query: Query,
  templateId: string,
  sections: ExportSections,
  format: 'svg' | 'png',
  chartGroups: ExportChartGroup[],
  exportedAt: Date,
  namedTabsOnly = false
) {
  const tabFolders = new Map<number, string>();
  return chartGroups.map((group) => {
    if (!tabFolders.has(group.tabIndex)) {
      const { name: tabName, id: tabId } = getExportTab(query, group.tabIndex);
      const name =
        (tabName || tabId)
          .replace(/[\\/:*?"<>|]/g, '_')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/^[. ]+|[. ]+$/g, '') || `tab-${group.tabIndex + 1}`;
      const folder =
        namedTabsOnly && !tabName
          ? ''
          : [...tabFolders.values()].includes(name)
            ? `${name}_tab-${group.tabIndex + 1}`
            : name;
      tabFolders.set(group.tabIndex, folder);
    }

    return {
      folder: [
        tabFolders.get(group.tabIndex),
        group.normalized ? 'relative' : 'absolute',
      ]
        .filter(Boolean)
        .join('/'),
      html: group.html,
      report: buildReport(
        query,
        templateId,
        group.tabIndex,
        { ...sections, charts: true },
        format,
        group.normalized,
        exportedAt
      ),
    };
  });
}

async function exportChartZip(
  groups: { folder: string; html: string; report: Report }[],
  format: 'svg' | 'png'
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const chartCounts = new Map<string, number>();

  for (const group of groups) {
    const folder = zip.folder(group.folder);
    if (!folder) throw new Error('Chart export folder could not be created.');
    folder.file('metadata.txt', exportTxt({ ...group.report, sections: [] }));

    let chartNumber = chartCounts.get(group.folder) ?? 0;
    if (format === 'png') {
      const charts = await chartsToPng(group.html, true);

      charts.forEach((chart) => {
        folder.file(`chart-${++chartNumber}.png`, chart.dataUrl.split(',')[1], {
          base64: true,
        });
      });
    } else {
      const container = document.createElement('div');
      container.innerHTML = group.html;
      const figures = container.querySelectorAll('figure.report-chart');

      if (!figures.length) {
        throw new Error('No charts available for export.');
      }

      figures.forEach((figure) => {
        const svg = figure.querySelector('svg');
        if (!svg) throw new Error('Chart SVG is missing.');
        const namespace = 'http://www.w3.org/2000/svg';
        const heading = figure.querySelector('h3')?.textContent?.trim() ?? '';
        const width = svg.viewBox.baseVal.width || svg.width.baseVal.value;
        const height = svg.viewBox.baseVal.height || svg.height.baseVal.value;
        const padding = 24;
        const headingHeight = heading ? 40 : 0;

        const exportSvg = document.createElementNS(namespace, 'svg');
        exportSvg.setAttributeNS(
          'http://www.w3.org/2000/xmlns/',
          'xmlns',
          namespace
        );
        exportSvg.setAttribute('width', String(width + padding * 2));
        exportSvg.setAttribute(
          'height',
          String(height + headingHeight + padding * 2)
        );
        exportSvg.setAttribute(
          'viewBox',
          `0 0 ${width + padding * 2} ${height + headingHeight + padding * 2}`
        );
        exportSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        exportSvg.style.width = '100vw';
        exportSvg.style.height = '100vh';
        exportSvg.style.display = 'block';

        if (heading) {
          const title = document.createElementNS(namespace, 'text');
          title.setAttribute('x', String(width / 2 + padding));
          title.setAttribute('y', String(padding + 20));
          title.setAttribute('text-anchor', 'middle');
          title.setAttribute('font-family', 'Arial, sans-serif');
          title.setAttribute('font-size', '18');
          title.setAttribute('font-weight', 'bold');
          title.setAttribute('fill', '#222');
          title.textContent = heading;
          exportSvg.append(title);
        }

        svg.setAttribute('x', String(padding));
        svg.setAttribute('y', String(padding + headingHeight));
        svg.setAttribute('width', String(width));
        svg.setAttribute('height', String(height));
        exportSvg.append(svg);

        folder.file(
          `chart-${++chartNumber}.svg`,
          new XMLSerializer().serializeToString(exportSvg)
        );
      });
    }
    chartCounts.set(group.folder, chartNumber);
  }

  return zip.generateAsync({ type: 'blob' });
}

const exportMimeTypes = {
  html: 'text/html',
  txt: 'text/plain',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  zip: 'application/zip',
};

async function renderDocument(
  format: 'pdf' | 'docx' | 'txt',
  report: Report,
  chartHtml?: string,
  chapters?: ReportChapter[]
): Promise<string | Blob> {
  if (format === 'pdf') return exportPdf(report, chartHtml, chapters);
  if (format === 'docx') return exportDocx(report, chartHtml, chapters);
  if (!chapters) return exportTxt(report);
  return [
    exportTxt(report, '='),
    'Contents\n--------',
    chapters
      .map(
        (chapter) => `${chapter.level === 2 ? '  ' : ''}${chapter.report.title}`
      )
      .join('\n'),
    ...chapters.map((chapter) =>
      exportTxt(chapter.report, chapter.level === 1 ? '=' : '-')
    ),
  ].join('\n\n');
}

function downloadFile(
  content: string | Blob,
  filename: string,
  format: keyof typeof exportMimeTypes
): void {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], {
          type: `${exportMimeTypes[format]};charset=utf-8`,
        });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildHtmlTabs(
  query: Query,
  templateId: string,
  sections: ExportSections,
  normalized: boolean,
  exportedAt: Date,
  chartGroups: ExportChartGroup[] = []
) {
  return [0, ...(query.uid_2 ? [1] : [])].map((index) => {
    const { label, chartSettings } = getExportTab(query, index);
    const groups = sections.charts
      ? chartGroups.filter((group) => group.tabIndex === index)
      : [];

    if (sections.charts && chartSettings) requireChartGroup(groups, index);

    return {
      label,
      report: buildReport(
        query,
        templateId,
        index,
        sections,
        'html',
        normalized,
        exportedAt
      ),
      charts: groups.length
        ? groups
            .map(
              (group) =>
                `<template data-chart-mode="${group.normalized ? 'relative' : 'absolute'}">${group.html}</template>`
            )
            .join('\n')
        : undefined,
    };
  });
}

export function exportQuestionsHtml(
  questions: QuestionHtmlExport[],
  templateId: string,
  sections: ExportSections
): void {
  if (!questions.length) throw new Error('No questions selected.');
  const exportedAt = new Date();
  const reports = questions.map(({ query, chartGroups }) => {
    const tabs = buildHtmlTabs(
      query,
      templateId,
      sections,
      true,
      exportedAt,
      chartGroups
    );
    const parsed = new DOMParser().parseFromString(
      exportHtml(tabs, 0),
      'text/html'
    );
    const heading = parsed.body.querySelector('h1')!;
    const title = parsed.createElement('h2');
    title.textContent = heading.textContent;
    heading.replaceWith(title);
    return {
      id: query.id,
      title: query.dataAnalysisInformation.question,
      html: `<article id="question-${query.id}" class="collection-question" data-question-report>${parsed.body.innerHTML}</article>`,
      tabs,
    };
  });
  downloadFile(
    exportHtml(reports[0].tabs, 0, {
      title: `${getTemplateConfig(templateId).title} – Questions report`,
      questions: reports,
    }),
    `questions_${templateId}_${exportedAt.toISOString().slice(0, 10)}.html`,
    'html'
  );
}

export async function exportQuestionsDocument(
  questions: QuestionHtmlExport[],
  templateId: string,
  sections: ExportSections,
  chartMode: ExportChartMode,
  format: 'pdf' | 'docx' | 'txt' = 'pdf'
): Promise<void> {
  if (!questions.length) throw new Error('No questions selected.');
  if (format === 'txt') sections = { ...sections, charts: false };
  const exportedAt = new Date();
  const chapters: ReportChapter[] = [];
  for (const { query, chartGroups } of questions) {
    const tabs = [0, ...(query.uid_2 ? [1] : [])].map((index) =>
      buildReport(
        query,
        templateId,
        index,
        sections,
        format,
        chartMode !== 'absolute',
        exportedAt
      )
    );
    const shared =
      tabs.length > 1
        ? tabs[0].sections.filter(
            (section) =>
              [
                'Question explanation',
                'Required data',
                'Analysis method',
              ].includes(section.title) &&
              tabs.every((tab) =>
                tab.sections.some(
                  (other) =>
                    other.title === section.title &&
                    other.content === section.content
                )
              )
          )
        : [];
    if (tabs.length > 1) {
      chapters.push({
        id: `question-${query.id}`,
        level: 1,
        report: {
          ...tabs[0],
          sections: shared,
          metadata: tabs[0].metadata.filter(
            (item) => item.label === 'Source question'
          ),
        },
      });
    }
    for (const [index, tab] of tabs.entries()) {
      const tabInfo = getExportTab(query, index);
      const modes = getExportChartModes(query, index, chartMode);
      const groups =
        sections.charts && tabInfo.chartSettings
          ? modes.map((normalized) => {
              const group = requireChartGroup(chartGroups, index, normalized);
              const container = document.createElement('div');
              container.innerHTML = group.html;
              container
                .querySelectorAll('figure.report-chart')
                .forEach((figure) => {
                  figure.setAttribute(
                    'data-chart-display',
                    normalized ? 'Relative' : 'Absolute'
                  );
                });
              return container.innerHTML;
            })
          : [];
      chapters.push({
        id:
          tabs.length > 1
            ? `question-${query.id}-tab-${index}`
            : `question-${query.id}`,
        level: tabs.length > 1 ? 2 : 1,
        chartHtml: groups.length ? groups.join('\n') : undefined,
        report: {
          ...tab,
          title: tabs.length > 1 ? tabInfo.label : tab.title,
          sections: tab.sections.filter(
            (section) => !shared.some((other) => other.title === section.title)
          ),
          metadata: tab.metadata
            .filter(
              (item) =>
                item.label === 'Chart display' ||
                (tabs.length === 1 && item.label === 'Source question')
            )
            .map((item) =>
              item.label === 'Chart display' &&
              chartMode === 'both' &&
              tabInfo.supportsNormalization
                ? { ...item, value: 'Relative / Absolute' }
                : item
            ),
        },
      });
    }
  }
  const first = buildReport(
    questions[0].query,
    templateId,
    0,
    sections,
    format,
    true,
    exportedAt
  );
  const report = {
    ...first,
    title: `${getTemplateConfig(templateId).title} – Questions report`,
    metadata: first.metadata.filter(
      (item) => item.label === 'Theme' || item.label === 'Export date'
    ),
    sections: [],
  };
  downloadFile(
    await renderDocument(format, report, undefined, chapters),
    `questions_${templateId}_${exportedAt.toISOString().slice(0, 10)}.${format}`,
    format
  );
}

export async function exportQuestionsCharts(
  questions: QuestionHtmlExport[],
  templateId: string,
  sections: ExportSections,
  format: 'svg' | 'png'
): Promise<void> {
  const exportedAt = new Date();
  const groups = questions.flatMap(({ query, chartGroups }) => {
    const message = `Chart variants are missing for question ${query.id}.`;
    for (const tabIndex of [0, 1]) {
      const tab = getExportTab(query, tabIndex);
      if (!tab.chartSettings) continue;
      const modes = getExportChartModes(query, tabIndex, 'both', false);
      for (const normalized of modes) {
        requireChartGroup(chartGroups, tabIndex, normalized, message);
      }
    }
    return buildChartZipGroups(
      query,
      templateId,
      sections,
      format,
      chartGroups,
      exportedAt,
      true
    ).map((group) => ({ ...group, folder: `Q${query.id}/${group.folder}` }));
  });
  if (!groups.length) throw new Error('No charts available for export.');
  const zip = await exportChartZip(groups, format);
  downloadFile(
    zip,
    `questions_${templateId}_charts_${format}_${exportedAt.toISOString().slice(0, 10)}.zip`,
    'zip'
  );
}

export async function exportQuestion(
  query: Query,
  templateId: string,
  tabIndex: number,
  sections: ExportSections,
  format: ExportFormat,
  normalized: boolean,
  chartSvg?: string,
  chartGroups?: ExportChartGroup[]
): Promise<void> {
  const exportedAt = new Date();
  const report = buildReport(
    query,
    templateId,
    tabIndex,
    sections,
    format,
    normalized,
    exportedAt
  );
  const date = exportedAt.toISOString().slice(0, 10);

  if (format === 'svg' || format === 'png') {
    if (!chartGroups?.length) {
      throw new Error('No charts available for export.');
    }

    const groups = buildChartZipGroups(
      query,
      templateId,
      sections,
      format,
      chartGroups,
      exportedAt
    );

    const zip = await exportChartZip(groups, format);

    downloadFile(zip, `Q${query.id}_charts_${format}_${date}.zip`, 'zip');

    return;
  }
  if (format !== 'txt' && format !== 'html' && sections.charts && !chartSvg) {
    throw new Error('No chart available for export.');
  }

  const filename = `Q${query.id}_${date}.${format}`;

  if (format === 'html') {
    const tabs = buildHtmlTabs(
      query,
      templateId,
      sections,
      normalized,
      exportedAt,
      chartGroups
    );
    downloadFile(exportHtml(tabs, tabIndex), filename, format);
  } else {
    downloadFile(
      await renderDocument(
        format,
        report,
        sections.charts ? chartSvg : undefined
      ),
      filename,
      format
    );
  }
}
