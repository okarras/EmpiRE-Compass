import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import QuestionEditDialog from '../../src/components/Admin/QuestionEditDialog';
import { QuestionData } from '../../src/firestore/TemplateManagement';

// mock question data with complete dataAnalysisInformation
const mockQuestion: QuestionData = {
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
      '<p>This analysis examines the distribution of research methods across published papers in the ORKG knowledge graph. Understanding method prevalence helps identify trends in empirical research practices and guides future research design decisions.</p><p>The data is sourced from the <a href="https://orkg.org">Open Research Knowledge Graph</a> which contains structured representations of research contributions.</p>',
    dataAnalysis:
      'Papers were categorized by their primary research method as annotated in the ORKG knowledge graph. Each paper is linked to one or more research method resources via the P32 predicate. The analysis counts distinct papers per method to avoid double-counting papers with multiple method annotations.',
    dataInterpretation:
      '<p>The results show that <strong>case studies</strong> and <strong>experiments</strong> are the most prevalent methods in empirical software engineering research, followed by surveys and systematic literature reviews.</p><table><tr><th>Method</th><th>Percentage</th></tr><tr><td>Case Study</td><td>35%</td></tr><tr><td>Experiment</td><td>28%</td></tr><tr><td>Survey</td><td>18%</td></tr><tr><td>SLR</td><td>12%</td></tr><tr><td>Other</td><td>7%</td></tr></table>',
    requiredDataForAnalysis:
      'Paper metadata including research method classification (P32 predicate). Papers must be linked to the empirical research template (R12345) and have method annotations.',
  },
  chartSettings: {
    heading: 'Research Methods Distribution',
    className: 'fullWidth fixText',
    height: 400,
    xAxis: [{ scaleType: 'band', dataKey: 'method', label: 'Research Method' }],
    yAxis: [{ label: 'Number of Papers' }],
    series: [{ dataKey: 'count' }],
    colors: ['#e86161'],
    margin: { left: 60, right: 20 },
    barLabel: 'value',
  },
};

