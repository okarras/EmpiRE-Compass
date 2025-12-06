import type { Meta, StoryObj } from '@storybook/react-vite';
import ChartSettingsHelp from '../../src/components/Admin/ChartSettingsHelp';

const meta: Meta<typeof ChartSettingsHelp> = {
  title: 'Admin/ChartSettingsHelp',
  component: ChartSettingsHelp,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`ChartSettingsHelp` is an expandable accordion component that provides a comprehensive reference guide for chart configuration settings. It includes documentation for basic properties, axis configuration, series, colors, layout, margins, and complete examples.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChartSettingsHelp>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Interactive chart settings help accordion. Click to expand and view detailed chart configuration documentation including JSON examples, axis settings, series configuration, and pro tips.',
      },
    },
  },
};
