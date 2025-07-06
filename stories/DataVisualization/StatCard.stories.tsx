import type { Meta, StoryObj } from '@storybook/react-vite';
import StatCard from '../../src/components/StatCard';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import DescriptionIcon from '@mui/icons-material/Description';
import FlagIcon from '@mui/icons-material/Flag';
import StorageIcon from '@mui/icons-material/Storage';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Box } from '@mui/material';

const meta: Meta<typeof StatCard> = {
  title: 'Components/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'StatCard displays a centered icon in a circle, a numeric value (optional), and a label. Optionally, it acts as a link on click.',
      },
    },
  },
  argTypes: {
    children: {
      description: 'The icon or visual displayed in the top circle',
      control: false,
    },
    value: {
      description: 'A numeric value displayed below the icon',
      control: { type: 'number' },
    },
    label: {
      description: 'Text label shown at the bottom of the card',
      control: { type: 'text' },
    },
    link: {
      description: 'Optional URL that opens when the card is clicked',
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    label: 'Total Views',
    value: 123456,
    children: <InsertChartIcon fontSize="large" color="primary" />,
  },
};

export const Clickable: Story = {
  args: {
    label: 'View Details',
    value: 7890,
    link: 'https://example.com/details',
    children: <InsertChartIcon fontSize="large" color="action" />,
  },
};

export const WithoutValue: Story = {
  args: {
    label: 'Pending',
    children: <InsertChartIcon fontSize="large" />,
  },
};

export const DashboardGrid: Story = {
  render: () => (
    <Box display="flex" flexWrap="wrap" gap={2}>
      <StatCard label="Papers" value={711}>
        <DescriptionIcon fontSize="large" color="error" />
      </StatCard>
      <StatCard label="Venues" value={0}>
        <FlagIcon fontSize="large" color="error" />
      </StatCard>
      <StatCard label="Resources" value={66625}>
        <StorageIcon fontSize="large" color="error" />
      </StatCard>
      <StatCard label="Literals" value={28307}>
        <BarChartIcon fontSize="large" color="error" />
      </StatCard>
      <StatCard label="Properties" value={47466}>
        <BarChartIcon fontSize="large" color="error" />
      </StatCard>
      <StatCard label="Distinct Resources" value={8088}>
        <BarChartIcon fontSize="large" color="error" />
      </StatCard>
      <StatCard label="Distinct Literals" value={5251}>
        <BarChartIcon fontSize="large" color="error" />
      </StatCard>
      <StatCard label="Distinct Properties" value={196}>
        <BarChartIcon fontSize="large" color="error" />
      </StatCard>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Example layout showing multiple StatCard components as used in a real dashboard.',
      },
    },
  },
};
