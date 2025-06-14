export interface RawDataItem {
  [key: string]: unknown;
}

export const sortDataByYear = (
  rawData: { year: number; dc_label: string; da_label: string }[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _query_id: string = '',
  options: { reversed?: boolean } = {}
) => {
  const { reversed = false } = options;
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
  // number of all papers with da_label key
  const totalPapersWithDaLabel = rawData.filter((item) => item.da_label).length;

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
    normalizedRatio: Number(
      ((count * 100) / totalPapersWithDaLabel).toFixed(2)
    ),
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
  // 1) Define your threat fields
  const booleanFields = [
    'External',
    'Internal',
    'Construct',
    'Conclusion',
    'Reliability',
    'Generalizability',
    'Content',
    'Descriptive',
    'Theoretical',
    'Repeatability',
    'Mentioned',
  ];

  // 2) Deduplicate by paper URI (keep last entry)
  const paperMap = new Map<string, RawDataItem>();
  rawData.forEach((item) => paperMap.set(item.paper as string, item));
  const uniquePapers = Array.from(paperMap.values());

  // 3) Filter to papers having at least one threat = '1'
  const papersWithThreats = uniquePapers.filter((item) =>
    booleanFields.some((field) => item[field] === '1')
  );
  const totalPapersWithThreats = papersWithThreats.length;

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
    method: `${method}`,
    count,
    normalizedRatio:
      grandTotal > 0
        ? Number(((count * 100) / totalPapersWithThreats).toFixed(3))
        : 0, // Avoid division by zero
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
        ((count * 100) / papersPerYear[Number(year)]).toFixed(2)
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
  // 1) Deduplicate by paper
  const paperMap = new Map<string, CountMethodsRawDataInterface>();
  rawData.forEach((item) => paperMap.set(item.paper as string, item));
  //TODO: fix this
  const uniquePapers = rawData;

  // 2) Define which labels go into "others"
  const dataKeys = [
    'case study',
    'experiment',
    'survey',
    'interview',
    'secondary research',
    'action research',
  ];

  // 3) Aggregate counts per year × method
  const aggregatedData: Record<string, Record<string, number>> = {};
  uniquePapers.forEach(({ dc_method_type_label, year }) => {
    aggregatedData[year] = aggregatedData[year] || {};
    const key = dataKeys.includes(dc_method_type_label)
      ? dc_method_type_label
      : 'others';
    aggregatedData[year][key] = (aggregatedData[year][key] || 0) + 1;
  });

  // 4) For each year, compute per-year total and per-method ratios
  const result = Object.entries(aggregatedData)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([year, methods]) => {
      // per-year total = sum of all method counts for that year
      const totalPapersThisYear = Object.values(methods).reduce(
        (sum, c) => sum + c,
        0
      );

      // for each method, compute normalized = count / totalThisYear
      const normalizedFields = Object.fromEntries(
        Object.entries(methods).map(([method, count]) => [
          `normalized_${method}`,
          totalPapersThisYear > 0
            ? Number(((count * 100) / totalPapersThisYear).toFixed(2))
            : 0,
        ])
      );
      return {
        year,
        ...methods,
        ...normalizedFields,
      };
    });
  return result;
};

type StatisticItem = {
  paper: string;
  year: string;
  da_label?: string;
  descriptive?: string;
  inferential?: string;
  machine_learning?: string;
  method?: string;
};

export const countDataAnalysisStatisticsMethods = (
  rawData: StatisticItem[]
) => {
  const processedData: {
    year: number;
    descriptive: number;
    normalized_descriptive: number;
    inferential: number;
    normalized_inferential: number;
    machine_learning: number;
    normalized_machine_learning: number;
    method: number;
    normalized_method: number;
    others: number;
    normalized_others: number;
  }[] = [];

  // Step 1: deduplicate by paper URI
  const paperMap = new Map<string, StatisticItem>();
  rawData.forEach((item) => paperMap.set(item.paper, item));
  const uniqueData = Array.from(paperMap.values());

  // Step 2: get unique years
  const uniqueYears = [...new Set(uniqueData.map((item) => item.year))];

  for (const year of uniqueYears) {
    const yearData = uniqueData.filter((item) => item.year === year);
    const total = yearData.length;

    // Step 3: count each type
    let descriptive = 0,
      inferential = 0,
      machineLearning = 0,
      method = 0,
      others = 0;

    yearData.forEach((item) => {
      const daLabels = item.da_label?.toLowerCase();

      if (daLabels === 'descriptive') descriptive++;
      if (daLabels === 'inferential') inferential++;
      if (daLabels === 'machine learning') machineLearning++;
      if (daLabels === 'method') method++;

      // Count standard categories
      if (item.descriptive) descriptive++;
      if (item.inferential) inferential++;
      if (item.machine_learning) machineLearning++;
      if (item.method) method++;

      // Count 'others' as anything in da_label not in the four standard ones
      const label = item.da_label?.toLowerCase();
      const isOther =
        label &&
        !['descriptive', 'inferential', 'machine learning', 'method'].includes(
          label
        );
      if (isOther) others++;
    });

    processedData.push({
      year: Number(year),
      descriptive,
      normalized_descriptive: +((descriptive * 100) / total).toFixed(2),
      inferential,
      normalized_inferential: +((inferential * 100) / total).toFixed(2),
      machine_learning: machineLearning,
      normalized_machine_learning: +((machineLearning * 100) / total).toFixed(
        2
      ),
      method,
      normalized_method: +((method * 100) / total).toFixed(2),
      others,
      normalized_others: +((others * 100) / total).toFixed(2),
    });
  }

  // Sort by year ascending (convert year to number if needed)
  return processedData.sort((a, b) => a.year - b.year);
};
