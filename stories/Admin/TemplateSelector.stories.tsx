import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import TemplateSelector from '../../src/components/Admin/TemplateSelector';
import { TemplateData } from '../../src/firestore/TemplateManagement';

// mock template data matching actual ORKG template structures
const mockTemplates: Record<string, TemplateData> = {
  'empirical-research': {
    id: 'empirical-research',
    title: 'Empirical Research Practice',
    description:
      'Template for analyzing empirical research methodologies and practices in software engineering. Includes questions about research methods, data collection, analysis techniques, and threats to validity.',
    collectionName: 'empirical_research',
  },
  nlp4re: {
    id: 'nlp4re',
    title: 'NLP4RE',
    description:
      'Template for Natural Language Processing for Requirements Engineering research analysis. Covers NLP techniques, RE tasks, evaluation methods, and tool support.',
    collectionName: 'nlp4re',
  },
  'machine-learning': {
    id: 'machine-learning',
    title: 'Machine Learning Studies',
    description:
      'Template for analyzing machine learning research papers and methodologies. Includes model architectures, datasets, evaluation metrics, and reproducibility aspects.',
    collectionName: 'ml_studies',
  },
  'systematic-reviews': {
    id: 'systematic-reviews',
    title: 'Systematic Literature Reviews',
    description:
      'Template for systematic literature review and mapping study analysis. Covers search strategies, inclusion criteria, quality assessment, and synthesis methods.',
    collectionName: 'slr_studies',
  },
};

const meta: Meta<typeof TemplateSelector> = {
  title: 'Admin/TemplateSelector',
  component: TemplateSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`TemplateSelector` displays a grid of template cards that allow administrators to select which template they want to manage in the admin panel. Each card shows the template title, description, and metadata chips (template ID and Firestore collection name). The selected template is highlighted with a colored border (#e86161). Templates are stored in the root "Templates" Firestore collection, with Questions and Statistics as subcollections.',
      },
    },
  },
  argTypes: {
    templates: {
      control: 'object',
      description:
        "Record of TemplateData objects keyed by template ID. Each TemplateData object contains: id (unique identifier), title (display name), description (optional explanatory text), and collectionName (Firestore collection name for the template's data). The templates are rendered as a responsive grid of cards.",
      table: {
        type: { summary: 'Record<string, TemplateData>' },
      },
    },
    selectedTemplate: {
      control: 'select',
      options: [
        '',
        'empirical-research',
        'nlp4re',
        'machine-learning',
        'systematic-reviews',
      ],
      description:
        "The ID of the currently selected template. The corresponding card is highlighted with a red border (#e86161). An empty string indicates no selection. This value should be managed by the parent component's state.",
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
    onSelectTemplate: {
      action: 'template selected',
      description:
        'Callback fired when a template card is clicked. Receives the template ID string as the argument. The parent component should update its selectedTemplate state with this value to reflect the selection visually.',
      table: {
        type: { summary: '(templateId: string) => void' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TemplateSelector>;

export const Default: Story = {
  args: {
    templates: mockTemplates,
    selectedTemplate: 'empirical-research',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Template selector with multiple templates displayed as cards in a responsive grid. The "Empirical Research Practice" template is selected and highlighted with a red border. Each card shows the template title, description, and metadata chips (template ID and Firestore collection name).',
      },
    },
  },
};

// Interactive story with state management
const InteractiveTemplate = () => {
  const [selected, setSelected] = useState('empirical-research');
  return (
    <TemplateSelector
      templates={mockTemplates}
      selectedTemplate={selected}
      onSelectTemplate={setSelected}
    />
  );
};

export const Interactive: Story = {
  render: () => <InteractiveTemplate />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive template selector where clicking any card updates the selection state with visual feedback. Click different template cards to see the red border highlight move to the selected template.',
      },
    },
  },
};
