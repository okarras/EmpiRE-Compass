/**
 * Build BibTeX @misc entries from Team / Admin paper records.
 */

export interface PaperBibtexInput {
  id: string;
  title: string;
  authors?: string;
  year?: number;
  venue?: string;
  link?: string;
}

function escapeBibtexField(s: string): string {
  return s.replace(/([{}%#&])/g, '\\$1');
}

function splitAuthorsList(authors: string): string[] {
  return authors
    .trim()
    .split(/\s*;\s*/)
    .flatMap((chunk) => chunk.split(/\s+and\s+/i))
    .flatMap((chunk) => chunk.split(/\s*&\s*/))
    .map((p) => p.trim())
    .filter(Boolean);
}

function formatAuthorField(authors?: string): string | undefined {
  if (!authors?.trim()) return undefined;
  const parts = splitAuthorsList(authors);
  if (parts.length === 0) return undefined;
  return parts.map((p) => escapeBibtexField(p)).join(' and ');
}

export function makeBibtexCitationKey(paper: PaperBibtexInput): string {
  const slug = paper.title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  const y = paper.year != null ? `_${paper.year}` : '';
  const tail = paper.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10) || 'ref';
  let key = `${slug || 'publication'}${y}_${tail}`;
  key = key.replace(/[^a-zA-Z0-9_:-]/g, '_').replace(/^_+/, '');
  return key.slice(0, 120) || 'publication';
}

export function paperToBibtexEntry(paper: PaperBibtexInput): string {
  const key = makeBibtexCitationKey(paper);
  const lines: string[] = [`@misc{${key},`];
  lines.push(`  title = {{${escapeBibtexField(paper.title)}}},`);

  const author = formatAuthorField(paper.authors);
  if (author) {
    lines.push(`  author = {${author}},`);
  }
  if (paper.year != null && !Number.isNaN(paper.year)) {
    lines.push(`  year = {${paper.year}},`);
  }
  if (paper.venue?.trim()) {
    lines.push(`  note = {${escapeBibtexField(paper.venue.trim())}},`);
  }
  if (paper.link?.trim()) {
    lines.push(`  url = {${escapeBibtexField(paper.link.trim())}},`);
  }
  lines.push('}');
  return lines.join('\n');
}

export function papersToBibtexBibliography(
  papers: PaperBibtexInput[],
  headerComment = '% Exported from EmpiRE-Compass\n'
): string {
  if (papers.length === 0) return headerComment;
  return `${headerComment}\n${papers.map(paperToBibtexEntry).join('\n\n')}\n`;
}

export function downloadBibtexFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.click();
  URL.revokeObjectURL(url);
}
