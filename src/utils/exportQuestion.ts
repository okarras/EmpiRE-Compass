import DOMPurify from 'dompurify';
import type { Query } from '../constants/queries_chart_info';
import { getTemplateConfig } from '../constants/template_config';

import type { ContentText, TDocumentDefinitions } from 'pdfmake/interfaces';

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

function escapeHtml(text: string): string {
  const element = document.createElement('span');
  element.textContent = text;
  return element.innerHTML;
}

// Generate HTML while preserving formatted section content.
function exportHtml(report: Report): string {
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
    table { border-collapse: collapse; max-width: 100%; }
    th, td { border: 1px solid #ccc; padding: 8px; }
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
</body>
</html>`;
}

// Convert formatted text to plain text and retain link destinations.
function htmlToText(html: string, sourceUrl: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');

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

  parsed.body.querySelectorAll('th, td').forEach((element) => {
    element.append('\t');
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
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const content: ContentText[] = [];

  const visit = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      content.push({ text: (node.textContent ?? '').replace(/\s+/g, ' ') });
      return;
    }

    if (!(node instanceof Element)) return;

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

async function exportPdf(report: Report): Promise<Blob> {
  // Load the PDF library and embedded fonts only when PDF is requested.
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);

  pdfMake.addVirtualFileSystem(fonts);

  const definition: TDocumentDefinitions = {
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
      ...report.sections.flatMap((section) => [
        {
          text: section.title,
          fontSize: 14,
          bold: true,
          color: '#b84040',
          margin: [0, 12, 0, 6] as [number, number, number, number],
          headlineLevel: 1,
        },
        {
          text: htmlToLinkedText(section.content, report.sourceUrl),
          margin: [0, 0, 0, 8] as [number, number, number, number],
        },
      ]),
    ],
    pageBreakBefore: (currentNode, nodeContainer) =>
      currentNode.headlineLevel === 1 &&
      nodeContainer.getFollowingNodesOnPage().length === 0,
  };

  return pdfMake.createPdf(definition).getBlob();
}

async function exportDocx(report: Report): Promise<Blob> {
  const {
    Document,
    Paragraph,
    TextRun,
    ExternalHyperlink,
    HeadingLevel,
    Packer,
  } = await import('docx');

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

  const sections = report.sections.flatMap((section) => [
    new Paragraph({
      text: section.title,
      heading: HeadingLevel.HEADING_1,
      keepNext: true,
      spacing: { before: 240, after: 120 },
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: htmlToLinkedText(section.content, report.sourceUrl)
        .map((part) => {
          const text = typeof part.text === 'string' ? part.text : '';

          const runs = text.split('\n').map(
            (line, index) =>
              new TextRun({
                text: line,
                break: index > 0 ? 1 : 0,
                ...(part.link ? { style: 'Hyperlink' } : {}),
              })
          );

          return part.link
            ? new ExternalHyperlink({
                link: part.link,
                children: runs,
              })
            : runs;
        })
        .flat(),
    }),
  ]);

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
  format: ExportFormat
): Promise<void> {
  if (sections.sparql || (format !== 'txt' && sections.charts)) {
    throw new Error('Charts and SPARQL export are not implemented yet.');
  }

  const report = buildReport(query, templateId, tabIndex, sections);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `Q${query.id}_${date}.${format}`;

  switch (format) {
    case 'html':
      downloadFile(exportHtml(report), filename, 'text/html');
      break;
    case 'txt':
      downloadFile(exportTxt(report), filename, 'text/plain');
      break;
    case 'pdf':
      downloadFile(await exportPdf(report), filename, 'application/pdf');
      break;

    case 'docx':
      downloadFile(
        await exportDocx(report),
        filename,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      break;
  }
}
