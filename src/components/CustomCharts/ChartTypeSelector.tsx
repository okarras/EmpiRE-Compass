import { ToggleButton, ToggleButtonGroup, Box, Typography } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';

interface ChartTypeSelectorProps {
  chartType: 'bar' | 'pie';
  setChartType: (type: 'bar' | 'pie') => void;
  availableCharts?: ('bar' | 'pie')[];
}

const ChartTypeSelector = ({ chartType, setChartType, availableCharts = ['bar', 'pie'] }: ChartTypeSelectorProps) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newType: 'bar' | 'pie' | null) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="body1" color="text.secondary">
        Chart Type:
      </Typography>
      <ToggleButtonGroup
        value={chartType}
        exclusive
        onChange={handleChange}
        aria-label="chart type"
        size="small"
      >
        {availableCharts.includes('bar') && (
          <ToggleButton 
            value="bar" 
            aria-label="bar chart"
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#e86161 !important',
                color: 'white !important',
              },
            }}
          >
            <BarChartIcon />
          </ToggleButton>
        )}
        {availableCharts.includes('pie') && (
          <ToggleButton 
            value="pie" 
            aria-label="pie chart"
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#e86161 !important',
                color: 'white !important',
              },
            }}
          >
            <PieChartIcon />
          </ToggleButton>
        )}
      </ToggleButtonGroup>
    </Box>
  );
};

export default ChartTypeSelector; 