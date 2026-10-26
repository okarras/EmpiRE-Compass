import type { Query } from '../../constants/queries_chart_info';
import type { DynamicQuestionState } from '../../context/DynamicQuestionContext';

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

export interface Report {
  title: string;
  metadata: { label: string; value: string; url?: string }[];
  sourceUrl: string;
  sections: { title: string; content: string }[];
}

export interface ChartImage {
  title: string;
  display: string | null;
  dataUrl: string;
  width: number;
  height: number;
}

export interface ReportChapter {
  report: Report;
  chartHtml?: string;
  id: string;
  level: 1 | 2;
}

export type DynamicExportState = Pick<
  DynamicQuestionState,
  | 'question'
  | 'sparqlQuery'
  | 'chartHtml'
  | 'questionInterpretation'
  | 'dataCollectionInterpretation'
  | 'dataAnalysisInterpretation'
>;
