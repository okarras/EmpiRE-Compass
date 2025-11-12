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

export const Query2DataProcessingFunction = (rawData: any[] = []) => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const getFirst = (row: any, keys: string[]) => {
    for (const k of keys) {
      const v = row?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        return String(v).trim();
      }
    }
    return '';
  };

  const PAPER_KEYS = ['paper'];
  const GUIDELINE_KEYS = ['guidelineAvailabilityLabel'];

  const paperMap = new Map<string, any>();
  for (const row of rawData) {
    const pid = getFirst(row, PAPER_KEYS);
    if (pid) paperMap.set(pid, row);
  }

  const uniquePapers = Array.from(paperMap.values());

  const counts = new Map<string, number>();
  for (const row of uniquePapers) {
    const label = getFirst(row, GUIDELINE_KEYS) || 'Unknown';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = Array.from(counts.values()).reduce((s, n) => s + n, 0);

  const result = Array.from(counts.entries()).map(([label, count]) => ({
    guidelineAvailabilityLabel: label,
    count,
    normalizedRatio: total > 0 ? Number(((count * 100) / total).toFixed(3)) : 0,
  }));

  result.sort(
    (a, b) =>
      b.count - a.count ||
      a.guidelineAvailabilityLabel.localeCompare(b.guidelineAvailabilityLabel)
  );
  console.log('result', result);
  return result;
};

export const Query3DataProcessingFunction = (rawData: any[] = []) => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const getFirst = (row: any, keys: string[]) => {
    for (const k of keys) {
      const v = row?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        return String(v).trim();
      }
    }
    return '';
  };

  const LABEL_KEYS = ['NLPTaskInputLabel'];

  const counts = new Map<string, number>();

  for (const row of rawData) {
    const label = getFirst(row, LABEL_KEYS);
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = Array.from(counts.values()).reduce((s, n) => s + n, 0);

  // Build result
  const result = Array.from(counts.entries()).map(([label, count]) => ({
    label,
    count,
    normalizedRatio: total > 0 ? Number(((count * 100) / total).toFixed(3)) : 0,
  }));

  // Sort by count desc
  result.sort((a, b) => b.count - a.count);

  return result;
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
