import type { Meta, StoryObj } from '@storybook/react-vite';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import QueryExecutionSection from '../../src/components/AI/QueryExecutionSection';
import { DynamicQuestionProvider } from '../../src/context/DynamicQuestionContext';
import questionReducer from '../../src/store/slices/questionSlice';
import aiReducer from '../../src/store/slices/aiSlice';

const mockStore = configureStore({
  reducer: {
    questions: questionReducer,
    ai: aiReducer,
  },
});

const meta: Meta<typeof QueryExecutionSection> = {
  title: 'AI/QueryExecutionSection',
  component: QueryExecutionSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`QueryExecutionSection` is a comprehensive orchestration component that combines AI configuration, dynamic question management, SPARQL query editing, and iteration history into a unified workflow. It displays the full query execution pipeline including AI refinement progress with detailed iteration logs showing LLM prompts, responses, generated queries, and evaluation feedback. This component is the main interface for the dynamic research question analysis feature.',
      },
    },
  },
  argTypes: {
    question: {
      control: 'text',
      description:
        'The research question text that drives the SPARQL query generation. Passed to the SPARQLQuerySection child component for display and editing.',
      table: {
        type: { summary: 'string' },
      },
    },
    sparqlQuery: {
      control: 'text',
      description:
        'The current SPARQL query string. May be AI-generated or manually edited. Displayed in the SPARQLQuerySection with syntax highlighting.',
      table: {
        type: { summary: 'string' },
      },
    },
    sparqlTranslation: {
      control: 'text',
      description:
        'Natural language explanation of the SPARQL query. Helps users understand what the query does without SPARQL expertise.',
      table: {
        type: { summary: 'string' },
      },
    },
    loading: {
      control: 'boolean',
      description:
        'Global loading state for the component. When true, disables inputs and shows loading indicators during query generation or execution.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    queryResults: {
      control: 'object',
      description:
        'Array of SPARQL result binding objects from the ORKG triplestore. Each object contains variable bindings with `.value` properties.',
      table: {
        type: { summary: 'Record<string, unknown>[]' },
        defaultValue: { summary: '[]' },
      },
    },
    queryError: {
      control: 'text',
      description:
        'Error message if query execution failed. Displayed as an Alert. Includes SPARQL syntax errors, timeout errors, or connection issues.',
      table: {
        type: { summary: 'string | null' },
        defaultValue: { summary: 'null' },
      },
    },
    iterationFeedback: {
      control: 'text',
      description:
        'Current iteration feedback message displayed during AI query refinement. Shows what the AI is currently doing (analyzing results, refining query, etc.).',
      table: {
        type: { summary: 'string' },
      },
    },
    currentIteration: {
      control: 'number',
      description:
        'Current iteration number in the AI refinement loop. Used with maxIterations to show progress (e.g., "2/5").',
      table: {
        type: { summary: 'number' },
      },
    },
    maxIterations: {
      control: 'number',
      description:
        'Maximum number of AI refinement iterations allowed. The AI will stop refining after this many attempts, even if results are not optimal.',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '5' },
      },
    },
    currentTemplateId: {
      control: 'text',
      description:
        'The ORKG template resource ID (e.g., "R54312") currently being used. Displayed in the ResourceIdInputButton and used for query context.',
      table: {
        type: { summary: 'string | null' },
      },
    },
    iterationHistory: {
      control: 'object',
      description:
        'Array of IterationDetail objects containing the full history of AI refinement iterations. Each entry includes prompt, LLM response, generated query, result count, execution errors, and feedback.',
      table: {
        type: { summary: 'IterationDetail[]' },
        defaultValue: { summary: '[]' },
      },
    },
    templateMapping: {
      control: 'object',
      description:
        'PredicatesMapping object from ORKG template analysis. Provides predicate metadata for query explanation features.',
      table: {
        type: { summary: 'PredicatesMapping' },
      },
    },
    targetClassId: {
      control: 'text',
      description:
        'The target ORKG class ID being queried. Used in template insights display.',
      table: {
        type: { summary: 'string | null' },
      },
    },
    onQuestionChange: {
      action: 'questionChanged',
      description: 'Callback fired when the research question is modified.',
      table: {
        type: { summary: '(question: string) => void' },
      },
    },
    onSparqlChange: {
      action: 'sparqlChanged',
      description: 'Callback fired when the SPARQL query is modified.',
      table: {
        type: { summary: '(sparql: string) => void' },
      },
    },
    onGenerateAndRun: {
      action: 'generateAndRun',
      description: 'Callback to trigger AI query generation and execution.',
      table: {
        type: { summary: '() => void' },
      },
    },
    onRunEditedQuery: {
      action: 'runEditedQuery',
      description:
        'Callback to execute the current query without regenerating.',
      table: {
        type: { summary: '() => void' },
      },
    },
    onOpenHistory: {
      action: 'openHistory',
      description:
        'Callback to open the history dialog for questions or queries.',
      table: {
        type: { summary: "(type: HistoryItem['type']) => void" },
      },
    },
    onOpenLlmContextHistory: {
      action: 'openLlmContextHistory',
      description:
        'Callback to open the LLM context history dialog showing all AI interactions.',
      table: {
        type: { summary: '() => void' },
      },
    },
    onTemplateIdChange: {
      action: 'templateIdChanged',
      description:
        'Callback fired when the template ID is changed via ResourceIdInputButton.',
      table: {
        type: { summary: '(templateId: string) => void | Promise<void>' },
      },
    },
  },
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <DynamicQuestionProvider>
          <div style={{ maxWidth: '1200px', padding: '20px' }}>
            <Story />
          </div>
        </DynamicQuestionProvider>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof QueryExecutionSection>;

