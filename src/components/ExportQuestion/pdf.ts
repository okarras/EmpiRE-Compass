import type {
  Content,
  TableCell,
  TDocumentDefinitions,
} from 'pdfmake/interfaces';
import { splitHtmlBlocks, htmlToLinkedText } from './htmlContent';
import { splitReportTable } from './tables';
import type { Report, ReportChapter, ChartImage } from './types';
import { chartsToPng } from './png';
import {
  getReportSections,
  getSectionQuery,
  sectionTitles,
  getSparqlUrl,
} from './report';
import { getMainChartImages } from './chartCapture';

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

export async function exportPdf(
  report: Report,
  chartHtml?: string | ChartImage[],
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
                stack: [
                  {
                    stack: lines.map((text) => ({ text, noWrap: true })),
                    relativePosition: { x: 0, y: 0 },
                  },
                  {
                    // One transparent link area covers the complete title.
                    // Keep the visible title as normal, selectable PDF text.
                    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${lines.length * 18}"><rect width="100%" height="100%" fill="none"/></svg>`,
                    linkToDestination: chapter.id,
                  },
                ],
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
