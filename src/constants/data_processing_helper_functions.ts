export interface RawDataItem {
  [key: string]: unknown;
}

export const sortDataByYear = (
  rawData: { year: number; dc_label: string; da_label: string }[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  query_id: string = '',
  options: { reversed?: boolean } = {}
) => {
  const { reversed = false } = options;
  console.log('Sorting data by year:', rawData);
  // Sort the data by year
  rawData.sort((a, b) => a.year - b.year);
  let filteredData = rawData;
  if (reversed) {
    filteredData = rawData.filter(
      (item) =>
        item.dc_label === 'no collection' || item.da_label === 'no analysis'
    );
  } else {
    filteredData = rawData.filter(
      (item) =>
        item.dc_label !== 'no collection' && item.da_label !== 'no analysis'
    );
  }

  // Get the unique years from the data
  const years = [...new Set(rawData.map((item) => item.year))];

  // Get the number of items for each year
  const itemsPerYear = years.map((year) => {
    const count = filteredData.filter((item) => item.year === year).length;
    const rawCount = rawData.filter((item) => item.year === year).length;
    return {
      count,
      rawCount,
      year,
      ...rawData.find((item) => item.year === year), // Other properties
    };
  });

  // Find min and max counts

  // Normalize the counts
  return itemsPerYear.map((item) => ({
    ...item,
    normalizedRatio: Number(((item.count / item.rawCount) * 100).toFixed(2)),
  }));
};

export interface SortDataByCountReturnInterface {
  method: string;
  count: number; // target count after filtering
  rawCount?: number; // original count before filtering
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
  return chartData;
};

type StatisticItem = {
  year: number;
  descriptive: number;
  inferential: number;
  machine_learning: number;
  others: number;
};

export const countDataAnalysisStatisticsMethods = (data: StatisticItem[]) => {
  const processedData: StatisticItem[] = [];
  // get unique year values
  const uniqueYears = [...new Set(data.map((item) => item.year))];

  for (const year of uniqueYears) {
    const yearData = data.filter((item: StatisticItem) => item.year === year);
    // count the number of descriptive, inferential, machine learning and others
    const descriptiveCount = yearData.filter(
      (item: StatisticItem) => item.descriptive
    ).length;
    const inferentialCount = yearData.filter(
      (item: StatisticItem) => item.inferential
    ).length;
    const machineLearningCount = yearData.filter(
      (item: StatisticItem) => item.machine_learning
    ).length;
    const othersCount = yearData.filter(
      (item: StatisticItem) => item.others
    ).length;
    // add the counts to the data
    processedData.push({
      year,
      descriptive: descriptiveCount,
      inferential: inferentialCount,
      machine_learning: machineLearningCount,
      others: othersCount,
    });
  }
  processedData.sort((a, b) => a.year - b.year);
  return processedData;
};
