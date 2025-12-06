import type { Meta, StoryObj } from '@storybook/react-vite';
import ImportExportTab from '../../src/components/Admin/ImportExportTab';

// Mock template data
const mockTemplates = {
  'empirical-research': {
    id: 'empirical-research',
    title: 'Empirical Research Practice',
    description: 'Template for analyzing empirical research methodologies.',
    collectionName: 'empirical_research',
  },
  nlp4re: {
    id: 'nlp4re',
    title: 'NLP4RE',
    description: 'Template for NLP in Requirements Engineering.',
    collectionName: 'nlp4re',
  },
};

const meta: Meta<typeof ImportExportTab> = {
  title: 'Admin/ImportExportTab',
  component: ImportExportTab,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`ImportExportTab` provides functionality to export the current template as JSON or import template data from a JSON file. It displays two cards side by side for export and import operations.',
      },
    },
  },
  argTypes: {
    selectedTemplate: {
      control: 'select',
      options: ['empirical-research', 'nlp4re'],
      description: 'Currently selected template ID',
    },
    templates: {
      description: 'Record of template data objects',
    },
    onExport: {
      action: 'export clicked',
      description: 'Callback fired when export button is clicked',
    },
    onImport: {
      action: 'import data',
      description: 'Callback fired when JSON data is imported',
    },
    onError: {
      action: 'error occurred',
      description: 'Callback fired when an error occurs during import',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImportExportTab>;

export const Default: Story = {
  args: {
    selectedTemplate: 'empirical-research',
    templates: mockTemplates,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default import/export tab showing both export and import cards for the selected template.',
      },
    },
  },
};

export const NLP4RETemplate: Story = {
  args: {
    selectedTemplate: 'nlp4re',
    templates: mockTemplates,
  },
  parameters: {
    docs: {
      description: {
        story: 'Import/export tab with NLP4RE template selected.',
      },
    },
  },
};
