import {
  AccordionSummary,
  Box,
  Typography,
  Accordion,
  Button,
  Chip,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import DeleteIcon from '@mui/icons-material/Delete';
import HTMLRenderer from './AI/HTMLRenderer';
import SectionSelector from './SectionSelector';
import QuestionInformation from './QuestionInformation';
import QuestionDataGridView from './QuestionDataGridView';
import { DynamicQuestion } from '../firestore/CRUDDynamicQuestions';
import { useNavigate } from 'react-router';

// Helper to convert DynamicQuestion state to a Query-like object for SectionSelector
// Note: Dynamic questions might not have everything a full "Query" has, but enough for display
const dynamicQuestionToQuery = (dq: DynamicQuestion) => {
  return {
    id: dq.id,
    uid: dq.id,
    dataAnalysisInformation: {
      question: dq.state.question || dq.name,
      questionExplanation:
        dq.state.questionInterpretation || 'No explanation available.',
      requiredDataForAnalysis:
        dq.state.dataCollectionInterpretation || 'No interpretation available.',
      dataInterpretation: [
        dq.state.dataCollectionInterpretation || '',
        dq.state.dataAnalysisInterpretation || '',
      ],
      dataAnalysis:
        dq.state.dataAnalysisInterpretation || 'No analysis available.',
    },
    tabs: {
      tab1_name: 'Data Collection',
      tab2_name: 'Data Analysis',
    },
    // We pretend we have chart settings if we have chart HTML?
    // Actually SectionSelector expects `query` object.
    // For dynamic questions, we might just pass a mock object.
    uid_2: 'dynamic_second_tab_placeholder', // To enable tabs logic if we want default structure
  };
};

const CommunityQuestionAccordion = ({
  question,
  onDelete,
}: {
  question: DynamicQuestion;
  onDelete?: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  const openInPlayground = () => {
    // Navigate to playground and maybe pre-load this question?
    // For now just go to playground. Implementing "load" might require URL params or context.
    navigate(`/playground`);
  };

  // Use stored state
  const dataCollection = question.state.queryResults || [];

  // Dynamic questions typically have one main result set.
  // We can treat it as "Data Collection".
  // If there's a chart, we render the HTML directly or use a generic viewer.
  // The original QuestionAccordion uses QuestionChartView which expects ChartSettings.
  // DynamicAIQuestion saves `chartHtml`. We should prefer displaying that.

  // Mock query object for reuse of some components
  const mockQuery = dynamicQuestionToQuery(question);

  return (
    <Accordion
      expanded={expanded}
      onChange={handleAccordionChange}
      sx={{
        width: '100%',
        backgroundColor: 'background.paper',
        borderRadius: (theme) => `${theme.shape.borderRadius}px !important`,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.3)'
            : '0 1px 4px rgba(0, 0, 0, 0.05)',
        transition: (theme) =>
          theme.transitions.create(
            ['box-shadow', 'border-color', 'background-color'],
            { duration: theme.transitions.duration.shorter }
          ),
        '&:before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          margin: '16px 0',
          '&:first-of-type': {
            marginTop: 0,
          },
          '&:last-of-type': {
            marginBottom: 0,
          },
        },
      }}
    >
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon
            sx={{ color: expanded ? 'primary.main' : 'text.secondary' }}
          />
        }
        sx={{
          padding: { xs: 2, sm: 3 },
          minHeight: 64,
          '&.Mui-expanded': {
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
            fontWeight: 600,
            color: expanded ? 'primary.main' : 'text.primary',
            flex: 1,
          }}
        >
          {question.name}
          <Box
            component="span"
            sx={{
              display: 'block',
              mt: 0.5,
              typography: 'caption',
              color: 'text.secondary',
              fontWeight: 400,
            }}
          >
            Shared by{' '}
            {question.creatorName ? (
              <Box
                component="a"
                href={`mailto:${question.creatorName}`}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                  },
                }}
              >
                {question.creatorName}
              </Box>
            ) : (
              <Box
                component="span"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                {question.creatorName || 'Community User'}
              </Box>
            )}{' '}
            on {new Date(question.timestamp).toLocaleDateString()}
          </Box>
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={
              question.state.templateId
                ? `Template: ${question.state.templateId}`
                : 'Custom'
            }
            size="small"
            variant="outlined"
          />
          {onDelete && (
            <Tooltip title="Delete Question (Admin)">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'error.main' },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
          <Button
            startIcon={<BarChartIcon />}
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              openInPlayground();
            }}
            size="small"
            sx={{
              color: '#e86161',
              borderColor: '#e86161',
              '&:hover': {
                backgroundColor: '#e86161',
                color: 'white',
                borderColor: '#e86161',
              },
            }}
          >
            Edit in Playground
          </Button>
        </Box>
      </AccordionSummary>

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          Question
        </Typography>
        <Typography variant="body1" paragraph>
          {question.state.question}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <SectionSelector
          sectionType="information"
          sectionTitle="Interpretation"
          // @ts-ignore
          query={mockQuery} // Passing mock just to satisfy type if needed, or we just render text directly
        />

        <Typography variant="body2" color="text.secondary" paragraph>
          {question.state.questionInterpretation}
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2, mt: 2 }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Chart" />
          <Tab label="Data" />
          <Tab label="Analysis" />
        </Tabs>

        {/* Chart View */}
        <Box hidden={tab !== 0}>
          {question.state.chartHtml ? (
            <HTMLRenderer
              html={question.state.chartHtml}
              type="chart"
              useIframe={true}
              title="Chart Interpretation"
            />
          ) : (
            <Typography fontStyle="italic" color="text.secondary">
              No chart visualization available.
            </Typography>
          )}
        </Box>

        {/* Data View */}
        <Box hidden={tab !== 1}>
          <QuestionDataGridView
            questionData={dataCollection}
            gridOptions={{}} // Default options
          />
        </Box>

        {/* Analysis View */}
        <Box hidden={tab !== 2}>
          <Typography variant="subtitle2" gutterBottom>
            Data Collection Interpretation
          </Typography>
          <Typography paragraph>
            {question.state.dataCollectionInterpretation || 'N/A'}
          </Typography>

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" gutterBottom>
            Data Analysis Interpretation
          </Typography>
          <Typography paragraph>
            {question.state.dataAnalysisInterpretation || 'N/A'}
          </Typography>
        </Box>
      </Box>
    </Accordion>
  );
};

export default CommunityQuestionAccordion;
