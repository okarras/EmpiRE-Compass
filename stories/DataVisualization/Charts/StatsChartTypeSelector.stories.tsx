import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Typography } from '@mui/material';
import StatsChartTypeSelector from '../../../src/components/CustomCharts/StatsChartTypeSelector';

const meta: Meta<typeof StatsChartTypeSelector> = {
  title: 'Charts/StatsChartTypeSelector',
  component: StatsChartTypeSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `StatsChartTypeSelector` component provides a toggle button group to switch between gauge chart and stat card display modes for statistics visualization. Used in the KG-EmpiRE Statistics page to allow users to choose their preferred visualization style for key metrics like paper counts, resource counts, and other ORKG statistics.',
      },
    },
  },
  argTypes: {
    chartType: {
      description:
        'Currently selected display mode. "gauge" shows circular gauge charts with animated progress indicators, while "card" shows compact stat cards with icons and numeric values. The selection affects how all statistics on the page are rendered.',
      control: 'radio',
      options: ['gauge', 'card'],
      table: {
        type: { summary: '"gauge" | "card"' },
        defaultValue: { summary: '"gauge"' },
      },
    },
    setChartType: {
      description:
        'Callback function invoked when the user clicks a toggle button. Receives the new chart type ("gauge" or "card") as the argument. Parent component should update state and re-render statistics with the new display mode.',
      action: 'setChartType',
      table: {
        type: { summary: '(type: "gauge" | "card") => void' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatsChartTypeSelector>;

// Interactive wrapper component
const InteractiveSelector = ({
  initialType = 'gauge',
}: {
  initialType?: 'gauge' | 'card';
}) => {
  const [chartType, setChartType] = useState<'gauge' | 'card'>(initialType);

  return (
    <Box>
      <StatsChartTypeSelector
        chartType={chartType}
        setChartType={setChartType}
      />
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Current selection: <strong>{chartType}</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {chartType === 'gauge'
            ? 'Gauge mode displays circular progress indicators with animated fills'
            : 'Card mode displays compact stat cards with icons and values'}
        </Typography>
      </Box>
    </Box>
  );
};

export const Default: Story = {
  args: {
    chartType: 'gauge',
    setChartType: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default state with gauge chart type selected. The gauge icon (DonutLargeIcon) is highlighted with the primary red color (#e86161), indicating it is the active selection.',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => <InteractiveSelector initialType="gauge" />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demonstration that allows toggling between gauge and card modes. Click the toggle buttons to switch between display modes and see the current selection update. In the actual Statistics page, this selection affects how all ORKG statistics are rendered.',
      },
    },
  },
};
