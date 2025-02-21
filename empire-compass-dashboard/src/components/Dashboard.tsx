import { BarChart } from '@mui/x-charts/BarChart';
import data from '../../data/sample_data.json';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import Box from '@mui/material/Box';

const Dashboard = () => {
  //sort the data by year
  data.sort((a, b) => a.year - b.year);
  // get the unique years from the data
  const years = [...new Set(data.map((item) => item.year))];
  // get number of items for each year
  const itemsPerYear = years.map((year) => {
    return {
      count: data.filter((item) => item.year === year).length,
      year: year,
    };
  });

  const chartSetting = {
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
  };
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '20px',
      }}
    >
      <BarChart
        dataset={itemsPerYear}
        xAxis={[
          {
            scaleType: 'band',
            dataKey: 'year',
            valueFormatter: (v) => v.toString(),
            tickPlacement: 'middle',
          },
        ]}
        {...chartSetting}
        colors={['#e86161']}
      />
    </Box>
  );
};

export default Dashboard;