// research question
const sampleQuestion =
  'What are the most common research methods used in empirical Requirements Engineering studies?';

// SPARQL query for ORKG
const sampleSparqlQuery = `PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX orkgc: <http://orkg.org/orkg/class/>
PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?method ?methodLabel (COUNT(DISTINCT ?paper) AS ?paperCount)
WHERE {
  ?contribution orkgp:P31 orkgr:R54312 .
  ?paper orkgp:P31 ?contribution .
  ?contribution orkgp:HAS_RESEARCH_METHOD ?method .
  ?method rdfs:label ?methodLabel .
}
GROUP BY ?method ?methodLabel
ORDER BY DESC(?paperCount)
LIMIT 15`;

// query results (simplified for display)
const sampleResults = [
  { method: 'R12345', methodLabel: 'Case Study', paperCount: '89' },
  { method: 'R12346', methodLabel: 'Survey', paperCount: '67' },
  { method: 'R12347', methodLabel: 'Experiment', paperCount: '54' },
  { method: 'R12348', methodLabel: 'Interview', paperCount: '42' },
  { method: 'R12349', methodLabel: 'Literature Review', paperCount: '38' },
];

// iteration history showing AI refinement process
const sampleIterationHistory = [
  {
    iteration: 1,
    timestamp: new Date(Date.now() - 180000),
    prompt: `Generate a SPARQL query for the ORKG knowledge graph to answer: "What are the most common research methods used in empirical Requirements Engineering studies?"

Context:
- Template ID: R54312 (KG-EmpiRE)
- Target class: Empirical Study Contribution
- Available predicates: P31 (has contribution), HAS_RESEARCH_METHOD, P29 (year), P30 (venue)

Requirements:
- Use ORKG prefixes (orkgp, orkgc, orkgr)
- Return method labels and counts
- Order by frequency descending`,
    llmResponse: `I'll create a SPARQL query that:
1. Finds papers with contributions to the KG-EmpiRE template
2. Extracts the research method from each contribution
3. Groups and counts by method
4. Orders by frequency

Here's the query:
\`\`\`sparql
SELECT ?method (COUNT(?paper) AS ?count)
WHERE {
  ?paper orkgp:P31 ?contribution .
  ?contribution orkgp:HAS_RESEARCH_METHOD ?method .
}
GROUP BY ?method
\`\`\``,
    generatedQuery: `SELECT ?method (COUNT(?paper) AS ?count)
WHERE {
  ?paper orkgp:P31 ?contribution .
  ?contribution orkgp:HAS_RESEARCH_METHOD ?method .
}
GROUP BY ?method`,
    resultCount: 0,
    feedback:
      'Query returned 0 results. Missing template filter and prefixes. Need to add orkgr:R54312 filter and proper PREFIX declarations.',
  },
  {
    iteration: 2,
    timestamp: new Date(Date.now() - 120000),
    prompt: `The previous query returned 0 results. Please fix the following issues:
1. Add required PREFIX declarations for orkgp, orkgc, orkgr, rdfs
2. Add filter for KG-EmpiRE template (orkgr:R54312)
3. Include method labels using rdfs:label

Previous query:
SELECT ?method (COUNT(?paper) AS ?count)
WHERE {
  ?paper orkgp:P31 ?contribution .
  ?contribution orkgp:HAS_RESEARCH_METHOD ?method .
}
GROUP BY ?method`,
    llmResponse: `I see the issues. Let me fix them:
1. Adding all required prefixes
2. Filtering contributions by the KG-EmpiRE template
3. Getting method labels for readability
4. Using DISTINCT to avoid duplicates

Updated query:
\`\`\`sparql
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?method ?methodLabel (COUNT(DISTINCT ?paper) AS ?paperCount)
WHERE {
  ?contribution orkgp:P31 orkgr:R54312 .
  ?paper orkgp:P31 ?contribution .
  ?contribution orkgp:HAS_RESEARCH_METHOD ?method .
  ?method rdfs:label ?methodLabel .
}
GROUP BY ?method ?methodLabel
ORDER BY DESC(?paperCount)
LIMIT 15
\`\`\``,
    generatedQuery: sampleSparqlQuery,
    resultCount: 15,
    feedback:
      'Query successful! Found 15 distinct research methods with paper counts. Results show Case Study (89), Survey (67), and Experiment (54) as the top methods.',
  },
];

