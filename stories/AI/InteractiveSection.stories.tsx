import type { Meta, StoryObj } from '@storybook/react-vite';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import InteractiveSection from '../../src/components/AI/InteractiveSection';
import { DynamicQuestionProvider } from '../../src/context/DynamicQuestionContext';
import questionReducer from '../../src/store/slices/questionSlice';
import aiReducer from '../../src/store/slices/aiSlice';

const mockStore = configureStore({
  reducer: {
    questions: questionReducer,
    ai: aiReducer,
  },
});

const meta: Meta<typeof InteractiveSection> = {
  title: 'AI/InteractiveSection',
  component: InteractiveSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`InteractiveSection` provides an editable content section with AI modification capabilities. It supports three content types: SPARQL queries, chart HTML, and analysis text. Users can manually edit content via a TextField, or use AI-assisted modifications through a dialog interface. The component tracks change history and integrates with the DynamicQuestionContext for state management. This is a reusable building block for editable sections throughout the dynamic question workflow.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description:
        'The title displayed at the top of the section. Styled with the primary color (#e86161) and bold font weight. Should describe the content type (e.g., "SPARQL Query", "Data Analysis Interpretation").',
      table: {
        type: { summary: 'string' },
      },
    },
    content: {
      control: 'text',
      description:
        'The content to display and edit. Can be plain text, SPARQL query code, or HTML depending on the `type` and `isHtml` props. Displayed in a styled box with monospace font for code content.',
      table: {
        type: { summary: 'string' },
      },
    },
    type: {
      control: 'select',
      options: ['sparql', 'chart', 'analysis'],
      description:
        'The type of content, which affects AI modification behavior and output format. "sparql" expects SPARQL query output, "chart" expects complete HTML with Chart.js, "analysis" expects plain text analysis.',
      table: {
        type: { summary: "'sparql' | 'chart' | 'analysis'" },
      },
    },
    analysisType: {
      control: 'select',
      options: ['question', 'dataCollection', 'dataAnalysis'],
      description:
        'Specific analysis type when `type` is "analysis". Provides additional context to the AI for generating appropriate content. "question" for research question interpretation, "dataCollection" for data gathering explanation, "dataAnalysis" for results interpretation.',
      table: {
        type: { summary: "'question' | 'dataCollection' | 'dataAnalysis'" },
      },
    },
    placeholder: {
      control: 'text',
      description:
        'Placeholder text shown in the edit TextField when content is empty. Should guide users on what to enter.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'Enter content...'" },
      },
    },
    multiline: {
      control: 'boolean',
      description:
        'Whether the edit TextField should be multiline. Set to true for SPARQL queries, chart HTML, and longer analysis text. Set to false for short single-line content.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    rows: {
      control: 'number',
      description:
        'Initial number of rows for the multiline TextField. Determines the default height of the edit area.',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '4' },
      },
    },
    maxRows: {
      control: 'number',
      description:
        'Maximum number of rows the multiline TextField can expand to. Limits the height of the edit area.',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '8' },
      },
    },
    isHtml: {
      control: 'boolean',
      description:
        'Whether the content should be rendered as HTML using dangerouslySetInnerHTML. Set to true for chart HTML content. When false, content is displayed as plain text.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onContentChange: {
      action: 'contentChanged',
      description:
        'Callback fired when content is changed, either through manual editing or AI modification. Receives the new content string and optionally the AI prompt used for modification.',
      table: {
        type: { summary: '(content: string, prompt?: string) => void' },
      },
    },
  },
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <DynamicQuestionProvider>
          <div style={{ maxWidth: '800px', padding: '20px' }}>
            <Story />
          </div>
        </DynamicQuestionProvider>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InteractiveSection>;

// SPARQL query content for ORKG
const sparqlContent = `PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX orkgc: <http://orkg.org/orkg/class/>
PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?year (COUNT(DISTINCT ?paper) AS ?paperCount)
WHERE {
  ?contribution orkgp:P31 orkgr:R54312 .
  ?paper orkgp:P31 ?contribution .
  ?paper orkgp:P29 ?year .
  FILTER(BOUND(?year) && ?year != "")
}
GROUP BY ?year
ORDER BY ?year`;

// data analysis interpretation content
const analysisContent = `The analysis of empirical studies in Requirements Engineering reveals several significant trends:

**Growth Pattern**: Publications have increased by 247% from 2018 (45 papers) to 2023 (156 papers), demonstrating sustained growth in empirical RE research.

**Key Observations**:
1. **Accelerating Growth**: Year-over-year growth rates have increased from 38% (2018-2019) to 26% (2022-2023), indicating continued momentum.
2. **Research Maturity**: The consistent upward trend suggests the RE community increasingly values empirical validation of methods and tools.
3. **Post-2020 Surge**: A notable acceleration after 2020 may correlate with increased emphasis on evidence-based software engineering practices.

**Implications**: The data supports the hypothesis that empirical methods are becoming standard practice in RE research, moving beyond theoretical contributions to validated, reproducible studies.`;

export const SPARQLQuery: Story = {
  args: {
    title: 'SPARQL Query',
    content: sparqlContent,
    type: 'sparql',
    placeholder: 'Enter SPARQL query...',
    multiline: true,
    rows: 12,
    maxRows: 20,
    isHtml: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive section for editing SPARQL queries. Uses multiline input with monospace font styling. AI modifications will return valid SPARQL syntax. The edit and AI modify buttons allow users to refine the query.',
      },
    },
  },
};

export const DataAnalysisInterpretation: Story = {
  args: {
    title: 'Data Analysis Interpretation',
    content: analysisContent,
    type: 'analysis',
    analysisType: 'dataAnalysis',
    placeholder: 'Enter your interpretation of the analysis results...',
    multiline: true,
    rows: 8,
    maxRows: 15,
    isHtml: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive section for data analysis interpretation. Contains insights, patterns, and conclusions from the query results. AI modifications will generate clear, academic-style analysis text.',
      },
    },
  },
};
