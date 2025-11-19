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
