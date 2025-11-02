/**
 * Data transformation utilities for processing SPARQL query results
 */

/**
 * Transform method/category data by year
 */
export const transformMethodDataByYear = (
  data: Record<string, unknown>[]
): Record<string, unknown>[] => {
  const yearGroups = new Map<string, Map<string, number>>();

  if (!data || data.length === 0) return [];

  const firstItem = data[0] as Record<string, unknown>;
  const methodField =
    Object.keys(firstItem).find(
      (key) =>
        key.toLowerCase().includes('method') ||
        key.toLowerCase().includes('type') ||
        key.toLowerCase().includes('label')
    ) || 'method_type_label';

  const countField =
    Object.keys(firstItem).find(
      (key) =>
        key.toLowerCase().includes('count') ||
        typeof firstItem[key] === 'number'
    ) || 'method_count';

  // Group data by year and method type
  data.forEach((item) => {
    const year = String((item as Record<string, unknown>)['year'] || 'Unknown');
    const methodType = String(
      (item as Record<string, unknown>)[methodField] || 'Unknown'
    );
    const count = parseInt(
      String((item as Record<string, unknown>)[countField] || '0')
    );

    if (!yearGroups.has(year)) {
      yearGroups.set(year, new Map());
    }

    const yearData = yearGroups.get(year)!;
    yearData.set(methodType, (yearData.get(methodType) || 0) + count);
  });

  // Transform to chart-friendly format
  return Array.from(yearGroups.entries())
    .map(([year, methods]) => {
      const result: Record<string, unknown> = {
        year: parseInt(year) || year,
      };

      methods.forEach((count, methodType) => {
        const cleanMethodType = methodType
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .toLowerCase();
        result[cleanMethodType] = count;
      });

      return result;
    })
    .sort((a, b) => {
      const yearA =
        typeof (a as Record<string, unknown>)['year'] === 'number'
          ? ((a as Record<string, unknown>)['year'] as number)
          : parseInt(String((a as Record<string, unknown>)['year']));
      const yearB =
        typeof (b as Record<string, unknown>)['year'] === 'number'
          ? ((b as Record<string, unknown>)['year'] as number)
          : parseInt(String((b as Record<string, unknown>)['year']));
      return (yearA || 0) - (yearB || 0);
    });
};

/**
 * Process dynamic data with fallback logic
 */
export const processDynamicData = (
  data: Record<string, unknown>[]
): Record<string, unknown>[] => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('processDynamicData received invalid data:', data);
    return [];
  }

  const firstItem = data[0] as Record<string, unknown>;
  const keys = Object.keys(firstItem);

  // Check if this looks like method/category data with counts
  const hasMethodType = keys.some(
    (key) =>
      key.toLowerCase().includes('method') ||
      key.toLowerCase().includes('type') ||
      key.toLowerCase().includes('label')
  );
  const hasCount = keys.some(
    (key) =>
      key.toLowerCase().includes('count') || typeof firstItem[key] === 'number'
  );
  const hasYear = keys.includes('year');

  // If this is method/category data by year, transform appropriately
  if (hasYear && hasMethodType && hasCount) {
    return transformMethodDataByYear(data);
  }

  // Get all unique numeric keys from the data
  const allKeys = new Set<string>();
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== 'year' && key !== 'paper' && typeof item[key] === 'number') {
        allKeys.add(key);
      }
    });
  });

  // If we have year data, group by year
  if (data.some((item) => (item as Record<string, unknown>)['year'])) {
    const yearGroups = new Map<string, Record<string, unknown>[]>();

    data.forEach((item) => {
      const year = String(
        (item as Record<string, unknown>)['year'] || 'Unknown'
      );
      if (!yearGroups.has(year)) {
        yearGroups.set(year, []);
      }
      yearGroups.get(year)!.push(item);
    });

    return Array.from(yearGroups.entries())
      .map(([year, items]) => {
        const result: Record<string, unknown> = {
          year: parseInt(year) || year,
        };

        allKeys.forEach((key) => {
          const values = items
            .map((item) => (item as Record<string, unknown>)[key])
            .filter((val) => typeof val === 'number') as number[];
          if (values.length > 0) {
            const sum = values.reduce((sum, val) => sum + val, 0);
            result[key] = sum;
            result[`normalized_${key}`] =
              values.length > 0
                ? Number(((sum / items.length) * 100).toFixed(2))
                : 0;
          }
        });

        return result;
      })
      .sort((a, b) => {
        const yearA =
          typeof (a as Record<string, unknown>)['year'] === 'number'
            ? ((a as Record<string, unknown>)['year'] as number)
            : parseInt(String((a as Record<string, unknown>)['year']));
        const yearB =
          typeof (b as Record<string, unknown>)['year'] === 'number'
            ? ((b as Record<string, unknown>)['year'] as number)
            : parseInt(String((b as Record<string, unknown>)['year']));
        return (yearA || 0) - (yearB || 0);
      });
  }

  // If no year data, return as is
  return data;
};
