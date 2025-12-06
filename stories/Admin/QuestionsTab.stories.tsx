import type { Meta, StoryObj } from '@storybook/react-vite';
import QuestionsTab from '../../src/components/Admin/QuestionsTab';
import { QuestionData } from '../../src/firestore/TemplateManagement';

// mock questions data
const mockQuestions: QuestionData[] = [
  {
    id: 1,
    uid: 'query_1',
    title: 'Research Methods Distribution',
    chartType: 'bar',
    sparqlQuery: `PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?method (COUNT(DISTINCT ?paper) AS ?count)
WHERE {
  ?paper orkgp:P31 orkgr:R12345 ;
         orkgp:P32 ?methodResource .
  ?methodResource rdfs:label ?method .
}
GROUP BY ?method
ORDER BY DESC(?count)`,
    dataAnalysisInformation: {
      question:
        'What research methods are most commonly used in empirical software engineering studies?',
      questionExplanation:
        '<p>This analysis examines the distribution of research methods across published papers in the knowledge graph. Understanding method prevalence helps identify trends in empirical research practices.</p>',
      dataAnalysis:
        'Papers were categorized by their primary research method as annotated in the ORKG knowledge graph.',
      dataInterpretation:
        '<p>The results show that <strong>case studies</strong> and <strong>experiments</strong> are the most prevalent methods, followed by surveys and systematic literature reviews.</p>',
      requiredDataForAnalysis:
        'Paper metadata including research method classification (P32 predicate)',
    },
    chartSettings: {
      heading: 'Research Methods Distribution',
      className: 'fullWidth',
      height: 400,
      xAxis: [
        { scaleType: 'band', dataKey: 'method', label: 'Research Method' },
      ],
      yAxis: [{ label: 'Number of Papers' }],
      series: [{ dataKey: 'count' }],
      colors: ['#e86161'],
    },
  },
  {
    id: 2,
    uid: 'query_2_1',
    uid_2: 'query_2_2',
    title: 'Data Collection and Analysis Methods',
    chartType: 'bar',
    sparqlQuery: `PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?dataCollection (COUNT(DISTINCT ?paper) AS ?count)
WHERE {
  ?paper orkgp:P33 ?dcResource .
  ?dcResource rdfs:label ?dataCollection .
}
GROUP BY ?dataCollection
ORDER BY DESC(?count)`,
    sparqlQuery2: `PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?analysisMethod (COUNT(DISTINCT ?paper) AS ?count)
WHERE {
  ?paper orkgp:P34 ?amResource .
  ?amResource rdfs:label ?analysisMethod .
}
GROUP BY ?analysisMethod
ORDER BY DESC(?count)`,
    tabs: {
      tab1_name: 'Data Collection',
      tab2_name: 'Data Analysis',
    },
    dataAnalysisInformation: {
      question:
        'What data collection and analysis methods are used in empirical studies?',
      questionExplanation:
        '<p>This dual-query analysis examines both data collection techniques and data analysis methods used in empirical software engineering research.</p>',
      dataAnalysis: [
        'Data collection methods categorization based on ORKG annotations',
        'Data analysis methods categorization based on ORKG annotations',
      ],
      dataInterpretation: [
        '<p>Interviews and surveys are the most common data collection methods.</p>',
        '<p>Qualitative coding and statistical analysis dominate the analysis methods.</p>',
      ],
      requiredDataForAnalysis:
        'Paper metadata with data collection (P33) and analysis method (P34) predicates',
    },
    chartSettings: {
      heading: 'Data Collection Methods',
      height: 400,
      colors: ['#4c72b0'],
    },
    chartSettings2: {
      heading: 'Data Analysis Methods',
      height: 400,
      colors: ['#55a868'],
    },
  },
  {
    id: 3,
    uid: 'query_3',
    title: 'Publication Years Distribution',
    chartType: 'bar',
    sparqlQuery: `PREFIX orkgp: <http://orkg.org/orkg/predicate/>

SELECT ?year (COUNT(DISTINCT ?paper) AS ?count)
WHERE {
  ?paper orkgp:P29 ?year .
  FILTER(?year >= 2010 && ?year <= 2024)
}
GROUP BY ?year
ORDER BY ?year`,
    dataAnalysisInformation: {
      question:
        'How are empirical software engineering papers distributed across publication years?',
      questionExplanation:
        '<p>This analysis shows the temporal distribution of papers in the knowledge graph, helping identify publication trends over time.</p>',
      dataAnalysis:
        'Papers were grouped by their publication year (P29 predicate) and counted.',
      dataInterpretation:
        '<p>The data shows a steady increase in empirical software engineering publications, with peak activity in recent years.</p>',
      requiredDataForAnalysis:
        'Paper metadata with publication year (P29 predicate)',
    },
    chartSettings: {
      heading: 'Papers by Publication Year',
      className: 'fullWidth',
      height: 350,
      xAxis: [{ scaleType: 'band', dataKey: 'year', label: 'Year' }],
      yAxis: [{ label: 'Number of Papers' }],
      series: [{ dataKey: 'count' }],
      colors: ['#e86161'],
    },
  },
  {
    id: 4,
    uid: 'query_4_1',
    uid_2: 'query_4_2',
    title: 'Threats to Validity',
    chartType: 'bar',
    sparqlQuery: `PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?threatType (COUNT(DISTINCT ?paper) AS ?count)
WHERE {
  ?paper orkgp:P35 ?threatResource .
  ?threatResource rdfs:label ?threatType .
}
GROUP BY ?threatType`,
    tabs: {
      tab1_name: 'Internal Validity',
      tab2_name: 'External Validity',
    },
    dataAnalysisInformation: {
      question:
        'What types of validity threats are commonly reported in empirical studies?',
    },
    chartSettings: {
      heading: 'Threats to Validity',
      height: 400,
    },
  },
];

