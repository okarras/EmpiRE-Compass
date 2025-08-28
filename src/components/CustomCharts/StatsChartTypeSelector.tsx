// StatsChartTypeSelector.tsx
import {
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Typography,
} from '@mui/material';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

interface StatsChartTypeSelectorProps {
  chartType: 'gauge' | 'card';
  setChartType: (type: 'gauge' | 'card') => void;
}

const StatsChartTypeSelector = ({
  chartType,
  setChartType,
}: StatsChartTypeSelectorProps) => {
  const handleChange = (
    _: React.MouseEvent<HTMLElement>,
    newType: 'gauge' | 'card' | null
  ) => {
    if (newType) setChartType(newType);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
      <Typography variant="body1" color="text.secondary">
        Display Mode:
      </Typography>
      <ToggleButtonGroup
        value={chartType}
        exclusive
        onChange={handleChange}
        size="small"
      >
        <ToggleButton
          value="gauge"
          aria-label="Gauge Charts"
          sx={{
            '&.Mui-selected': {
              backgroundColor: '#e86161',
              color: 'white',
            },
          }}
        >
          <DonutLargeIcon />
        </ToggleButton>
        <ToggleButton
          value="card"
          aria-label="Stat Cards"
          sx={{
            '&.Mui-selected': {
              backgroundColor: '#e86161',
              color: 'white',
            },
          }}
        >
          <ViewModuleIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default StatsChartTypeSelector;