export const Default: Story = {
  args: {
    question: sampleQuestion,
    sparqlQuery: sampleSparqlQuery,
    sparqlTranslation:
      'Finds the most common research methods in KG-EmpiRE contributions, grouped by method with paper counts.',
    loading: false,
    queryResults: sampleResults,
    queryError: null,
    currentTemplateId: 'R54312',
    iterationHistory: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default view showing a completed query execution with results. The component displays the AI configuration button, template selector, and the SPARQLQuerySection with the generated query and results.',
      },
    },
  },
};

export const WithIterationHistory: Story = {
  args: {
    question: sampleQuestion,
    sparqlQuery: sampleSparqlQuery,
    sparqlTranslation:
      'Finds the most common research methods in KG-EmpiRE contributions.',
    loading: false,
    queryResults: sampleResults,
    queryError: null,
    currentTemplateId: 'R54312',
    iterationHistory: sampleIterationHistory,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays the full iteration history with expandable accordions. Each iteration shows the prompt sent to the LLM, the response, generated query, result count, and evaluation feedback. This provides full transparency into the AI refinement process.',
      },
    },
  },
};

export const WithExecutionError: Story = {
  args: {
    question: sampleQuestion,
    sparqlQuery: sampleSparqlQuery,
    sparqlTranslation: '',
    loading: false,
    queryResults: [],
    queryError:
      'Connection timeout: Unable to reach ORKG triplestore at https://orkg.org/triplestore. The server did not respond within 30 seconds. Please check your network connection and try again.',
    currentTemplateId: 'R54312',
    iterationHistory: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error state when query execution fails due to connection issues. The error message is displayed prominently. Common causes include network problems, server downtime, or query timeout.',
      },
    },
  },
};
