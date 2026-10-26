import type { Report } from './types';
import {
  getReportSections,
  sectionTitles,
  getSectionQuery,
  getSparqlUrl,
} from './report';
import { escapeHtml } from './htmlContent';

// Generate HTML while preserving formatted section content.
export function exportHtml(
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
