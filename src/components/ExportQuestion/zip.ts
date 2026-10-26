import type { Query } from '../../constants/queries_chart_info';
import type {
  ExportSections,
  ExportChartGroup,
  Report,
  ChartImage,
} from './types';
import { getExportTab, buildReport } from './report';
import type JSZip from 'jszip';
import { exportTxt } from './txt';
import { chartsToPng } from './png';
import { serializeSvgChartFile } from './svg';

export function buildChartZipGroups(
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

export function createChartZipFolder(zip: JSZip, name: string, report: Report) {
  const folder = zip.folder(name);
  if (!folder) throw new Error('Chart export folder could not be created.');
  folder.file('metadata.txt', exportTxt({ ...report, sections: [] }));
  return folder;
}

export function addPngChartsToZip(
  folder: JSZip,
  charts: ChartImage[],
  chartNumber = 0
) {
  charts.forEach((chart) => {
    folder.file(`chart-${++chartNumber}.png`, chart.dataUrl.split(',')[1], {
      base64: true,
    });
  });
  return chartNumber;
}

export async function exportChartZip(
  groups: { folder: string; html: string; report: Report }[],
  format: 'svg' | 'png'
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const chartCounts = new Map<string, number>();

  for (const group of groups) {
    const folder = createChartZipFolder(zip, group.folder, group.report);

    let chartNumber = chartCounts.get(group.folder) ?? 0;
    if (format === 'png') {
      const charts = await chartsToPng(group.html, true);

      chartNumber = addPngChartsToZip(folder, charts, chartNumber);
    } else {
      const container = document.createElement('div');
      container.innerHTML = group.html;
      const figures = container.querySelectorAll('figure.report-chart');

      if (!figures.length) {
        throw new Error('No charts available for export.');
      }

      figures.forEach((figure) => {
        folder.file(
          `chart-${++chartNumber}.svg`,
          serializeSvgChartFile(figure)
        );
      });
    }
    chartCounts.set(group.folder, chartNumber);
  }

  return zip.generateAsync({ type: 'blob' });
}
