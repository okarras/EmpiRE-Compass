export interface RawDataItem {
  [key: string]: unknown;
}

type CommonResult = { label: string; count: number; normalizedRatio: number };

type ProcessOptions = {
  paperKey: string;
  labelKey: string;
  uniqueValueKey?: string | null;
  excludeValues?: string[];
  requiredValues?: string[];
  dedupeByPaper?: boolean;
  topK?: number | null;
};

const processQuery = (
  rawData: RawDataItem[] = [],
  opts: ProcessOptions
): CommonResult[] => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const {
    paperKey,
    labelKey,
    uniqueValueKey = null,
    excludeValues = [],
    requiredValues = [],
    dedupeByPaper = true,
    topK = null,
  } = opts;

  // 1) optionally dedupe by paper (keeps first occurrence)
  let rows = rawData;
  if (dedupeByPaper) {
    const seen = new Set<string>();
    rows = rawData.filter((row) => {
      const pid = String(row[paperKey] ?? '').trim();
      if (!pid || seen.has(pid)) return false;
      seen.add(pid);
      return true;
    });
  }

  // 2) If uniqueValueKey provided -> build map label -> Set(uniqueValue)
  if (uniqueValueKey) {
    const map = new Map<string, Set<string>>();
    for (const row of rows) {
      const label = String(row[labelKey] ?? '').trim();
      const val = String(row[uniqueValueKey] ?? '').trim();
      if (!label || !val) continue;
      if (excludeValues.includes(label) || excludeValues.includes(val))
        continue;
      if (!map.has(label)) map.set(label, new Set<string>());
      map.get(label)!.add(val);
    }
    // ensure required labels exist
    for (const req of requiredValues) {
      if (!map.has(req)) map.set(req, new Set<string>());
    }
    const entries = Array.from(map.entries()).map(([label, s]) => ({
      label,
      count: s.size,
    }));
    entries.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    const selected = topK ? entries.slice(0, topK) : entries;
    const base = selected.reduce((s, it) => s + it.count, 0);
    return selected.map(({ label, count }) => ({
      label,
      count,
      normalizedRatio: base > 0 ? Number(((count * 100) / base).toFixed(3)) : 0,
    }));
  }

  // 3) Otherwise count (per row or per deduped paper as above)
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = String(row[labelKey] ?? '').trim();
    if (!label) continue;
    if (excludeValues.includes(label)) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  for (const req of requiredValues) {
    if (!counts.has(req)) counts.set(req, 0);
  }
  const entries = Array.from(counts.entries()).map(([label, count]) => ({
    label,
    count,
  }));
  entries.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const selected = topK ? entries.slice(0, topK) : entries;
  const base = selected.reduce((s, it) => s + it.count, 0);
  return selected.map(({ label, count }) => ({
    label,
    count,
    normalizedRatio: base > 0 ? Number(((count * 100) / base).toFixed(3)) : 0,
  }));
};

export const Query1DataProcessingFunction = (
  rawData: RawDataItem[] = []
): CommonResult[] =>
  processQuery(rawData, {
    paperKey: 'paper',
    labelKey: 'evaluation_metricLabel',
    topK: 3,
  });

export const Query2DataProcessingFunction = (
  rawData: RawDataItem[] = []
): CommonResult[] =>
  processQuery(rawData, {
    paperKey: 'paper',
    labelKey: 'guidelineAvailabilityLabel',
    excludeValues: [
      'No',
      'Not reported',
      'No, but are made available upon request',
    ],
    requiredValues: [
      'Yes, via a non-persistent URL',
      'Yes, via a persistent URL',
    ],
  });

export const Query3DataProcessingFunction = (
  rawData: RawDataItem[] = []
): CommonResult[] =>
  processQuery(rawData, {
    paperKey: 'paper',
    labelKey: 'NLPTaskInputLabel',
  });

export const Query4DataProcessingFunction = (
  rawData: RawDataItem[] = []
): CommonResult[] =>
  processQuery(rawData, {
    paperKey: 'paper',
    labelKey: 'baseline_typeLabel',
    excludeValues: ['None'],
  });

export const Query5DataProcessingFunction = (
  rawData: RawDataItem[] = []
): CommonResult[] =>
  processQuery(rawData, {
    paperKey: 'paper',
    labelKey: 'NLPdataformatLabel',
    excludeValues: [''],
  });

export const Query6DataProcessingFunction = (
  rawData: RawDataItem[] = []
): CommonResult[] =>
  processQuery(rawData, {
    paperKey: 'paper',
    labelKey: 'intercoderReliabilityMetricLabel',
    excludeValues: [''],
  });

export const Query7DataProcessingFunction = (
  rawData: RawDataItem[] = []
): CommonResult[] =>
  processQuery(rawData, {
    paperKey: 'paper',
    labelKey: 'NLPTaskTypeLabel',
    uniqueValueKey: 'NLPdataset',
    excludeValues: [],
    requiredValues: [],
    dedupeByPaper: false,
    topK: null,
  });
