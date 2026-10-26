import type {
  Report,
  ChartImage,
  ReportChapter,
  ExportSections,
  ExportChartGroup,
  QuestionHtmlExport,
  ExportChartMode,
  DynamicExportState,
  ExportFormat,
} from './types';
import { exportPdf } from './pdf';
import { exportDocx } from './docx';
import { exportTxt } from './txt';
import type { Query } from '../../constants/queries_chart_info';
import {
  getExportTab,
  requireChartGroup,
  buildReport,
  getExportChartModes,
  buildDynamicReport,
} from './report';
import { exportHtml } from './html';
import { getTemplateConfig } from '../../constants/template_config';
import {
  buildChartZipGroups,
  exportChartZip,
  createChartZipFolder,
  addPngChartsToZip,
} from './zip';
import { getDynamicChartElements, captureDynamicCharts } from './chartCapture';
import { buildSvgChartFigure } from './svg';
export type {
  ExportChartMode,
  ExportFormat,
  ExportSections,
  ExportChartGroup,
  QuestionHtmlExport,
} from './types';
export { getExportChartModes } from './report';
export { serializeChartSvg } from './svg';
export { supportsDynamicSvgExport } from './chartCapture';

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
  chartHtml?: string | ChartImage[],
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
    if (tabs.length > 1) {
      chapters.push({
        id: `question-${query.id}`,
        level: 1,
        report: {
          ...tabs[0],
          sections: [],
          metadata: [],
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
          metadata: tab.metadata
            .filter(
              (item) =>
                item.label === 'Chart display' ||
                item.label === 'Source question'
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

export function exportDynamicQuestionHtml(
  state: DynamicExportState,
  templateId: string,
  sections: ExportSections,
  chartDocument?: string
): void {
  const { report, exportedAt } = buildDynamicReport(
    state,
    templateId,
    sections
  );
  let charts: string | undefined;
  if (sections.charts && state.chartHtml.trim()) {
    if (!chartDocument?.trim())
      throw new Error('The generated chart is not ready for export.');
    const frame = document.createElement('iframe');
    frame.title = 'AI-Generated Chart';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.style.cssText = 'width:100%;height:600px;border:0;display:block';
    frame.srcdoc = chartDocument;
    charts = frame.outerHTML;
  }
  downloadFile(
    exportHtml([{ label: 'Dynamic Question', report, charts }], 0),
    `dynamic-question_${exportedAt.toISOString().slice(0, 10)}.html`,
    'html'
  );
}

export async function exportDynamicQuestionCharts(
  state: DynamicExportState,
  templateId: string,
  format: 'svg' | 'png',
  frame?: HTMLIFrameElement | null
): Promise<void> {
  const { report, exportedAt } = buildDynamicReport(state, templateId, {
    explanation: false,
    requiredData: false,
    analysisMethod: false,
    interpretation: false,
    charts: true,
    sparql: false,
  });
  if (!state.chartHtml.trim())
    throw new Error('No chart available for export.');
  let archive: Blob;
  if (format === 'svg') {
    const elements = getDynamicChartElements(frame);
    if (elements.some((element) => element.localName !== 'svg')) {
      throw new Error(
        'This chart uses canvas and cannot be exported as a vector SVG. Please choose PNG.'
      );
    }
    const html = elements
      .map((element, index) => {
        const title =
          elements.length === 1
            ? report.title
            : `${report.title} – Chart ${index + 1}`;
        const figure = buildSvgChartFigure(element as SVGSVGElement, title);
        return figure.outerHTML;
      })
      .join('');
    archive = await exportChartZip(
      [{ folder: 'charts', html, report }],
      format
    );
  } else {
    const charts = await captureDynamicCharts(frame);
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const folder = createChartZipFolder(zip, 'charts', report);
    addPngChartsToZip(folder, charts);
    archive = await zip.generateAsync({ type: 'blob' });
  }
  downloadFile(
    archive,
    `dynamic-question_charts_${format}_${exportedAt.toISOString().slice(0, 10)}.zip`,
    'zip'
  );
}

export async function exportDynamicQuestionDocument(
  state: DynamicExportState,
  templateId: string,
  sections: ExportSections,
  format: 'pdf' | 'docx' | 'txt',
  frame?: HTMLIFrameElement | null
): Promise<void> {
  const { report, exportedAt } = buildDynamicReport(
    state,
    templateId,
    sections
  );
  const charts =
    format !== 'txt' && sections.charts && state.chartHtml.trim()
      ? await captureDynamicCharts(frame)
      : [];
  downloadFile(
    await renderDocument(format, report, charts),
    `dynamic-question_${exportedAt.toISOString().slice(0, 10)}.${format}`,
    format
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
