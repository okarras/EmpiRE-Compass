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

export const Query2DataProcessingFunction = (
  rawData: Array<{
    paper: string;
    year: string;
    paperLabel: string;
    guidelineAvailabilityLabel: string;
  }> = []
): { year: number; count: number }[] => {
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
  return Object.entries(counts)
    .map(([y, c]) => ({ year: Number(y), count: c }))
    .sort((a, b) => a.year - b.year);
};

export default Query2DataProcessingFunction;

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
