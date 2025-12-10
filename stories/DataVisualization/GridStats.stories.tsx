import type { Meta, StoryObj } from '@storybook/react-vite';
import GridStats from '../../src/components/GridStats';

const meta: Meta<typeof GridStats> = {
  title: 'DataVisualization/GridStats',
  component: GridStats,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`GridStats` displays column statistics and distribution analysis for tabular data from SPARQL query results. It provides interactive controls for selecting columns, grouping data, and toggling unique paper counting mode.\n\n**Key Features:**\n- Multi-column selection with distribution visualization\n- Grouping by any column (e.g., by year) to show temporal trends\n- Unique papers mode: counts each paper only once per value (like pandas drop_duplicates)\n- Automatic value normalization: case-insensitive capitalization, null handling\n- Visual distribution bars with percentages\n\n**Use Cases:**\n- Analyzing research method distributions across papers\n- Examining temporal trends in methodology adoption\n- Understanding dataset usage patterns\n- Identifying dominant values in categorical data',
      },
    },
  },
  argTypes: {
    questionData: {
      control: 'object',
      description:
        'Array of data records to analyze. Each record should be an object with string keys and values. Typically contains a "paper" field for unique paper identification and other categorical fields for analysis. Values are automatically normalized (capitalized, trimmed) and null/undefined/empty values are excluded from statistics.',
      table: {
        type: { summary: 'Record<string, unknown>[]' },
      },
    },
    gridOptions: {
      control: 'object',
      description:
        'Configuration object for default component state. Allows pre-selecting columns, setting a default grouping column, and enabling unique papers mode on mount. Useful for creating focused analysis views.',
      table: {
        type: {
          summary:
            '{ defaultColumns?: string[]; defaultGroupBy?: string; defaultUseUniquePapers?: boolean; }',
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GridStats>;

const mockQuestionData = [
  // 2018 papers
  {
    paper: 'R12345',
    year: '2018',
    empiricalMethod: 'Case Study',
    dataCollection: 'Interviews',
    dataAnalysis: 'Qualitative Coding',
    venue: 'RE Conference',
  },
  {
    paper: 'R12346',
    year: '2018',
    empiricalMethod: 'Survey',
    dataCollection: 'Questionnaire',
    dataAnalysis: 'Descriptive Statistics',
    venue: 'IEEE Software',
  },
  {
    paper: 'R12347',
    year: '2018',
    empiricalMethod: 'Case Study',
    dataCollection: 'Document Analysis',
    dataAnalysis: 'Thematic Analysis',
    venue: 'RE Conference',
  },
  {
    paper: 'R12348',
    year: '2018',
    empiricalMethod: 'Experiment',
    dataCollection: 'Controlled Experiment',
    dataAnalysis: 'Statistical Testing',
    venue: 'ICSE',
  },

  // 2019 papers
  {
    paper: 'R12349',
    year: '2019',
    empiricalMethod: 'Case Study',
    dataCollection: 'Interviews',
    dataAnalysis: 'Grounded Theory',
    venue: 'RE Conference',
  },
  {
    paper: 'R12350',
    year: '2019',
    empiricalMethod: 'Case Study',
    dataCollection: 'Observations',
    dataAnalysis: 'Qualitative Coding',
    venue: 'JSS',
  },
  {
    paper: 'R12351',
    year: '2019',
    empiricalMethod: 'Survey',
    dataCollection: 'Questionnaire',
    dataAnalysis: 'Descriptive Statistics',
    venue: 'EMSE',
  },
  {
    paper: 'R12352',
    year: '2019',
    empiricalMethod: 'Action Research',
    dataCollection: 'Participatory Observation',
    dataAnalysis: 'Reflection',
    venue: 'RE Conference',
  },
  {
    paper: 'R12353',
    year: '2019',
    empiricalMethod: 'Systematic Review',
    dataCollection: 'Literature Search',
    dataAnalysis: 'Meta-Analysis',
    venue: 'IST',
  },

  // 2020 papers
  {
    paper: 'R12354',
    year: '2020',
    empiricalMethod: 'Case Study',
    dataCollection: 'Interviews',
    dataAnalysis: 'Qualitative Coding',
    venue: 'RE Conference',
  },
  {
    paper: 'R12355',
    year: '2020',
    empiricalMethod: 'Case Study',
    dataCollection: 'Document Analysis',
    dataAnalysis: 'Content Analysis',
    venue: 'ICSE',
  },
  {
    paper: 'R12356',
    year: '2020',
    empiricalMethod: 'Survey',
    dataCollection: 'Online Survey',
    dataAnalysis: 'Inferential Statistics',
    venue: 'TSE',
  },
  {
    paper: 'R12357',
    year: '2020',
    empiricalMethod: 'Experiment',
    dataCollection: 'Controlled Experiment',
    dataAnalysis: 'ANOVA',
    venue: 'ICSE',
  },
  {
    paper: 'R12358',
    year: '2020',
    empiricalMethod: 'Case Study',
    dataCollection: 'Interviews',
    dataAnalysis: 'Thematic Analysis',
    venue: 'JSS',
  },
  {
    paper: 'R12359',
    year: '2020',
    empiricalMethod: 'Mixed Methods',
    dataCollection: 'Interviews + Survey',
    dataAnalysis: 'Triangulation',
    venue: 'EMSE',
  },

  // 2021 papers
  {
    paper: 'R12360',
    year: '2021',
    empiricalMethod: 'Case Study',
    dataCollection: 'Interviews',
    dataAnalysis: 'Grounded Theory',
    venue: 'RE Conference',
  },
  {
    paper: 'R12361',
    year: '2021',
    empiricalMethod: 'Survey',
    dataCollection: 'Questionnaire',
    dataAnalysis: 'Regression Analysis',
    venue: 'EMSE',
  },
  {
    paper: 'R12362',
    year: '2021',
    empiricalMethod: 'Case Study',
    dataCollection: 'Document Analysis',
    dataAnalysis: 'Qualitative Coding',
    venue: 'ICSE',
  },
  {
    paper: 'R12363',
    year: '2021',
    empiricalMethod: 'Systematic Review',
    dataCollection: 'Literature Search',
    dataAnalysis: 'Thematic Synthesis',
    venue: 'IST',
  },
  {
    paper: 'R12364',
    year: '2021',
    empiricalMethod: 'Case Study',
    dataCollection: 'Observations',
    dataAnalysis: 'Ethnography',
    venue: 'RE Conference',
  },
  {
    paper: 'R12365',
    year: '2021',
    empiricalMethod: 'Experiment',
    dataCollection: 'Lab Experiment',
    dataAnalysis: 'T-Test',
    venue: 'TSE',
  },
  {
    paper: 'R12366',
    year: '2021',
    empiricalMethod: 'Action Research',
    dataCollection: 'Participatory Design',
    dataAnalysis: 'Reflection',
    venue: 'JSS',
  },

  // 2022 papers
  {
    paper: 'R12367',
    year: '2022',
    empiricalMethod: 'Case Study',
    dataCollection: 'Interviews',
    dataAnalysis: 'Qualitative Coding',
    venue: 'RE Conference',
  },
  {
    paper: 'R12368',
    year: '2022',
    empiricalMethod: 'Survey',
    dataCollection: 'Online Survey',
    dataAnalysis: 'Descriptive Statistics',
    venue: 'EMSE',
  },
  {
    paper: 'R12369',
    year: '2022',
    empiricalMethod: 'Case Study',
    dataCollection: 'Document Analysis',
    dataAnalysis: 'Content Analysis',
    venue: 'ICSE',
  },
  {
    paper: 'R12370',
    year: '2022',
    empiricalMethod: 'Mixed Methods',
    dataCollection: 'Interviews + Observations',
    dataAnalysis: 'Triangulation',
    venue: 'JSS',
  },
  {
    paper: 'R12371',
    year: '2022',
    empiricalMethod: 'Case Study',
    dataCollection: 'Interviews',
    dataAnalysis: 'Thematic Analysis',
    venue: 'RE Conference',
  },
  {
    paper: 'R12372',
    year: '2022',
    empiricalMethod: 'Experiment',
    dataCollection: 'Controlled Experiment',
    dataAnalysis: 'Statistical Testing',
    venue: 'TSE',
  },
  {
    paper: 'R12373',
    year: '2022',
    empiricalMethod: 'Survey',
    dataCollection: 'Questionnaire',
    dataAnalysis: 'Factor Analysis',
    venue: 'EMSE',
  },
  {
    paper: 'R12374',
    year: '2022',
    empiricalMethod: 'Case Study',
    dataCollection: 'Focus Groups',
    dataAnalysis: 'Qualitative Coding',
    venue: 'ICSE',
  },

  // 2023 papers
  {
    paper: 'R12375',
    year: '2023',
    empiricalMethod: 'Case Study',
    dataCollection: 'Interviews',
    dataAnalysis: 'Grounded Theory',
    venue: 'RE Conference',
  },
  {
    paper: 'R12376',
    year: '2023',
    empiricalMethod: 'Survey',
    dataCollection: 'Online Survey',
    dataAnalysis: 'Structural Equation Modeling',
    venue: 'TSE',
  },
  {
    paper: 'R12377',
    year: '2023',
    empiricalMethod: 'Mixed Methods',
    dataCollection: 'Interviews + Survey',
    dataAnalysis: 'Triangulation',
    venue: 'EMSE',
  },
  {
    paper: 'R12378',
    year: '2023',
    empiricalMethod: 'Case Study',
    dataCollection: 'Document Analysis',
    dataAnalysis: 'Qualitative Coding',
    venue: 'ICSE',
  },
  {
    paper: 'R12379',
    year: '2023',
    empiricalMethod: 'Systematic Review',
    dataCollection: 'Literature Search',
    dataAnalysis: 'Meta-Analysis',
    venue: 'IST',
  },
  {
    paper: 'R12380',
    year: '2023',
    empiricalMethod: 'Case Study',
    dataCollection: 'Interviews',
    dataAnalysis: 'Thematic Analysis',
    venue: 'RE Conference',
  },
  {
    paper: 'R12381',
    year: '2023',
    empiricalMethod: 'Experiment',
    dataCollection: 'Online Experiment',
    dataAnalysis: 'Bayesian Analysis',
    venue: 'TSE',
  },
  {
    paper: 'R12382',
    year: '2023',
    empiricalMethod: 'Action Research',
    dataCollection: 'Participatory Design',
    dataAnalysis: 'Reflection',
    venue: 'JSS',
  },
];

export const Default: Story = {
  args: {
    questionData: mockQuestionData,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default GridStats component with Requirements Engineering research data from ORKG. The accordion is collapsed by default. Click to expand and use the column selector (ViewColumn icon) to choose which fields to analyze. Data includes 38 papers from 2018-2023 with empirical methods, data collection techniques, analysis approaches, and publication venues.',
      },
    },
  },
};

export const WithDefaultColumns: Story = {
  args: {
    questionData: mockQuestionData,
    gridOptions: {
      defaultColumns: ['empiricalMethod', 'dataCollection'],
      defaultUseUniquePapers: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'GridStats with pre-selected columns showing empirical method and data collection technique distributions. Unique papers mode is enabled, meaning each paper is counted only once per value (matching pandas drop_duplicates behavior). This configuration is useful for analyzing methodology adoption patterns across the research corpus. The accordion opens automatically when default columns are specified.',
      },
    },
  },
};

export const WithGrouping: Story = {
  args: {
    questionData: mockQuestionData,
    gridOptions: {
      defaultColumns: ['empiricalMethod'],
      defaultGroupBy: 'year',
      defaultUseUniquePapers: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "GridStats with temporal analysis enabled. Shows empirical method distribution grouped by publication year (2018-2023). This reveals trends in methodology adoption over time. For example, you can see that Case Study remains the dominant method across all years, while Mixed Methods approaches show increasing adoption in recent years. The grouped view displays separate tables for each year with percentages calculated within that year's papers.",
      },
    },
  },
};
