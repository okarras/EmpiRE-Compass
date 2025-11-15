export interface RawDataItem {
  [key: string]: unknown;
}

type CommonResult = { label: string; count: number; normalizedRatio: number };

export type BoxPlotItem = {
  label: string;
  values: number[];
};

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

export const Query8DataProcessingFunction = (rawData: RawDataItem[] = []) => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const RE_KEY = 'RETaskLabel';
  const NLP_KEY = 'NLPTaskTypeLabel';
  const CONTRIB_KEY = 'contribution';
  const pairMap = new Map<string, Set<string>>();

  rawData.forEach((row, idx) => {
    const re = String(row[RE_KEY] ?? '').trim();
    const nlp = String(row[NLP_KEY] ?? '').trim();
    if (!re || !nlp) return;
    const contrib = String(row[CONTRIB_KEY] ?? `__row_${idx}`).trim();

    const key = `${re}||${nlp}`;
    if (!pairMap.has(key)) pairMap.set(key, new Set<string>());
    pairMap.get(key)!.add(contrib);
  });

  const result = Array.from(pairMap.entries()).map(([key, set]) => {
    const [re, nlp] = key.split('||');
    return { xLabel: nlp, yLabel: re, value: set.size };
  });

  result.sort((a, b) =>
    a.yLabel < b.yLabel
      ? -1
      : a.yLabel > b.yLabel
        ? 1
        : a.xLabel < b.xLabel
          ? -1
          : a.xLabel > b.xLabel
            ? 1
            : 0
  );

  return result;
};

export const Query9DataProcessingFunction = (
  rawData: Record<string, unknown>[] = []
): BoxPlotItem[] => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const KEYS = [
    'ratio_missing_approach',
    'ratio_missing_eval',
    'ratio_missing_nlptask',
    'ratio_missing_nlp_dataset',
    'ratio_annotation_missing',
  ];
  console.log('result:', rawData);

  return KEYS.map((key) => {
    const values = rawData
      .map((row) => Number(row[key]))
      .filter((v) => Number.isFinite(v));

    return { label: key, values };
  });
};

type RawRow = {
  NLPTaskTypeLabel?: unknown;
  numberOfAnnotators?: unknown;
};

export const Query10DataProcessingFunction = (
  rawData: RawRow[] = []
): Array<Record<string, unknown>> => {
  const jitterAmount = 0.3;

  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const points = rawData
    .map((r) => {
      const label = String(r?.NLPTaskTypeLabel ?? '').trim();
      const y = Number(r?.numberOfAnnotators ?? NaN);
      if (!label || !Number.isFinite(y)) return null;
      return { label, y };
    })
    .filter((v): v is { label: string; y: number } => v !== null);

  if (points.length === 0) return [];

  const labels = Array.from(new Set(points.map((p) => p.label)));

  const grouped: Record<string, number[]> = {};
  labels.forEach((lbl) => (grouped[lbl] = []));
  points.forEach((p) => grouped[p.label].push(p.y));

  const maxRows = Math.max(...Object.values(grouped).map((arr) => arr.length));

  const safe = (s: string) =>
    s.trim().replace(/\s+/g, '_').replace(/[^\w]/g, '');
  const labelIndex = Object.fromEntries(
    labels.map((lbl, idx) => [lbl, idx + 1])
  );

  const result = Array.from({ length: maxRows }).map((_, i) => {
    const row: Record<string, unknown> = { id: `row-${i}`, rowIndex: i };

    labels.forEach((lbl) => {
      const key = safe(lbl);
      const baseX = labelIndex[lbl];
      const jitterOffset = jitterAmount
        ? (Math.random() - 0.5) * jitterAmount
        : 0;
      row[`${key}_x`] = baseX + jitterOffset;
      row[`${key}_xLabel`] = lbl;
      row[`${key}_y`] = grouped[lbl][i] ?? null;
    });

    return row;
  });
  return result;
};
