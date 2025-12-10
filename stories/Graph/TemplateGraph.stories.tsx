import type { Meta, StoryObj } from '@storybook/react-vite';
import 'reactflow/dist/style.css';
import { TemplateGraph } from '../../src/components/Graph/TemplateGraph';
import { Template } from '../../src/components/Graph/types';

const empiricalStudyTemplate: Template[] = [
  {
    id: 'R470158',
    label: 'Empirical Study',
    description:
      'Template for describing empirical research studies in software engineering',
    target_class: { id: 'C470157', label: 'Empirical Study' },
    properties: [
      {
        id: 'P470159',
        label: 'Study Title',
        description: 'The title of the empirical study',
        order: 1,
        min_count: 1,
        max_count: 1,
        path: { id: 'P26', label: 'has title' },
      },
      {
        id: 'P470160',
        label: 'Research Question',
        description: 'The main research question(s) addressed by the study',
        order: 2,
        min_count: 1,
        max_count: null,
        path: { id: 'P32', label: 'has research question' },
      },
      {
        id: 'P470161',
        label: 'Study Type',
        description:
          'The type of empirical study (e.g., case study, experiment, survey)',
        order: 3,
        min_count: 1,
        max_count: 1,
        path: { id: 'P470162', label: 'has study type' },
        class: { id: 'C470163', label: 'Study Type' },
      },
      {
        id: 'P470164',
        label: 'Data Collection Method',
        description: 'Methods used to collect data in the study',
        order: 4,
        min_count: 1,
        max_count: null,
        path: { id: 'P470165', label: 'uses data collection method' },
        class: { id: 'C470166', label: 'Data Collection Method' },
      },
      {
        id: 'P470167',
        label: 'Sample Size',
        description: 'Number of participants or data points in the study',
        order: 5,
        min_count: 0,
        max_count: 1,
        path: { id: 'P470168', label: 'has sample size' },
        datatype: { id: 'xsd:integer', label: 'Integer' },
      },
      {
        id: 'P470169',
        label: 'Finding',
        description: 'Key findings or results from the study',
        order: 6,
        min_count: 1,
        max_count: null,
        path: { id: 'P470170', label: 'has finding' },
        class: { id: 'C470171', label: 'Finding' },
      },
    ],
  },
];

