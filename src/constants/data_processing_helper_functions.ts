interface RawDataItem {
  [key: string]: number;
}

export const sortDataByYear = (rawData: { year: number }[]) => {
  //sort the data by year
  rawData.sort((a: { year: number }, b: { year: number }) => a.year - b.year);
  // get the unique years from the data
  const years = [
    ...new Set(rawData.map((item: { year: unknown }) => item.year)),
  ];
  // get number of items for each year
  const itemsPerYear = years.map((year) => {
    return {
      count: rawData.filter((item: { year: unknown }) => item.year === year)
        .length,
      year: year,
    };
  });
  return itemsPerYear;
};

interface SortDataByCountReturnInterface {
  method: string;
  count: number;
  ratio: number;
}

export const sortDataByCount = (
  rawData: RawDataItem[] = []
): SortDataByCountReturnInterface[] => {
  console.log('rawData', rawData);
  if (!rawData.length) return [];

  const processedData: Record<string, number> = {};

  rawData.forEach((dataValue) => {
    Object.keys(dataValue).forEach((key) => {
      if (dataValue[key] > 0) {
        processedData[key] = (processedData[key] || 0) + 1;
      }
    });
  });

  const result: SortDataByCountReturnInterface[] = Object.entries(processedData).map(
    ([method, count]) => ({
      method,
      count,
      ratio: Number((count / rawData.length).toFixed(2)),
    })
  );

  return result.sort((a, b) => b.count - a.count);
};

interface AggregateMethodUsageReturnInterface {
  method: string;
  count: number;
  normalized: number;
}

export const aggregateMethodUsage = (rawData: RawDataItem[] = []): AggregateMethodUsageReturnInterface[] => {
  if (!rawData.length) return [];

  const processedData: Record<string, number> = {};
  let grandTotal = 0;

  rawData.forEach(valueObject => {
    Object.keys(valueObject).forEach(method => {
      if (method !== "year" && method !== "paper") {
        processedData[method] = (processedData[method] || 0) + valueObject[method];
      }
    });
    
    if (Object.values(valueObject).includes(1)) {
      grandTotal += 1;
    }
  });

  return Object.entries(processedData).map(([method, count]) => ({
    method,
    count,
    normalized: Number((count / grandTotal).toFixed(3)),
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

export const processYearlyMethodData = (rawData: RawDataEntry[] = []): ProcessedYearlyData[] => {
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
    const normalized: Record<string, number> = {};
    Object.entries(methods).forEach(([method, count]) => {
      normalized[method] = count;
      normalized[`normalized_${method}`] = parseFloat(
        (count / papersPerYear[Number(year)]).toFixed(2)
      );
    });
    return { year: Number(year), ...normalized };
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
  normalized: number;
}

export const processMethodDistribution = (rawData: PaperData[] = [], rawData2: PaperData[] = []): ProcessedMethodDistribution[] => {
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
        existing[key as keyof PaperData] += methods[key as keyof PaperData] || 0;
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

  const methodCounts: Record<number, { count: number; methodDistribution: number }> = {};
  dataMap.forEach(({ number_of_dc_methods, number_of_inf_methods, number_of_des_methods, number_of_ml_methods, number_of_other_methods }) => {
    const totalMethods = number_of_dc_methods + number_of_inf_methods + number_of_des_methods + number_of_ml_methods + number_of_other_methods;
    if (!methodCounts[totalMethods]) {
      methodCounts[totalMethods] = { count: 0, methodDistribution: totalMethods };
    }
    methodCounts[totalMethods].count++;
  });

  const sortedMethodCounts = Object.values(methodCounts).sort((a, b) => a.methodDistribution - b.methodDistribution);
  const totalPapers = sortedMethodCounts.reduce((sum, { count }) => sum + count, 0);

  return sortedMethodCounts.map(({ methodDistribution, count }) => ({
    methodDistribution,
    count,
    normalized: parseFloat((count / totalPapers).toFixed(3)),
  }));
};
