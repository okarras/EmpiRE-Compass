import type { Meta, StoryObj } from '@storybook/react';
import QuestionDataGridView from '../../src/components/QuestionDataGridView';

const meta: Meta<typeof QuestionDataGridView> = {
  title: 'Components/QuestionDataGridView',
  component: QuestionDataGridView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays a data grid view of the raw metadata (e.g., paper ID, year, data collection and analysis labels).',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof QuestionDataGridView>;

// Sample mock data to populate the table in Storybook
const mockData = [
  {
    paper: 'http://orkg.org/orkg/resource/R1387382',
    year: 1993,
    dc_label: 'no collection',
    da_label: 'no analysis',
  },
  {
    paper: 'http://orkg.org/orkg/resource/R1387400',
    year: 1993,
    dc_label: 'no collection',
    da_label: 'no analysis',
  },
  {
    paper: 'http://orkg.org/orkg/resource/R1388609',
    year: 1993,
    dc_label: 'no collection',
    da_label: 'no analysis',
  },
];

export const Default: Story = {
  args: {
    questionData: mockData,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This example renders a static preview of the QuestionDataGridView with mock publication metadata.',
      },
    },
  },
};
