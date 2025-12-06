import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { TemplateNode } from '../../src/components/Graph/TemplateNode';
import { TemplateProperty } from '../../src/components/Graph/types';

const empiricalStudyProperties: TemplateProperty[] = [
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
];

const withReactFlowProvider = (Story: React.ComponentType) => (
  <ReactFlowProvider>
    <div
      style={{
        background: '#1f2329',
        padding: '40px',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      <Story />
    </div>
  </ReactFlowProvider>
);

const meta: Meta<typeof TemplateNode> = {
  title: 'Graph/TemplateNode',
  component: TemplateNode,
  tags: ['autodocs'],
  decorators: [withReactFlowProvider],
  parameters: {
    docs: {
      description: {
        component:
          'Custom ReactFlow node displaying an ORKG template with properties and cardinality indicators. Must be wrapped in ReactFlowProvider.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        'Node data with title, properties array, nodeId, and templateId for ORKG link.',
      table: {
        type: {
          summary:
            '{ title: string; properties: TemplateProperty[]; nodeId: string; templateId: string }',
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TemplateNode>;

export const Default: Story = {
  args: {
    data: {
      title: 'Empirical Study',
      properties: empiricalStudyProperties,
      nodeId: 'node-470158',
      templateId: 'R470158',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Template node showing properties with various cardinality patterns and class references.',
      },
    },
  },
};
