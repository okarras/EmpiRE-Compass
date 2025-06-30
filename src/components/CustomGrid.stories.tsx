import type { Meta, StoryObj } from '@storybook/react';
import MuiDataGrid from './CustomGrid';

const meta: Meta<typeof MuiDataGrid> = {
  title: 'Components/MuiDataGrid',
  component: MuiDataGrid,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `MuiDataGrid` component dynamically generates a data grid using `@mui/x-data-grid`, including custom cell rendering for URL fields. It supports pagination, sorting, and automatic column generation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MuiDataGrid>;

// Mock data for the grid
const mockData = [
  {
    id: 1,
    year: 2020,
    paper: 'https://example.org/resource/123',
    dc_label: 'no collection',
    da_label: 'analysis performed',
  },
  {
    id: 2,
    year: 2021,
    paper: 'https://example.org/resource/456',
    dc_label: 'collection performed',
    da_label: 'no analysis',
  },
  {
    id: 3,
    year: 2022,
    paper: 'not-a-link',
    dc_label: 'collection performed',
    da_label: 'analysis performed',
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
          'Displays a `MuiDataGrid` table using mock publication metadata. The `paper` column demonstrates link rendering for URLs and plain text for non-URLs.',
      },
    },
  },
};