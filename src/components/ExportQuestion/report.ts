import type { Query } from '../../constants/queries_chart_info';
import type {
  ExportChartMode,
  ExportChartGroup,
  ExportSections,
  ExportFormat,
  Report,
  DynamicExportState,
} from './types';
import { escapeHtml, parseReportHtml } from './htmlContent';
import { prepareQueryForExecution } from '../../helpers/fetch_query';
import DOMPurify from 'dompurify';
import {
  getTemplateConfig,
  templateConfig,
} from '../../constants/template_config';

export function getExportTab(query: Query, index: number) {
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

export function requireChartGroup(
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

function buildReportSections(
  info: Query['dataAnalysisInformation'],
  selected: ExportSections,
  tabIndex: number,
  sparql?: string
) {
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

  if (selected.sparql && sparql?.trim()) {
    sections.push({
      enabled: true,
      title: 'SPARQL query',
      content: `<pre><code>${escapeHtml(prepareQueryForExecution(sparql))}</code></pre>`,
    });
  }

  return sections
    .filter((section) => section.enabled && section.content.trim())
    .map((section) => ({
      title: section.title,
      content: DOMPurify.sanitize(section.content, {
        USE_PROFILES: { html: true },
      }),
    }));
}

function buildReportMetadata(
  templateId: string,
  exportedAt: Date,
  source: { label: string; value: string; url: string },
  details: { label: string; value: string; url?: string }[] = []
) {
  return [
    {
      label: 'Theme',
      value: getTemplateConfig(templateId).title,
      url: `https://orkg.org/template/${encodeURIComponent(templateId)}`,
    },
    ...details,
    { label: 'Export date', value: exportedAt.toLocaleDateString('en-GB') },
    source,
  ];
}

// Select the content once for every format.
export function buildReport(
  query: Query,
  templateId: string,
  tabIndex: number,
  selected: ExportSections,
  format: ExportFormat,
  normalized: boolean,
  exportedAt: Date
) {
  const info = query.dataAnalysisInformation;
  const sparql =
    tabIndex === 1 && query.uid_2 ? query.sparqlQuery2 : query.sparqlQuery;

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

  const metadata = buildReportMetadata(
    templateId,
    exportedAt,
    {
      label: 'Source question',
      value: `Question ${query.id}`,
      url: sourceUrl,
    },
    [
      ...(tab.name ? [{ label: 'Analysis', value: tab.name }] : []),
      ...(hasCharts ? [{ label: 'Chart display', value: chartDisplay }] : []),
    ]
  );

  return {
    title: `${query.id}. ${info.question}`,
    metadata,
    sourceUrl,
    sections: buildReportSections(info, selected, tabIndex, sparql),
  };
}

export function getReportSections(report: Report, hasCharts: boolean) {
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

export function getSparqlUrl(sparql: string): string {
  return `https://orkg.org/sparql#${encodeURIComponent(sparql)}`;
}

export function getSectionQuery(section: Report['sections'][number]) {
  return section.title.startsWith('SPARQL query')
    ? parseReportHtml(section.content).querySelector('code')?.textContent
    : null;
}

export const sectionTitles: Record<string, string> = {
  'Question explanation': 'Explanation of the Competency Question',
  'Required data': 'Required Data for Analysis',
  'Analysis method': 'Data Analysis',
  Interpretation: 'Data Interpretation',
};

export function buildDynamicReport(
  state: DynamicExportState,
  templateId: string,
  sections: ExportSections
) {
  if (!state.question.trim())
    throw new Error('Enter a question before exporting.');
  const exportedAt = new Date();
  const sourceUrl = `https://empire-compass.tib.eu/${encodeURIComponent(templateId)}/dynamic-question`;
  const metadata = buildReportMetadata(templateId, exportedAt, {
    label: 'Source page',
    value: 'Dynamic Question',
    url: sourceUrl,
  });
  if (!templateConfig[templateId]) metadata[0].value = templateId;
  const report: Report = {
    title: state.question.trim(),
    sourceUrl,
    metadata,
    sections: buildReportSections(
      {
        question: state.question,
        questionExplanation: state.questionInterpretation,
        requiredDataForAnalysis: state.dataCollectionInterpretation,
        dataAnalysis: state.dataAnalysisInterpretation,
      },
      sections,
      0,
      state.sparqlQuery
    ),
  };
  return { report, exportedAt };
}