const researchPaperTemplates: Template[] = [
  {
    id: 'R380000',
    label: 'Research Paper',
    description:
      'Template for describing research papers in the ORKG knowledge graph',
    target_class: { id: 'C380001', label: 'Paper' },
    properties: [
      {
        id: 'P380002',
        label: 'Title',
        description: 'The title of the research paper',
        order: 1,
        min_count: 1,
        max_count: 1,
        path: { id: 'P26', label: 'has title' },
      },
      {
        id: 'P380003',
        label: 'Author',
        description: 'Authors who contributed to the paper',
        order: 2,
        min_count: 1,
        max_count: null,
        path: { id: 'P27', label: 'has author' },
        class: { id: 'C380010', label: 'Author' },
      },
      {
        id: 'P380004',
        label: 'Publication Year',
        description: 'Year when the paper was published',
        order: 3,
        min_count: 1,
        max_count: 1,
        path: { id: 'P29', label: 'has publication year' },
        datatype: { id: 'xsd:integer', label: 'Integer' },
      },
      {
        id: 'P380005',
        label: 'Venue',
        description: 'Conference or journal where the paper was published',
        order: 4,
        min_count: 0,
        max_count: 1,
        path: { id: 'P30', label: 'has venue' },
        class: { id: 'C380020', label: 'Venue' },
      },
      {
        id: 'P380006',
        label: 'DOI',
        description: 'Digital Object Identifier for the paper',
        order: 5,
        min_count: 0,
        max_count: 1,
        path: { id: 'P26', label: 'has DOI' },
      },
      {
        id: 'P380007',
        label: 'Research Field',
        description: 'Research field or domain of the paper',
        order: 6,
        min_count: 1,
        max_count: null,
        path: { id: 'P30', label: 'has research field' },
        class: { id: 'C380030', label: 'Research Field' },
      },
      {
        id: 'P380008',
        label: 'Contribution',
        description: 'Research contributions described in the paper',
        order: 7,
        min_count: 1,
        max_count: null,
        path: { id: 'P31', label: 'has contribution' },
        class: { id: 'C380040', label: 'Contribution' },
      },
    ],
  },
  {
    id: 'R380009',
    label: 'Author',
    description: 'Template for author information in ORKG',
    target_class: { id: 'C380010', label: 'Author' },
    properties: [
      {
        id: 'P380011',
        label: 'Name',
        description: 'Full name of the author',
        order: 1,
        min_count: 1,
        max_count: 1,
        path: { id: 'P1', label: 'has name' },
      },
      {
        id: 'P380012',
        label: 'ORCID',
        description: 'ORCID identifier for the author',
        order: 2,
        min_count: 0,
        max_count: 1,
        path: { id: 'P28', label: 'has ORCID' },
      },
      {
        id: 'P380013',
        label: 'Affiliation',
        description: 'Institution or organization affiliation',
        order: 3,
        min_count: 0,
        max_count: null,
        path: { id: 'P29', label: 'has affiliation' },
        class: { id: 'C380014', label: 'Organization' },
      },
      {
        id: 'P380015',
        label: 'Email',
        description: 'Contact email address',
        order: 4,
        min_count: 0,
        max_count: 1,
        path: { id: 'P30', label: 'has email' },
      },
    ],
  },
  {
    id: 'R380019',
    label: 'Venue',
    description: 'Template for publication venues (conferences, journals)',
    target_class: { id: 'C380020', label: 'Venue' },
    properties: [
      {
        id: 'P380021',
        label: 'Venue Name',
        description: 'Name of the conference or journal',
        order: 1,
        min_count: 1,
        max_count: 1,
        path: { id: 'P1', label: 'has name' },
      },
      {
        id: 'P380022',
        label: 'Venue Type',
        description: 'Type of venue (conference, journal, workshop)',
        order: 2,
        min_count: 1,
        max_count: 1,
        path: { id: 'P31', label: 'has type' },
      },
      {
        id: 'P380023',
        label: 'Publisher',
        description: 'Publisher of the venue',
        order: 3,
        min_count: 0,
        max_count: 1,
        path: { id: 'P32', label: 'has publisher' },
      },
    ],
  },
  {
    id: 'R380029',
    label: 'Research Field',
    description: 'Template for research fields and domains',
    target_class: { id: 'C380030', label: 'Research Field' },
    properties: [
      {
        id: 'P380031',
        label: 'Field Name',
        description: 'Name of the research field',
        order: 1,
        min_count: 1,
        max_count: 1,
        path: { id: 'P1', label: 'has name' },
      },
      {
        id: 'P380032',
        label: 'Parent Field',
        description: 'Broader research field this belongs to',
        order: 2,
        min_count: 0,
        max_count: 1,
        path: { id: 'P33', label: 'subfield of' },
        class: { id: 'C380030', label: 'Research Field' },
      },
    ],
  },
  {
    id: 'R380039',
    label: 'Contribution',
    description: 'Template for research contributions',
    target_class: { id: 'C380040', label: 'Contribution' },
    properties: [
      {
        id: 'P380041',
        label: 'Contribution Name',
        description: 'Name or title of the contribution',
        order: 1,
        min_count: 1,
        max_count: 1,
        path: { id: 'P1', label: 'has name' },
      },
      {
        id: 'P380042',
        label: 'Description',
        description: 'Detailed description of the contribution',
        order: 2,
        min_count: 0,
        max_count: 1,
        path: { id: 'P2', label: 'has description' },
      },
      {
        id: 'P380043',
        label: 'Method',
        description: 'Research method used in the contribution',
        order: 3,
        min_count: 0,
        max_count: null,
        path: { id: 'P34', label: 'uses method' },
        class: { id: 'C380044', label: 'Method' },
      },
      {
        id: 'P380045',
        label: 'Result',
        description: 'Results or findings from the contribution',
        order: 4,
        min_count: 0,
        max_count: null,
        path: { id: 'P35', label: 'has result' },
      },
    ],
  },
];

const meta: Meta<typeof TemplateGraph> = {
  title: 'Graph/TemplateGraph',
  component: TemplateGraph,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`TemplateGraph` is a ReactFlow-based visualization component that displays ORKG templates and their relationships as an interactive graph. Each template is rendered as a node showing its properties, and edges automatically connect templates that reference each other through class properties. The graph uses automatic layout algorithms to position nodes and supports pan, zoom, and interactive exploration. This component is used in the Admin panel to visualize template structures before importing them into the ORKG knowledge graph.',
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        'Array of Template objects to visualize in the graph. Each template must have an id, label, target_class, and optional properties array. The component automatically detects relationships between templates when a property\'s class.id matches another template\'s target_class.id, creating edges between the nodes. Empty array results in "No templates to display" message.',
      table: {
        type: { summary: 'Template[]' },
        defaultValue: { summary: '[]' },
      },
    },
    loading: {
      control: 'boolean',
      description:
        'Controls the loading state of the graph. When true, displays a centered CircularProgress spinner with "Loading templates..." text. When false, renders the graph or error/empty state. Typically set to true while fetching template data from the ORKG API.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    error: {
      control: 'text',
      description:
        'Error message to display when template loading fails. When provided (non-null/non-empty string), shows a red error Alert with the message text. When null or empty, the graph renders normally. Typically contains API error messages like "Failed to fetch template data from ORKG API".',
      table: {
        type: { summary: 'string | null' },
        defaultValue: { summary: 'null' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TemplateGraph>;

export const SingleTemplate: Story = {
  args: {
    data: empiricalStudyTemplate,
    loading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Single template graph showing the Empirical Study template from KG-EmpiRE with various property types and cardinality indicators.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export const ComplexGraph: Story = {
  args: {
    data: researchPaperTemplates,
    loading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complex interconnected template graph showing a Research Paper template structure with five related templates and automatic edge creation between referenced templates.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '700px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export const Error: Story = {
  args: {
    data: [],
    loading: false,
    error: 'Failed to fetch template data from ORKG API',
  },
  parameters: {
    docs: {
      description: {
        story: 'Template graph showing an error state when data loading fails.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};
