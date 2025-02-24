import { axisClasses } from '@mui/x-charts';

export const query_1_chart_info = {
  chartSetting: {
    yAxis: [
      {
        label: 'number of papers',
      },
    ],
    series: [{ dataKey: 'count' }],
    height: 300,
    sx: {
      [`& .${axisClasses.directionY} .${axisClasses.label}`]: {
        transform: 'translateX(-10px)',
      },
    },
  },

  dataProcessingFunction: (data: {year: number}[]) => {
    //sort the data by year
    data.sort((a: { year: number; }, b: { year: number; }) => a.year - b.year);
    // get the unique years from the data
    const years = [...new Set(data.map((item: { year: unknown; }) => item.year))];
    // get number of items for each year
    const itemsPerYear = years.map((year) => {
      return {
        count: data.filter((item: { year: unknown; }) => item.year === year).length,
        year: year,
      };
    });
    return itemsPerYear;
  },
};
