import type { Report, ChartImage, ReportChapter } from './types';
import { getMainChartImages } from './chartCapture';
import { chartsToPng } from './png';
import { htmlToLinkedText, splitHtmlBlocks } from './htmlContent';
import type { ParagraphChild } from 'docx';
import { splitReportTable } from './tables';
import {
  getReportSections,
  getSectionQuery,
  sectionTitles,
  getSparqlUrl,
} from './report';

export async function exportDocx(
  report: Report,
  chartHtml?: string | ChartImage[],
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
