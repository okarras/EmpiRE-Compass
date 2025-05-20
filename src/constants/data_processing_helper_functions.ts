export interface RawDataItem {
  [key: string]: unknown;
}

export const sortDataByYear = (rawData: { year: number }[]) => {
  // Sort the data by year
  rawData.sort((a, b) => a.year - b.year);

  // Get the unique years from the data
  const years = [...new Set(rawData.map((item) => item.year))];

  // Get the number of items for each year
  const itemsPerYear = years.map((year) => {
    const count = rawData.filter((item) => item.year === year).length;
    return {
      count,
      year,
      ...rawData.find((item) => item.year === year), // Other properties
    };
  });

  // Find min and max counts
  const counts = itemsPerYear.map((item) => item.count);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  // Normalize the counts
  return itemsPerYear.map((item) => ({
    ...item,
    normalizedRatio:
      maxCount !== minCount
        ? Number(
            (((item.count - minCount) / (maxCount - minCount)) * 100).toFixed(2)
          )
        : 0, // Avoid division by zero
  }));
};

export interface SortDataByCountReturnInterface {
  method: string;
  count: number;
  normalizedRatio: number;
}

export const sortDataByCount = (
  rawData: RawDataItem[] = []
): SortDataByCountReturnInterface[] => {
  if (!rawData.length) return [];

  const processedData: Record<string, number> = {};

  rawData.forEach((dataValue) => {
    Object.keys(dataValue).forEach((key) => {
      if ((dataValue[key] as number) > 0) {
        processedData[key] = (processedData[key] || 0) + 1;
      }
    });
  });

  const result: SortDataByCountReturnInterface[] = Object.entries(
    processedData
  ).map(([method, count]) => ({
    method,
    count,
    normalizedRatio: Number(((count * 100) / rawData.length).toFixed(2)),
  }));

  return result.sort((a, b) => b.count - a.count);
};

interface AggregateMethodUsageReturnInterface {
  method: string;
  count: number;
  normalizedRatio: number;
}

export const aggregateMethodUsage = (
  rawData: RawDataItem[] = []
): AggregateMethodUsageReturnInterface[] => {
  if (!rawData.length) return [];

  const processedData: Record<string, number> = {};
  let grandTotal = 0;

  rawData.forEach((valueObject) => {
    Object.keys(valueObject).forEach((method) => {
      if (method !== 'year' && method !== 'paper') {
        // Convert binary string to decimal number
        const countAsNumber = parseInt(valueObject[method] as string, 2);

        // Ensure valid number conversion
        if (!isNaN(countAsNumber)) {
          processedData[method] = (processedData[method] || 0) + countAsNumber;
          grandTotal += countAsNumber; // Correct grand total calculation
        }
      }
    });
  });

  return Object.entries(processedData).map(([method, count]) => ({
    method,
    count,
    normalizedRatio:
      grandTotal > 0 ? Number((count / grandTotal).toFixed(3)) : 0, // Avoid division by zero
  }));
};

interface RawDataEntry {
  year: number;
  paper: string;
  dc_method_name: string;
}

interface ProcessedYearlyData {
  year: number;
  [method: string]: number | string;
}

export const processYearlyMethodData = (
  rawData: RawDataEntry[] = []
): ProcessedYearlyData[] => {
  if (!rawData.length) return [];

  const uniquePapers: Record<number, Set<string>> = {};
  rawData.forEach(({ year, paper }) => {
    if (!uniquePapers[year]) uniquePapers[year] = new Set();
    uniquePapers[year].add(paper);
  });

  const papersPerYear = Object.fromEntries(
    Object.entries(uniquePapers).map(([year, papers]) => [
      Number(year),
      papers.size,
    ])
  );

  const methodCounts: Record<number, Record<string, number>> = {};
  rawData.forEach(({ year, dc_method_name }) => {
    if (!methodCounts[year]) methodCounts[year] = {};
    if (!dc_method_name) return;
    const methodKey = dc_method_name.replace(/\s+/g, '_');
    methodCounts[year][methodKey] = (methodCounts[year][methodKey] || 0) + 1;
  });

  return Object.entries(methodCounts).map(([year, methods]) => {
    const normalizedRatio: Record<string, number> = {};
    Object.entries(methods).forEach(([method, count]) => {
      normalizedRatio[method] = count;
      normalizedRatio[`normalized_${method}`] = parseFloat(
        (count / papersPerYear[Number(year)]).toFixed(2)
      );
    });
    return { year: Number(year), ...normalizedRatio };
  });
};

interface CountMethodsRawDataInterface {
  dc_method_type_label: string;
  paper: string;
  year: string;
}
export const countMethodDistribution = (
  rawData: CountMethodsRawDataInterface[] = []
): Record<string, unknown>[] => {
  console.log('rawData', rawData);
  const aggregatedData: Record<string, Record<string, number>> = {};
  rawData.forEach(({ dc_method_type_label, year }) => {
    if (!aggregatedData[year]) aggregatedData[year] = {};
    aggregatedData[year][dc_method_type_label] =
      (aggregatedData[year][dc_method_type_label] || 0) + 1;
  });
  const chartData = Object.entries(aggregatedData).map(([year, methods]) => ({
    year,
    ...methods,
  }));
  console.log('chartData', chartData);
  return chartData;
};
