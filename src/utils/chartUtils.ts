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
      (chartSetting.margin as any)?.left || DEFAULT_MARGIN_LEFT;
    maxLength = Math.floor(marginLeft / CHAR_WIDTH);
  } else {
    const chartWidth = chartSetting.width || DEFAULT_WIDTH;
    const availableWidth = chartWidth / dataPointCount;
    maxLength = Math.floor(availableWidth / CHAR_WIDTH);
  }

  return Math.max(MIN_LENGTH, Math.min(MAX_LENGTH, maxLength));
}

export function calculateDynamicNormalizedDataset(
  dataset: any[],
  series: any[],
  normalized: boolean,
  normalizationType: 'per-year' | 'across-years' = 'per-year'
): any[] {
  if (!normalized || !dataset || dataset.length === 0 || !series)
    return dataset;

  if (normalizationType === 'per-year') {
    return dataset.map((row) => {
      // Map display keys to raw metric names to access the underlying unnormalized counts
      const absoluteKeys = series.map((s: any) => {
        const seriesKey = s.dataKey;
        return typeof seriesKey === 'string' &&
          seriesKey.startsWith('normalized_')
          ? seriesKey.replace('normalized_', '')
          : seriesKey === 'normalizedRatio'
            ? 'count'
            : seriesKey;
      });

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
    // Map display keys to raw metric names to access the underlying unnormalized counts
    const absoluteKeys = series.map((s: any) => {
      const seriesKey = s.dataKey;
      return typeof seriesKey === 'string' &&
        seriesKey.startsWith('normalized_')
        ? seriesKey.replace('normalized_', '')
        : seriesKey === 'normalizedRatio'
          ? 'count'
          : seriesKey;
    });

    // Aggregate raw counts across all years to establish the baseline for global percentage calculations
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
): (value: any) => string {
  if (
    chartSetting.maxLabelLength === undefined ||
    chartSetting.maxLabelLength === null
  ) {
    return (value: any) => String(value);
  }

  const maxLabelLength = chartSetting.maxLabelLength;

  if (typeof maxLabelLength === 'number') {
    if (maxLabelLength < 4) {
      console.warn(
        `Invalid maxLabelLength value: ${maxLabelLength}. Must be >= 4. Using default behavior (no truncation).`
      );
      return (value: any) => String(value);
    }

    return (value: any) => truncateLabel(String(value), maxLabelLength);
  }

  if (maxLabelLength === 'auto') {
    const calculatedLength = calculateAutoLabelLength(
      chartSetting,
      dataPointCount
    );
    return (value: any) => truncateLabel(String(value), calculatedLength);
  }

  console.warn(
    `Invalid maxLabelLength type: ${typeof maxLabelLength}. Expected number, 'auto', or undefined.`
  );
  return (value: any) => String(value);
}