const meta: Meta<typeof QuestionsTab> = {
  title: 'Admin/QuestionsTab',
  component: QuestionsTab,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "`QuestionsTab` displays a list of research questions in an accordion format within the admin panel. Each question represents a data visualization query with its associated SPARQL query, chart settings, and data analysis information. The component supports both single-query and dual-query (tabbed) questions. Questions are stored in Firestore under the template's Questions subcollection and are ordered by their numeric ID.",
      },
    },
  },
  argTypes: {
    questions: {
      control: 'object',
      description:
        'Array of QuestionData objects to display. Each object contains id (numeric ordering), uid (unique identifier linking to SPARQL queries), title, chartType, sparqlQuery, dataAnalysisInformation (with question, explanation, analysis, interpretation), and chartSettings. Dual-query questions also have uid_2, sparqlQuery2, chartSettings2, and tabs properties.',
      table: {
        type: { summary: 'QuestionData[]' },
      },
    },
    loading: {
      control: 'boolean',
      description:
        'When true, displays a LinearProgress indicator instead of the questions list. Used while fetching questions from Firestore or during save/delete operations.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onAddQuestion: {
      action: 'add question clicked',
      description:
        'Callback fired when the "Add Question" button is clicked. The parent component should open the QuestionEditDialog in create mode (with question prop set to null).',
      table: {
        type: { summary: '() => void' },
      },
    },
    onEditQuestion: {
      action: 'edit question',
      description:
        'Callback fired when the Edit button is clicked for a specific question. Receives the complete QuestionData object. The parent component should open the QuestionEditDialog with this question for editing.',
      table: {
        type: { summary: '(question: QuestionData) => void' },
      },
    },
    onDeleteQuestion: {
      action: 'delete question',
      description:
        'Callback fired when the Delete button is clicked for a specific question. Receives the question UID string. The parent component should confirm deletion and then remove the question from Firestore.',
      table: {
        type: { summary: '(questionId: string) => void' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuestionsTab>;

export const Default: Story = {
  args: {
    questions: mockQuestions,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Questions tab with multiple questions displayed in accordion format. Each accordion shows the question ID chip, research question text, and UID in the summary. Expanding reveals the SPARQL query and action buttons (Edit, Delete). Includes both single-query and dual-query questions with tabs.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    questions: [],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Questions tab with no questions configured. Only the "Add Question" button is visible, allowing administrators to create the first question for a template.',
      },
    },
  },
};
