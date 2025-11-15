/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RawDataItem {
  [key: string]: unknown;
}

export const Query1DataProcessingFunction = (
  rawData: { year: number; dc_label: string; da_label: string }[]
) => {
  // Sort the data by year
  rawData.sort((a, b) => a.year - b.year);
  let filteredData = rawData;

  filteredData = rawData.filter(
    (item) =>
      item.dc_label !== 'no collection' && item.da_label !== 'no analysis'
  );

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
interface Query2DataCollenctionRawDataInterface {
  dc_method_type_label: string;
  paper: string;
  year: string;
}

export const Query2DataProcessingFunctionForDataCollection = (
  rawData: Query2DataCollenctionRawDataInterface[] = []
): Record<string, unknown>[] => {
  // 1) Count unique papers per year (for normalization denominator)
  const uniquePapersPerYear: Record<string, Set<string>> = {};
  rawData.forEach(({ paper, year }) => {
    if (!uniquePapersPerYear[year]) {
      uniquePapersPerYear[year] = new Set();
    }
    uniquePapersPerYear[year].add(paper as string);
  });

  // 2) Define which labels go into "others"
  const dataKeys = [
    'case study',
    'experiment',
    'survey',
    'interview',
    'secondary research',
    'action research',
  ];

  // 3) Aggregate counts per year × method (NOT deduplicated - one paper can have multiple methods)
  const aggregatedData: Record<string, Record<string, number>> = {};
  rawData.forEach(({ dc_method_type_label, year }) => {
    aggregatedData[year] = aggregatedData[year] || {};
    const key = dataKeys.includes(dc_method_type_label)
      ? dc_method_type_label
      : 'others';
    aggregatedData[year][key] = (aggregatedData[year][key] || 0) + 1;
  });

  // 4) For each year, compute normalized values by dividing by unique paper count
  const result = Object.entries(aggregatedData)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([year, methods]) => {
      // Number of unique papers for this year
      const uniquePaperCount = uniquePapersPerYear[year]?.size || 0;

      // For each method, compute normalized = count / uniquePaperCount
      const normalizedFields = Object.fromEntries(
        Object.entries(methods).map(([method, count]) => [
          `normalized_${method}`,
          uniquePaperCount > 0
            ? Number(((count / uniquePaperCount) * 100).toFixed(2))
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

export const Query2DataProcessingFunctionForDataAnalysis = (
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
      // Count standard categories
      if (item.descriptive) descriptive++;
      if (item.inferential) inferential++;
      if (item.machine_learning) machineLearning++;
      if (item.method) method++;

      // Count 'others' as anything in da_label not in the four standard ones
      Object.keys(item).forEach((key) => {
        if (
          key !== 'paper' &&
          key !== 'year' &&
          key !== 'da_label' &&
          key !== 'descriptive' &&
          key !== 'inferential' &&
          key !== 'machine_learning'
        ) {
          others++;
        }
      });
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

export const Query3DataProcessingFunction = (
  rawData: { year: number; dc_label: string; da_label: string }[]
) => {
  // Sort the data by year
  rawData.sort((a, b) => a.year - b.year);
  let filteredData = rawData;
  filteredData = rawData.filter(
    (item) =>
      item.dc_label === 'no collection' || item.da_label === 'no analysis'
  );

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

export const Query4DataProcessingFunctionForDataAnalysis = (
  rawData: RawDataItem[]
): RawDataItem[] => {
  const keys_to_count = ['descriptive', 'inferential', 'machine_learning'];
  const static_keys = ['da_label', 'paper', 'year'];

  // Initialize count object
  const labelCounts: { [key: string]: number } = {
    descriptive: 0,
    inferential: 0,
    machine_learning: 0,
    'other methods': 0,
  };

  rawData.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (keys_to_count.includes(key)) {
        labelCounts[key]++;
      } else if (!static_keys.includes(key)) {
        labelCounts['other methods']++;
      }
    });
  });

  const chartData = Object.keys(labelCounts).map((label) => ({
    methodType: label.charAt(0).toUpperCase() + label.slice(1),
    count: labelCounts[label],
    normalizedRatio: Number(
      ((labelCounts[label] * 100) / rawData.length).toFixed(2)
    ),
  }));

  return chartData;
};

export const Query4DataProcessingFunctionForDataCollection = (
  rawData: { dc_method_type_label: string }[]
): RawDataItem[] => {
  const keys_to_count = [
    'secondary research',
    'experiment',
    'survey',
    'case study',
    'interview',
    'action research',
  ];

  // Initialize all counts to 0
  const labelCounts: { [key: string]: number } = {
    'secondary research': 0,
    experiment: 0,
    survey: 0,
    'case study': 0,
    interview: 0,
    'action research': 0,
    others: 0,
  };

  rawData.forEach((item) => {
    const labelLower = item.dc_method_type_label?.toLowerCase();
    if (keys_to_count.includes(labelLower)) {
      labelCounts[labelLower]++;
    } else {
      labelCounts['others']++;
    }
  });
  const chartData = Object.keys(labelCounts).map((label) => ({
    methodType: label.charAt(0).toUpperCase() + label.slice(1),
    count: labelCounts[label],
    normalizedRatio: Number(
      ((labelCounts[label] * 100) / rawData.length).toFixed(2)
    ),
  }));

  return chartData;
};

export const Query5DataProcessingFunction =
  Query2DataProcessingFunctionForDataCollection;
export interface Query6DataProcessingFunctionForDataAnalysisReturnInterface {
  method: string;
  count: number; // target count after filtering
  rawCount?: number; // original count before filtering
  normalizedRatio: number;
}

export const Query6DataProcessingFunctionForDataAnalysis = (
  rawData: RawDataItem[] = []
): Query6DataProcessingFunctionForDataAnalysisReturnInterface[] => {
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

  const result: Query6DataProcessingFunctionForDataAnalysisReturnInterface[] =
    Object.entries(processedData).map(([method, count]) => ({
      method,
      count,
      normalizedRatio: Number(
        ((count * 100) / totalPapersWithDaLabel).toFixed(2)
      ),
    }));

  return result.sort((a, b) => b.count - a.count);
};

type StatisticalData = {
  paper: string;
  year: number | string;
  da_label: string; // Type of data analysis
  test?: string; // Test name (e.g., "shapiro-wilk test")
  count?: number;
  mean?: number;
  median?: number;
  standard_deviation?: number;
  variance?: number;
  mode?: number;
  range?: number;
  maximum?: number;
  minimum?: number;
  [key: string]: unknown; // Allow dynamic keys
};

export const Query7DataProcessingFunctionForInferentialStatistics = (
  rawData: StatisticalData[]
) => {
  if (!rawData.length) return [];

  // Step 1: Calculate total number of unique papers with da_label across ALL years
  // Equivalent to: df_query_7_2.drop_duplicates(subset=['paper'])['da_label'].count()
  const uniquePapersWithDaLabel = new Set<string>();
  rawData.forEach((item) => {
    if (item.paper && item.da_label) {
      uniquePapersWithDaLabel.add(item.paper);
    }
  });
  const number_of_all_papers_with_da = uniquePapersWithDaLabel.size;

  // Step 2: Extract unique years and convert to numbers
  const years = [...new Set(rawData.map((item) => Number(item.year)))].sort(
    (a, b) => a - b
  );

  // Step 3: Get all unique test values across all data (for unstack columns)
  // Equivalent to: df_query_7_2.groupby('year')['test'].value_counts().unstack()
  const uniqueTestValues = new Set<string>();
  rawData.forEach((item) => {
    if (item.test && typeof item.test === 'string' && item.test.trim()) {
      uniqueTestValues.add(item.test.trim());
    }
  });
  const testColumns = Array.from(uniqueTestValues).sort();

  // Step 4: Process data per year (groupby year) and count occurrences of each test
  const processedData = years.map((year) => {
    const filteredData = rawData.filter((item) => Number(item.year) === year);
    const result: { year: number; rowSum: number; [key: string]: number } = {
      year: Number(year),
      rowSum: 0,
    };

    // Count occurrences of each test value for this year
    // Equivalent to: value_counts() per year
    testColumns.forEach((testValue) => {
      const count = filteredData.filter(
        (item) => item.test && item.test.trim() === testValue
      ).length;

      // Use test value as column name (sanitize for JSON keys)
      const columnName = testValue.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      result[columnName] = count;
      result.rowSum += count;

      // Normalize: divide by total papers with da_label (across all years)
      // Equivalent to: (result[column] / number_of_all_papers_with_da).round(3)
      result[`normalized_${columnName}`] =
        number_of_all_papers_with_da > 0
          ? Number((count / number_of_all_papers_with_da).toFixed(3))
          : 0;
    });

    // Normalize rowSum
    result.normalized_rowSum =
      number_of_all_papers_with_da > 0
        ? Number((result.rowSum / number_of_all_papers_with_da).toFixed(3))
        : 0;

    return result;
  });
  console.log(processedData);

  const finalData = processedData.map((item) => {
    // Python script: (result[column] / number_of_all_papers_with_da).round(3)
    // normalized_rowSum is already calculated as (rowSum / number_of_all_papers_with_da).toFixed(3)
    // So we just need to ensure it's rounded to 3 decimals and handle edge case where > 0 but rounds to 0
    let normalizedRatio = item.normalized_rowSum;

    // If rowSum > 0 but normalized_rowSum rounds to 0.000, set to 0.001 to ensure bar has width
    if (item.rowSum > 0 && normalizedRatio === 0) {
      normalizedRatio = 0.001;
    }

    // Round to 3 decimal places (matching Python's .round(3))
    normalizedRatio = Number((normalizedRatio * 100).toFixed(3));

    return {
      year: Number(item.year),
      normalizedRatio,
      count: item.rowSum,
    };
  });
  console.log(finalData);
  return finalData;
};

export const Query7DataProcessingFunctionForDescriptiveStatistics = (
  rawData: StatisticalData[]
) => {
  if (!rawData.length) return [];
  // Extract unique years
  const years = [...new Set(rawData.map((item) => item.year))];

  // Identify all statistical method keys dynamically
  const methodKeys = Object.keys(rawData[0]).filter(
    (key) => key !== 'year' && key !== 'paper'
  );

  const processedData = years.map((year) => {
    const filteredData = rawData.filter((item) => item.year === year);
    const totalPapersWithDaLabel = filteredData.filter(
      (item) => item.da_label
    ).length;
    const result: { year: number; [key: string]: number } = {
      year: Number(year),
    };

    methodKeys.forEach((method) => {
      // Convert encoded string into a numeric value (count of occurrences)
      result[method] = filteredData.reduce(
        (sum, item) =>
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          sum + (item[method]?.replace(/[^1]/g, '').length || 0), // Counting occurrences of '1'
        0
      );
      result[`normalized_${method}`] =
        (result[method] * 100) / totalPapersWithDaLabel;
    });

    return result;
  });

  return processedData.sort((a, b) => a.year - b.year);
};

export const Query8DataProcessingFunction = (rawData: RawDataItem[]) => {
  // List of boolean‐threat fields
  const booleanFields = [
    'external',
    'internal',
    'construct',
    'conclusion',
    'reliability',
    'generalizability',
    'content',
    'descriptive',
    'theoretical',
    'repeatability',
    'mentioned',
  ];

  // 1) Normalize those "0"/"1" strings into real booleans
  const cleanedData = rawData.map((item) => {
    const newItem: RawDataItem = {
      ...item,
      year: parseInt(item.year as string, 10),
    };
    booleanFields.forEach((field) => {
      newItem[field] = item[field] === '1'; // true if "1", false otherwise
    });
    return newItem;
  });

  // 2) Deduplicate by paper URI (keep last occurrence)
  const paperMap = new Map<string, (typeof cleanedData)[0]>();
  cleanedData.forEach((item) => {
    paperMap.set(item.paper as string, item);
  });
  const uniquePapers = Array.from(paperMap.values());

  // 3) Count total papers per year
  const totalPapersPerYear: Record<number, number> = {};
  uniquePapers.forEach((item) => {
    totalPapersPerYear[item.year as number] =
      (totalPapersPerYear[item.year as number] || 0) + 1;
  });

  // 4) Filter for papers with at least one threat flagged
  const papersWithThreats = uniquePapers.filter((item) =>
    booleanFields.some((field) => item[field] === true)
  );

  // 5) Count threat-reporting papers per year
  const threatPapersPerYear: Record<number, number> = {};
  papersWithThreats.forEach((item) => {
    threatPapersPerYear[item.year as number] =
      (threatPapersPerYear[item.year as number] || 0) + 1;
  });

  // 6) Build final array with normalization
  const result = Object.keys(totalPapersPerYear).map((yearStr) => {
    const year = parseInt(yearStr, 10);
    const total = totalPapersPerYear[year] || 0;
    const withThreats = threatPapersPerYear[year] || 0;
    return {
      year,
      numberOfAllPapers: total,
      count: withThreats,
      normalizedRatio: total
        ? Number(((withThreats * 100) / total).toFixed(2))
        : 0,
    };
  });

  // Sort by year ascending
  return result.sort((a, b) => a.year - b.year);
};

interface Query9DataProcessingFunctionReturnInterface {
  method: string;
  count: number;
  normalizedRatio: number;
}

export const Query9DataProcessingFunction = (
  rawData: RawDataItem[] = []
): Query9DataProcessingFunctionReturnInterface[] => {
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

export const Query10DataProcessingFunction =
  Query2DataProcessingFunctionForDataCollection;

export const Query11DataProcessingFunction = (rawData: RawDataItem[]) => {
  // 1) Deduplicate by paper URI (keep last entry)
  const paperMap = new Map<string, RawDataItem>();
  rawData.forEach((item) => paperMap.set(item.paper as string, item));
  const uniquePapers = Array.from(paperMap.values());

  // 2) Count total unique papers per year
  const allPapersPerYear: Record<string, number> = {};
  uniquePapers.forEach(({ year }) => {
    allPapersPerYear[year as string] =
      (allPapersPerYear[year as string] || 0) + 1;
  });

  // 3) Count papers that provide at least one URL per year
  //    (assuming `url` is non‐empty when a paper has data)
  const papersWithDataPerYear: Record<string, number> = {};
  uniquePapers.forEach(({ year, url }) => {
    if (url) {
      papersWithDataPerYear[year as string] =
        (papersWithDataPerYear[year as string] || 0) + 1;
    }
  });

  // 4) Build final array with normalized ratio = dataPapers / totalPapers
  const result = Object.keys(allPapersPerYear)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map((yearStr) => {
      const total = allPapersPerYear[yearStr];
      const withData = papersWithDataPerYear[yearStr] || 0;
      return {
        year: parseInt(yearStr, 10),
        count: withData, // number of papers with a URL
        normalizedRatio:
          total > 0 ? Number(((withData * 100) / total).toFixed(2)) : 0,
      };
    });

  return result;
};

export const Query12DataProcessingFunction = (rawData: RawDataItem[]) => {
  // 0) Clean & normalize incoming strings
  const cleaned = rawData.map((item) => ({
    paper: item.paper,
    year: item.year, // keep as string so it shows up as "1993", etc.
    question: item.question,
    highlighted_q: item.highlighted_q === '1',
    highlighted_a: item.highlighted_a === '1',
  }));

  // 1) Dedupe by paper URI
  const paperMap = new Map<string, RawDataItem>();
  cleaned.forEach((item) => paperMap.set(item.paper as string, item));
  const uniquePapers = Array.from(paperMap.values());

  // 2) Build per‐year totals for normalization
  const papersPerYear: Record<string, number> = {};
  uniquePapers.forEach(({ year }) => {
    papersPerYear[year as string] = (papersPerYear[year as string] || 0) + 1;
  });

  // 3) Partition
  const noRQ = uniquePapers.filter((item) => item.question === 'No question');
  const hasRQ = uniquePapers.filter((item) => item.question !== 'No question');

  // 4) Helper to count per year given qFlag (or null to ignore) & aFlag
  const countComb = (
    arr: RawDataItem[],
    qFlag: boolean | null,
    aFlag: boolean
  ): Record<string, number> =>
    arr
      .filter((item) =>
        qFlag === null
          ? item.highlighted_a === aFlag
          : item.highlighted_q === qFlag && item.highlighted_a === aFlag
      )
      .reduce<Record<string, number>>((acc, { year }) => {
        acc[year as string] = (acc[year as string] || 0) + 1;
        return acc;
      }, {});

  const cnt_noRQ_HA = countComb(noRQ, null, true);
  const cnt_noRQ_HI = countComb(noRQ, null, false);
  const cnt_HQ_HA = countComb(hasRQ, true, true);
  const cnt_HQ_HI = countComb(hasRQ, true, false);
  const cnt_HiQ_HA = countComb(hasRQ, false, true);
  const cnt_HiQ_HI = countComb(hasRQ, false, false);

  // 5) Build output array
  const result = Object.keys(papersPerYear)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map((year) => {
      const total = papersPerYear[year as string] || 0;
      const c1 = cnt_noRQ_HA[year as string] || 0;
      const c2 = cnt_noRQ_HI[year as string] || 0;
      const c3 = cnt_HQ_HA[year as string] || 0;
      const c4 = cnt_HQ_HI[year as string] || 0;
      const c5 = cnt_HiQ_HA[year as string] || 0;
      const c6 = cnt_HiQ_HI[year as string] || 0;
      return {
        year,
        noRQHighlighted: c1,
        normalized_noRQHighlighted: total
          ? +((c1 * 100) / total).toFixed(2)
          : 0,
        noRQHidden: c2,
        normalized_noRQHidden: total ? +((c2 * 100) / total).toFixed(2) : 0,
        hqha: c3,
        normalized_hqha: total ? +((c3 * 100) / total).toFixed(2) : 0,
        hqhaHidden: c4,
        normalized_hqhaHidden: total ? +((c4 * 100) / total).toFixed(2) : 0,
        hidqha: c5,
        normalized_hidqha: total ? +((c5 * 100) / total).toFixed(2) : 0,
        hidqhid: c6,
        normalized_hidqhid: total ? +((c6 * 100) / total).toFixed(2) : 0,
      };
    });
  return result;
};

type Query13DataProcessingFunctionReturnInterface =
  Query6DataProcessingFunctionForDataAnalysisReturnInterface;
export const Query13DataProcessingFunction = (
  rawData: RawDataItem[] = []
): Query13DataProcessingFunctionReturnInterface[] => {
  if (!rawData.length) return [];

  const methodCount: Record<string, number> = {};

  rawData.forEach(({ dc_method_name }) => {
    methodCount[dc_method_name as string] =
      (methodCount[dc_method_name as string] || 0) + 1;
  });

  const result: Query13DataProcessingFunctionReturnInterface[] = Object.entries(
    methodCount
  ).map(([method, count]) => ({
    method,
    count,
    normalizedRatio: Number(((count * 100) / rawData.length).toFixed(2)),
  }));

  return result.sort((a, b) => b.count - a.count);
};

interface RawDataEntry {
  year: number;
  paper: string;
  dc_method_name: string;
}

interface Query14DataProcessingFunctionReturnInterface {
  year: number;
  [method: string]: number | string;
}

export const Query14DataProcessingFunction = (
  rawData: RawDataEntry[] = []
): Query14DataProcessingFunctionReturnInterface[] => {
  if (!rawData.length) return [];

  // Get unique papers per year
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

  // Group by year and count each method
  const methodCounts: Record<number, Record<string, number>> = {};
  rawData.forEach(({ year, dc_method_name }) => {
    if (!methodCounts[year]) methodCounts[year] = {};
    if (!dc_method_name) return;
    const methodKey = dc_method_name.replace(/\s+/g, '_');
    methodCounts[year][methodKey] = (methodCounts[year][methodKey] || 0) + 1;
  });

  // Calculate normalized values (percentage between 0 and 100 for better chart visibility)
  const result = Object.entries(methodCounts)
    .map(([year, methods]) => {
      const normalizedRatio: Record<string, number> = {};
      const totalPapers = papersPerYear[Number(year)];

      Object.entries(methods).forEach(([method, count]) => {
        normalizedRatio[method] = count;
        // Normalize to percentage (0-100 range) and round to 2 decimals
        normalizedRatio[`normalized_${method}`] = parseFloat(
          ((count / totalPapers) * 100).toFixed(2)
        );
      });

      return { year: Number(year), ...normalizedRatio };
    })
    .sort((a, b) => a.year - b.year); // Sort by year ascending

  return result;
};

export const Query15DataProcessingFunction = (
  rawData: RawDataItem[],
  rawData2: RawDataItem[]
) => {
  //merge rawData and rawData2 based on paper and year in each object
  const mergedData = rawData.map((item) => {
    const item2 = rawData2.find(
      (item2) => item2.paper === item.paper && item2.year === item.year
    );
    return {
      ...item,
      ...item2,
    };
  });

  // count each papers keys other than paper and year {Number of empirical methods used, Number of Papers using X empirical methods}
  const countedData = mergedData.map((item) => {
    const keys = Object.keys(item).filter(
      (key) => key !== 'paper' && key !== 'year'
    );
    let numberOfMethodsUsed = 0;
    keys.forEach((key) => {
      numberOfMethodsUsed += Number(item[key]);
    });
    return {
      ...item,
      numberOfMethodsUsed,
    };
  });

  //sort data by count
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  countedData.sort((a, b) => b.count - a.count);

  //count the number of papers in each count {numberOfMethodsUsed: number of papers, count: number of papers, normalizedRatio: number of papers / total number of papers}
  const result = countedData.reduce(
    (acc, item) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      acc[item.numberOfMethodsUsed] = (acc[item.numberOfMethodsUsed] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const arrayResult = Object.entries(result).map(([key, value]) => ({
    numberOfMethodsUsed: key,
    count: value,
    normalizedRatio:
      Number((((value as number) * 100) / countedData.length).toFixed(2)) || 0,
  }));

  return arrayResult;
};

export const Query16DataProcessingFunction = (
  rawData: any[],
  rawData2: any[]
): any[] => {
  if (!rawData.length || !rawData2.length) return [];

  //merge rawData and rawData2 based on paper and year in each object
  const mergedData = rawData.map((item) => {
    const item2 = rawData2.find(
      (item2) => item2.paper === item.paper && item2.year === item.year
    );
    return {
      ...item,
      ...item2,
    };
  });

  //Deduplicate mergedData based on paper and year
  const deduplicatedData = mergedData.filter(
    (item, index, self) =>
      index ===
      self.findIndex((t) => t.paper === item.paper && t.year === item.year)
  );

  const dataByYear: Record<number, Record<string, number>> = {};
  const totalByYear: Record<number, number> = {};
  const all_of_different_keys_in_duplicated_data: string[] = [];

  for (const item of deduplicatedData) {
    const keys = Object.keys(item).filter(
      (key) => key !== 'paper' && key !== 'year'
    );
    for (const key of keys) {
      if (!all_of_different_keys_in_duplicated_data.includes(key)) {
        all_of_different_keys_in_duplicated_data.push(key);
      }
    }
  }

  deduplicatedData.forEach((item) => {
    const year = item.year;
    const toNumber = (v: any) =>
      typeof v === 'number' ? v : parseInt(v || '0');

    const methodCount = all_of_different_keys_in_duplicated_data.reduce(
      (acc, key) => acc + toNumber(item[key]),
      0
    );

    if (!dataByYear[year]) {
      dataByYear[year] = {};
      totalByYear[year] = 0;
    }

    const key = methodCount.toFixed(1);
    dataByYear[year][key] = (dataByYear[year][key] || 0) + 1;
    totalByYear[year]++;
  });

  return Object.entries(dataByYear)
    .map(([yearStr, counts]) => {
      const year = parseInt(yearStr);
      const result: any = { year };

      Object.entries(counts).forEach(([methodKey, count]) => {
        result[methodKey] = count;
        result[`normalized_${methodKey}`] = parseFloat(
          ((count / totalByYear[year]) * 100).toFixed(2)
        );
      });

      return result;
    })
    .sort((a, b) => a.year - b.year);
};
