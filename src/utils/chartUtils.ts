import { ChartSetting } from '../constants/queries_chart_info';

export function truncateLabel(label: string, maxLength: number): string {
  if (typeof label !== 'string') {
    return String(label);
  }

  if (label.length <= maxLength) {
    return label;
  }

  return label.substring(0, maxLength) + '...';
}

export function calculateAutoLabelLength(
  chartSetting: ChartSetting,
  dataPointCount: number
): number {
  const CHAR_WIDTH = 8;
  const MIN_LENGTH = 10;
  const MAX_LENGTH = 50;
  const DEFAULT_WIDTH = 800;
  const DEFAULT_MARGIN_LEFT = 150;

  if (dataPointCount === 0) {
    return 20;
  }

  let maxLength: number;

  if (chartSetting.layout === 'horizontal') {
    const marginLeft =
      (chartSetting.margin as { left?: number } | undefined)?.left ||
      DEFAULT_MARGIN_LEFT;
    maxLength = Math.floor(marginLeft / CHAR_WIDTH);
  } else {
    const chartWidth = chartSetting.width || DEFAULT_WIDTH;
    const availableWidth = chartWidth / dataPointCount;
    maxLength = Math.floor(availableWidth / CHAR_WIDTH);
  }

  return Math.max(MIN_LENGTH, Math.min(MAX_LENGTH, maxLength));
}

export interface DynamicChartRow {
  [key: string]: unknown;
}

export interface DynamicChartSeriesItem {
  dataKey?: string;
  [key: string]: unknown;
}

export function calculateDynamicNormalizedDataset(
  dataset: DynamicChartRow[],
  series: DynamicChartSeriesItem[],
  normalized: boolean,
  normalizationType: 'per-year' | 'across-years' = 'per-year'
): DynamicChartRow[] {
  if (!normalized || !dataset || dataset.length === 0 || !series)
    return dataset;

  if (normalizationType === 'per-year') {
    // Single-series charts already have precomputed percentages (e.g. against all papers that year).
    // Normalizing 1 series against itself per row always yields 100%.
    if (series.length <= 1) {
      return dataset;
    }

    // Venue charts are already normalized per venue against their bucket total.
    if (
      series.some(
        (s) =>
          typeof s.dataKey === 'string' && s.dataKey.startsWith('normalized_v_')
      )
    ) {
      return dataset;
    }

    // Use precomputed normalized ratios when available in the dataset
    const hasPrecomputedNormalized = series.some((s) => {
      const seriesKey = s.dataKey;
      if (typeof seriesKey !== 'string') return false;
      const absKey = seriesKey.startsWith('normalized_')
        ? seriesKey.replace('normalized_', '')
        : seriesKey === 'normalizedRatio'
          ? 'count'
          : seriesKey;
      return dataset.some(
        (row) =>
          typeof row[`normalized_${absKey}`] === 'number' ||
          (seriesKey.startsWith('normalized_') &&
            typeof row[seriesKey] === 'number')
      );
    });

    if (hasPrecomputedNormalized) {
      return dataset.map((row) => {
        const newRow = { ...row };
        for (let i = 0; i < series.length; i++) {
          const seriesKey = series[i].dataKey;
          if (typeof seriesKey !== 'string') continue;
          const absKey = seriesKey.startsWith('normalized_')
            ? seriesKey.replace('normalized_', '')
            : seriesKey === 'normalizedRatio'
              ? 'count'
              : seriesKey;
          const precomputedVal =
            row[`normalized_${absKey}`] ??
            (seriesKey.startsWith('normalized_') ? row[seriesKey] : undefined);
          if (typeof precomputedVal === 'number') {
            newRow[seriesKey] = precomputedVal;
          }
        }
        return newRow;
      });
    }

    const absoluteKeys = series.map((s) => {
      const seriesKey = s.dataKey;
      return typeof seriesKey === 'string' &&
        seriesKey.startsWith('normalized_')
        ? seriesKey.replace('normalized_', '')
        : seriesKey === 'normalizedRatio'
          ? 'count'
          : seriesKey;
    });

    return dataset.map((row) => {
      let rowSum = 0;
      for (const key of absoluteKeys) {
        if (typeof row[key] === 'number') {
          rowSum += row[key] as number;
        }
      }

      const newRow = { ...row };
      for (let i = 0; i < series.length; i++) {
        const seriesKey = series[i].dataKey;
        const absKey = absoluteKeys[i];

        if (typeof row[absKey] === 'number') {
          const absoluteVal = row[absKey] as number;
          newRow[seriesKey as string] =
            rowSum > 0 ? Number(((absoluteVal / rowSum) * 100).toFixed(2)) : 0;
        }
      }

      return newRow;
    });
  } else if (normalizationType === 'across-years') {
    const absoluteKeys = series.map((s) => {
      const seriesKey = s.dataKey;
      return typeof seriesKey === 'string' &&
        seriesKey.startsWith('normalized_')
        ? seriesKey.replace('normalized_', '')
        : seriesKey === 'normalizedRatio'
          ? 'count'
          : seriesKey;
    });

    const seriesTotals: Record<string, number> = {};
    for (let i = 0; i < series.length; i++) {
      const absKey = absoluteKeys[i];
      seriesTotals[absKey] = dataset.reduce((sum, row) => {
        return sum + (typeof row[absKey] === 'number' ? row[absKey] : 0);
      }, 0);
    }

    return dataset.map((row) => {
      const newRow = { ...row };
      for (let i = 0; i < series.length; i++) {
        const seriesKey = series[i].dataKey;
        const absKey = absoluteKeys[i];
        const totalForSeries = seriesTotals[absKey];

        if (typeof row[absKey] === 'number') {
          const absoluteVal = row[absKey] as number;
          newRow[seriesKey as string] =
            totalForSeries > 0
              ? Number(((absoluteVal / totalForSeries) * 100).toFixed(2))
              : 0;
        }
      }
      return newRow;
    });
  }

  return dataset;
}

export function createLabelFormatter(
  chartSetting: ChartSetting,
  dataPointCount: number
): (value: unknown) => string {
  if (
    chartSetting.maxLabelLength === undefined ||
    chartSetting.maxLabelLength === null
  ) {
    return (value: unknown) => String(value);
  }

  const maxLabelLength = chartSetting.maxLabelLength;

  if (typeof maxLabelLength === 'number') {
    if (maxLabelLength < 4) {
      console.warn(
        `Invalid maxLabelLength value: ${maxLabelLength}. Must be >= 4. Using default behavior (no truncation).`
      );
      return (value: unknown) => String(value);
    }

    return (value: unknown) => truncateLabel(String(value), maxLabelLength);
  }

  if (maxLabelLength === 'auto') {
    const calculatedLength = calculateAutoLabelLength(
      chartSetting,
      dataPointCount
    );
    return (value: unknown) => truncateLabel(String(value), calculatedLength);
  }

  console.warn(
    `Invalid maxLabelLength type: ${typeof maxLabelLength}. Expected number, 'auto', or undefined.`
  );
  return (value: unknown) => String(value);
}
