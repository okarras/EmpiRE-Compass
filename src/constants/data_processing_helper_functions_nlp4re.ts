export interface RawDataItem {
  [key: string]: unknown;
}

export const Query1DataProcessingFunction = (rawData: RawDataItem[]) => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];
  console.log('query raw result:', rawData);

  const getFirst = (row: RawDataItem, keys: string[]) => {
    for (const k of keys) {
      const v = row[k];
      if (v !== undefined && v !== null && String(v).trim() !== '')
        return String(v).trim();
    }
    return '';
  };

  const PAPER_KEYS = ['paper', 'paperId', 'paper_id', 'paperLabel'];
  const METRIC_KEYS = [
    'evaluation_metricLabel',
    'evaluation_metric_label',
    'metric',
    'metricLabel',
  ];

  const metricMap = new Map<string, Set<string> | number>();

  const hasPaperId = rawData.some((r) => getFirst(r, PAPER_KEYS) !== '');

  for (const row of rawData) {
    const metric = getFirst(row, METRIC_KEYS);
    if (!metric) continue;

    if (hasPaperId) {
      const pid = getFirst(row, PAPER_KEYS);
      if (!pid) continue;
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

  // convert to array of { metricLabel, count }
  const arr = Array.from(metricMap.entries()).map(([metric, val]) => ({
    metricLabel: metric,
    count: val instanceof Set ? val.size : (val as number),
  }));

  // sort by count desc and return top 3
  arr.sort(
    (a, b) => b.count - a.count || a.metricLabel.localeCompare(b.metricLabel)
  );
  console.log('query result:', arr);
  return arr.slice(0, 3);
};
