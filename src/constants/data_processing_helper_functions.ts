export interface RawDataItem {
  [key: string]: unknown;
}

export const sortDataByYear = (
  rawData: { year: number }[],
  query_id?: string
) => {
  if (query_id === 'query_12') {
    console.log('query_12', rawData);
  }

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
        ? Number(((item.count - minCount) / (maxCount - minCount)).toFixed(2))
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
      if (dataValue[key] as number > 0) {
        processedData[key] = (processedData[key] || 0) + 1;
      }
    });
  });

  const result: SortDataByCountReturnInterface[] = Object.entries(
    processedData
  ).map(([method, count]) => ({
    method,
    count,
    normalizedRatio: Number((count / rawData.length).toFixed(2)),
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

interface PaperData {
  paper: string;
  number_of_dc_methods?: number;
  number_of_inf_methods?: number;
  number_of_des_methods?: number;
  number_of_ml_methods?: number;
  number_of_other_methods?: number;
}

interface ProcessedMethodDistribution {
  methodDistribution: number;
  count: number;
  normalizedRatio: number;
}

export const processMethodDistribution = (
  rawData: PaperData[] = []
): ProcessedMethodDistribution[] => {
  //TODO: Add the second rawData parameter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData2: any[] = [];
  if (!rawData.length && !rawData2.length) return [];

  const dataMap = new Map<string, Required<PaperData>>();

  rawData.forEach(({ paper, number_of_dc_methods = 0 }) => {
    dataMap.set(paper, {
      paper,
      number_of_dc_methods,
      number_of_inf_methods: 0,
      number_of_des_methods: 0,
      number_of_ml_methods: 0,
      number_of_other_methods: 0,
    });
  });

  rawData2.forEach(({ paper, ...methods }) => {
    if (dataMap.has(paper)) {
      const existing = dataMap.get(paper)!;
      Object.keys(methods).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        existing[key as keyof PaperData] +=
          methods[key as keyof PaperData] || 0;
      });
    } else {
      dataMap.set(paper, {
        paper,
        number_of_dc_methods: 0,
        number_of_inf_methods: methods.number_of_inf_methods || 0,
        number_of_des_methods: methods.number_of_des_methods || 0,
        number_of_ml_methods: methods.number_of_ml_methods || 0,
        number_of_other_methods: methods.number_of_other_methods || 0,
      });
    }
  });

  const methodCounts: Record<
    number,
    { count: number; methodDistribution: number }
  > = {};
  dataMap.forEach(
    ({
      number_of_dc_methods,
      number_of_inf_methods,
      number_of_des_methods,
      number_of_ml_methods,
      number_of_other_methods,
    }) => {
      const totalMethods =
        number_of_dc_methods +
        number_of_inf_methods +
        number_of_des_methods +
        number_of_ml_methods +
        number_of_other_methods;
      if (!methodCounts[totalMethods]) {
        methodCounts[totalMethods] = {
          count: 0,
          methodDistribution: totalMethods,
        };
      }
      methodCounts[totalMethods].count++;
    }
  );

  const sortedMethodCounts = Object.values(methodCounts).sort(
    (a, b) => a.methodDistribution - b.methodDistribution
  );
  const totalPapers = sortedMethodCounts.reduce(
    (sum, { count }) => sum + count,
    0
  );

  return sortedMethodCounts.map(({ methodDistribution, count }) => ({
    methodDistribution,
    count,
    normalizedRatio: parseFloat((count / totalPapers).toFixed(3)),
  }));
};
