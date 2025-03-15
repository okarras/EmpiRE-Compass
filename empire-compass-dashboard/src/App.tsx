import Dashboard from './components/Dashboard';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SampleData from './../data/query_1_data_2024-07-26.json'

function App() {

  let chartData = SampleData;

  chartData.sort((a: { year: number }, b: { year: number }) => a.year - b.year);

  const dataYears = [
    ...new Set(chartData.map((item: { year: unknown }) => item.year)),
  ];

  const itemsPerYear = dataYears.map((year) => {
    return {
      count: chartData.filter((item: { year: unknown }) => item.year === year && item.dc_label == 'collection' && item.da_label == 'analysis' )
        .length,
      year: year,
    };
  });


  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#F8F8F8',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >

      {/* Header Section */}
      <Box
        sx={{
          width: '98%',
          backgroundColor: '#e86161',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          EmpiRE-Compass Dashboard
        </Typography>
      </Box>

      {/* Main Content Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          flexGrow: 1,
          flexDirection: "column"
        }}
      >
        <Dashboard />
      </Box>
    </Box>
  );
}

export default App;
