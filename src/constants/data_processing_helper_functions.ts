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
