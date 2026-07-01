import { PredicatesMapping, PropertyMapping } from '../components/Graph/types';

export interface PredicateDetail {
  id: string;
  label: string;
  description: string;
  cardinality: string;
  predicateLabel?: string;
  classId?: string;
  classLabel?: string;
  subtemplateId?: string;
  subtemplateLabel?: string;
  nestedProperties: Array<{
    id: string;
    label: string;
    classLabel?: string;
  }>;
  usageSamples: string[];
}

export interface ClassMetadata {
  label?: string;
  viaPredicates: string[];
  subtemplateId?: string;
  subtemplateLabel?: string;
}

export const KG_EMPIRE_DEFAULT_HTML = `<p>You can ask factual, comparative, and exploratory questions about empirical research practice in <strong>Requirements Engineering (RE)</strong>, grounded in the underlying <a href="{schemaUrl}" target="_blank" rel="noopener noreferrer">schema</a>.</p>

<p>Main topics you can query include: <strong>research questions and answers</strong> (primary questions, subquestions, how answers are reported), <strong>research paradigm</strong>, <strong>data collection</strong> (what data were collected, data types, methods, URLs), <strong>data analysis</strong> (analysis methods, inferential and descriptive statistics, machine learning algorithms and metrics), <strong>hypotheses</strong> (null vs. alternative), <strong>measures and metrics</strong> (counts, percentages, central tendency and dispersion), and <strong>threats to validity</strong> (construct, internal, external, conclusion validity, reliability, generalizability, repeatability, and other validity types).</p>`;

export const extractClassIds = (query: string): string[] => {
  const regex = /orkgc:(C\d+)/gi;
  const seen = new Set<string>();
  const result: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(query)) !== null) {
    const id = match[1].toUpperCase();
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
};

export const extractResourceIds = (query: string): string[] => {
  const regex = /orkgr:(R\d+)/gi;
  const seen = new Set<string>();
  const result: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(query)) !== null) {
    const id = match[1].toUpperCase();
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
};

export const getPredicateUsageSamples = (
  query: string,
  predicateId: string,
  maxSamples = 3
): string[] => {
  const lowerId = `orkgp:${predicateId.toLowerCase()}`;
  return query
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().includes(lowerId))
    .slice(0, maxSamples);
};

export const hasPrefixes = (query: string): boolean => {
  const trimmedQuery = query.trim();
  return /^\s*PREFIX\s+/i.test(trimmedQuery);
};

export const removePrefixes = (query: string): string => {
  const lines = query.split('\n');
  const prefixLines: number[] = [];

  lines.forEach((line, index) => {
    if (/^\s*PREFIX\s+/i.test(line.trim())) {
      prefixLines.push(index);
    }
  });

  // If we found PREFIX lines, remove them
  if (prefixLines.length > 0) {
    // Remove lines in reverse order to maintain indices
    const linesWithoutPrefixes = lines.filter(
      (_, index) => !prefixLines.includes(index)
    );
    return linesWithoutPrefixes.join('\n').trim();
  }

  return query;
};

export const ensurePrefixes = (query: string, prefixes: string): string => {
  if (hasPrefixes(query)) {
    // Query already has prefixes, remove duplicates and ensure we have the standard ones
    const queryWithoutPrefixes = removePrefixes(query);
    return `${prefixes.trim()}\n${queryWithoutPrefixes}`;
  }
  // Query doesn't have prefixes, add them
  return `${prefixes.trim()}\n${query}`;
};

const walkMappingForClass = (
  mapping: PropertyMapping | undefined,
  predicateChain: string[],
  targetClassId: string
): ClassMetadata | null => {
  if (!mapping) return null;

  if (mapping.class_id === targetClassId) {
    return {
      label: mapping.class_label ?? mapping.label,
      viaPredicates: predicateChain,
      subtemplateId: mapping.subtemplate_id,
      subtemplateLabel: mapping.subtemplate_label,
    };
  }

  if (!mapping.subtemplate_properties) return null;

  for (const [childPredicateId, childMapping] of Object.entries(
    mapping.subtemplate_properties
  )) {
    const childChain = [...predicateChain, childPredicateId];
    const result = walkMappingForClass(childMapping, childChain, targetClassId);
    if (result) return result;
  }

  return null;
};

export const resolveClassMetadata = (
  classId: string,
  templateMapping?: PredicatesMapping
): ClassMetadata | null => {
  if (!templateMapping) return null;

  for (const [predicateId, mapping] of Object.entries(templateMapping)) {
    const result = walkMappingForClass(mapping, [predicateId], classId);
    if (result) return result;
  }

  return null;
};
