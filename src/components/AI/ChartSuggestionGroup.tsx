import React from 'react';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  BubbleChart as ScatterChartIcon,
  Radar as RadarIcon,
  InsertChartOutlined as DefaultChartIcon,
} from '@mui/icons-material';

interface ChartSuggestion {
  chartType: string;
  chartDescription: string;
}

interface ChartSuggestionGroupProps {
  suggestions: ChartSuggestion[];
  onSuggestionClick: (chartType: string) => void;
  disabled?: boolean;
}

const getChartIcon = (chartType: string) => {
  const lower = chartType.toLowerCase();
  if (lower.includes('bar')) return <BarChartIcon />;
  if (
    lower.includes('pie') ||
    lower.includes('doughnut') ||
    lower.includes('donut')
  )
    return <PieChartIcon />;
  if (lower.includes('line') || lower.includes('trend'))
    return <LineChartIcon />;
  if (lower.includes('scatter') || lower.includes('bubble'))
    return <ScatterChartIcon />;
  if (lower.includes('radar')) return <RadarIcon />;
  return <DefaultChartIcon />;
};

const ChartSuggestionGroup: React.FC<ChartSuggestionGroupProps> = ({
  suggestions,
  onSuggestionClick,
  disabled = false,
}) => {
  return (
    <Box sx={{ mt: 2, mb: 1, width: '100%' }}>
      <Typography
        variant="subtitle2"
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
          mb: 1.5,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
        }}
      >
        Suggested Visualization Alternatives
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 1.5,
          width: '100%',
        }}
      >
        {suggestions.map((suggestion, index) => (
          <Tooltip
            key={index}
            title={suggestion.chartDescription}
            arrow
            placement="top"
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, 8],
                    },
                  },
                ],
              },
            }}
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(33, 33, 33, 0.95)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  p: 1.5,
                  maxWidth: 280,
                  borderRadius: '8px',
                  border: '1px solid rgba(232, 97, 97, 0.2)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  lineHeight: 1.4,
                  '& .MuiTooltip-arrow': {
                    color: 'rgba(33, 33, 33, 0.95)',
                  },
                },
              },
            }}
          >
            <span>
              <Button
                variant="outlined"
                disabled={disabled}
                onClick={() => onSuggestionClick(suggestion.chartType)}
                startIcon={getChartIcon(suggestion.chartType)}
                sx={{
                  borderRadius: '12px',
                  px: 2.5,
                  py: 1.2,
                  borderColor: 'rgba(232, 97, 97, 0.3)',
                  color: '#e86161',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  backgroundColor: 'rgba(232, 97, 97, 0.02)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(232, 97, 97, 0.05)',
                  '&:hover': {
                    borderColor: '#e86161',
                    backgroundColor: 'rgba(232, 97, 97, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 12px rgba(232, 97, 97, 0.15)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                {suggestion.chartType}
              </Button>
            </span>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};

export default ChartSuggestionGroup;