// Dual query question with complete structure
const mockDualQueryQuestion: QuestionData = {
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
ORDER BY DESC(?count)
LIMIT 15`,
  sparqlQuery2: `PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?analysisMethod (COUNT(DISTINCT ?paper) AS ?count)
WHERE {
  ?paper orkgp:P34 ?amResource .
  ?amResource rdfs:label ?analysisMethod .
}
GROUP BY ?analysisMethod
ORDER BY DESC(?count)
LIMIT 15`,
  tabs: {
    tab1_name: 'Data Collection',
    tab2_name: 'Data Analysis',
  },
  dataAnalysisInformation: {
    question:
      'What data collection and analysis methods are used in empirical software engineering studies?',
    questionExplanation:
      '<p>This dual-query analysis examines both data collection techniques and data analysis methods used in empirical software engineering research. The analysis is split into two tabs to provide focused insights on each aspect.</p>',
    dataAnalysis: [
      'Data collection methods were extracted from paper annotations using the P33 predicate. Methods include interviews, surveys, observations, document analysis, and automated data collection techniques.',
      'Data analysis methods were extracted using the P34 predicate. Methods include qualitative coding, statistical analysis, thematic analysis, and mixed methods approaches.',
    ],
    dataInterpretation: [
      '<p><strong>Data Collection Findings:</strong></p><ul><li>Interviews and surveys are the most common data collection methods</li><li>Automated data collection (mining repositories) is increasingly popular</li><li>Mixed-method approaches combining multiple techniques are common</li></ul>',
      '<p><strong>Data Analysis Findings:</strong></p><ul><li>Qualitative coding and statistical analysis dominate</li><li>Thematic analysis is common for interview data</li><li>Machine learning techniques are emerging for large-scale studies</li></ul>',
    ],
    requiredDataForAnalysis:
      'Paper metadata with data collection (P33) and analysis method (P34) predicates. Both predicates link to controlled vocabulary resources.',
  },
  chartSettings: {
    heading: 'Data Collection Methods',
    className: 'fullWidth',
    height: 400,
    layout: 'horizontal',
    xAxis: [{ label: 'Number of Papers' }],
    yAxis: [{ scaleType: 'band', dataKey: 'dataCollection', label: 'Method' }],
    series: [{ dataKey: 'count' }],
    colors: ['#4c72b0'],
    margin: { left: 150, right: 20 },
  },
  chartSettings2: {
    heading: 'Data Analysis Methods',
    className: 'fullWidth',
    height: 400,
    layout: 'horizontal',
    xAxis: [{ label: 'Number of Papers' }],
    yAxis: [{ scaleType: 'band', dataKey: 'analysisMethod', label: 'Method' }],
    series: [{ dataKey: 'count' }],
    colors: ['#55a868'],
    margin: { left: 150, right: 20 },
  },
};

const QuestionEditDialogWrapper = ({
  question,
}: {
  question: QuestionData | null;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ padding: '20px' }}>
      <Button
        variant="contained"
        startIcon={<EditIcon />}
        onClick={() => setOpen(true)}
        sx={{
          backgroundColor: '#e86161',
          '&:hover': { backgroundColor: '#d45151' },
        }}
      >
        Open Edit Dialog
      </Button>
      <QuestionEditDialog
        open={open}
        question={question}
        onClose={() => setOpen(false)}
        onSave={(q, settings, settings2) => {
          console.log('Saved:', q, settings, settings2);
          setOpen(false);
        }}
      />
    </Box>
  );
};

const meta: Meta<typeof QuestionEditDialog> = {
  title: 'Admin/QuestionEditDialog',
  component: QuestionEditDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`QuestionEditDialog` is a comprehensive modal dialog for creating and editing research question configurations in the admin panel. It provides a multi-section form covering: Basic Information (ID, UID, title), Data Analysis Information (research question, explanation, methodology, interpretation, required data), SPARQL Queries (with CodeEditor for syntax highlighting), and Chart Configuration (JSON-based chart settings). The dialog supports both single-query and dual-query modes, where dual-query questions display data in a tabbed interface with separate queries and chart configurations for each tab.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description:
        'Controls dialog visibility. When true, the dialog is displayed as a full-width modal (maxWidth="lg") with a backdrop. When false, the dialog is hidden. The dialog maintains internal form state between open/close cycles.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    question: {
      control: 'object',
      description:
        'The QuestionData object to edit. When null, the dialog operates in "create new" mode with default empty values. When provided, all form fields are pre-populated including: id, uid, uid_2 (for dual queries), title, chartType, dataAnalysisInformation (question, questionExplanation, dataAnalysis, dataInterpretation, requiredDataForAnalysis), sparqlQuery, sparqlQuery2, chartSettings, chartSettings2, and tabs. The dataAnalysisInformation fields can be strings or arrays (for dual-query mode).',
      table: {
        type: { summary: 'QuestionData | null' },
      },
    },
    onClose: {
      action: 'dialog closed',
      description:
        'Callback fired when the dialog is closed via the Cancel button, backdrop click, or Escape key. The parent component should use this to hide the dialog by setting open to false. Note: unsaved changes will be lost.',
      table: {
        type: { summary: '() => void' },
      },
    },
    onSave: {
      action: 'question saved',
      description:
        'Callback fired when the Save button is clicked. Receives three arguments: the QuestionData object with all form values, the chartSettingsJson string (parsed JSON for chartSettings), and chartSettings2Json string (for dual-query mode). The parent component should validate the JSON, merge chartSettings into the question object, and persist to Firestore.',
      table: {
        type: {
          summary:
            '(question: QuestionData, chartSettingsJson: string, chartSettings2Json: string) => void',
        },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuestionEditDialog>;

export const EditExistingQuestion: Story = {
  render: () => <QuestionEditDialogWrapper question={mockQuestion} />,
  parameters: {
    docs: {
      description: {
        story:
          'Edit dialog for modifying an existing single-query question. Click "Open Edit Dialog" to view the form with all sections populated including dataAnalysisInformation with HTML content, SPARQL query, and chart configuration JSON.',
      },
    },
  },
};

export const DualQueryMode: Story = {
  render: () => <QuestionEditDialogWrapper question={mockDualQueryQuestion} />,
  parameters: {
    docs: {
      description: {
        story:
          'Edit dialog for dual-query questions with two SPARQL queries and chart configurations. Click "Open Edit Dialog" to view the form showing dual-query mode with tab names, two queries, and separate chart settings for each tab.',
      },
    },
  },
};
