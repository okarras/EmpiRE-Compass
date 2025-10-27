export interface RawDataItem {
  [key: string]: unknown;
}

export const Query1DataProcessingFunction = (rawData: RawDataItem[] = []) => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const getFirst = (row: RawDataItem, keys: string[]) => {
    for (const k of keys) {
      const v = row[k];
      if (v !== undefined && v !== null && String(v).trim() !== '')
        return String(v).trim();
    }
    return '';
  };

  const PAPER_KEYS = [
    'paper',
    'paperId',
    'paper_id',
    'paperLabel',
    'paperLabel.value',
  ];
  const METRIC_KEYS = [
    'evaluation_metricLabel',
    'evaluation_metric_label',
    'metric',
    'metricLabel',
  ];

  const hasPaperId = rawData.some((r) => getFirst(r, PAPER_KEYS) !== '');

  const metricMap = new Map<string, Set<string> | number>();
  const uniquePaperIds = new Set<string>();

  for (const row of rawData) {
    const metric = getFirst(row, METRIC_KEYS);
    if (!metric) continue;

    if (hasPaperId) {
      const pid = getFirst(row, PAPER_KEYS);
      if (!pid) continue;
      uniquePaperIds.add(pid);
      let set = metricMap.get(metric) as Set<string> | undefined;
      if (!set) {
        set = new Set<string>();
        metricMap.set(metric, set);
      }
      (set as Set<string>).add(pid);
    } else {
      const cur = (metricMap.get(metric) as number) ?? 0;
      metricMap.set(metric, cur + 1);
    }
  }

  const allMetrics = Array.from(metricMap.entries()).map(([metric, val]) => ({
    metricLabel: metric,
    count: val instanceof Set ? val.size : (val as number),
  }));

  allMetrics.sort(
    (a, b) => b.count - a.count || a.metricLabel.localeCompare(b.metricLabel)
  );
  const top3 = allMetrics.slice(0, 3);

  const topSum = top3.reduce((s, it) => s + it.count, 0);

  const result = top3.map((it) => ({
    metricLabel: it.metricLabel,
    count: it.count,
    normalizedRatio:
      topSum > 0 ? Number(((it.count * 100) / topSum).toFixed(3)) : 0,
  }));

  return result;
};

export const Query2DataProcessingFunction = (
  rawData: Array<{
    paper: string;
    year: string;
    paperLabel: string;
    guidelineAvailabilityLabel: string;
  }> = []
): { year: number; count: number; normalizedRatio: number }[] => {
  if (!rawData.length) return [];

  // 1) Deduplicate by paper (keep last occurrence)
  const paperMap = new Map<string, (typeof rawData)[0]>();
  rawData.forEach((item) => paperMap.set(item.paper, item));
  const uniquePapers = Array.from(paperMap.values());

  // 2) Filter for papers where guideline availability indicates “Yes” / “Available” / URL present
  const guidelineAvailable = uniquePapers.filter((item) =>
    /Yes|available|http|url/i.test(item.guidelineAvailabilityLabel)
  );
  // 3) Count papers with guidelines per year
  const counts: Record<string, number> = {};
  guidelineAvailable.forEach(({ year }) => {
    if (!year) return;
    const yearMatch = String(year).match(/(\d{4})/); // matches 2019 or 2019-07-01
    if (!yearMatch) return;
    const y = yearMatch[1];
    counts[y] = (counts[y] || 0) + 1;
  });
  // 4) Convert to sorted array (numeric years)
  const total = guidelineAvailable.length || 0;

  return Object.entries(counts)
    .map(([y, c]) => ({
      year: Number(y),
      count: c,
      normalizedRatio: total > 0 ? Number(((c * 100) / total).toFixed(3)) : 0,
    }))
    .sort((a, b) => a.year - b.year);
};

export const Query3DataProcessingFunction = (
  rawData: Array<{ NLPTaskInputLabel?: string }> = []
): { id: string; label: string; value: number }[] => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const counts: Record<string, number> = {};

  rawData.forEach((row) => {
    const label = (row.NLPTaskInputLabel || '').trim();
    if (!label) return;
    counts[label] = (counts[label] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([label, value], index) => ({
      id: `slice-${index}`,
      label,
      value,
    }))
    .sort((a, b) => b.value - a.value);
};

export const Query4DataProcessingFunction = (
  rawData: Array<{ baseline_typeLabel?: string; paper?: string }> = []
): { baseline_typeLabel: string; count: number; normalizedRatio: number }[] => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const paperMap = new Map<
    string,
    { baseline_typeLabel?: string; paper?: string }
  >();
  rawData.forEach((item, idx) => {
    const pid =
      item.paper && String(item.paper).trim() !== ''
        ? String(item.paper).trim()
        : `__nopaper_${idx}`;
    paperMap.set(pid, { ...item, paper: pid });
  });
  const uniquePapers = Array.from(paperMap.values());
  const counts: Record<string, number> = {};
  uniquePapers.forEach((row) => {
    const type = String(row.baseline_typeLabel ?? '').trim();
    if (!type) return;
    counts[type] = (counts[type] || 0) + 1;
  });

  const total = uniquePapers.length || 0;
  return Object.entries(counts)
    .map(([baseline_typeLabel, count]) => ({
      baseline_typeLabel,
      count,
      normalizedRatio:
        total > 0 ? Number(((count * 100) / total).toFixed(3)) : 0,
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.baseline_typeLabel.localeCompare(b.baseline_typeLabel)
    );
};
