import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Divider,
  Tabs,
  Tab,
  Paper,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  CheckCircle,
  Cancel,
  BarChart,
} from '@mui/icons-material';
import CRUDDynamicQuestions, {
  DynamicQuestion,
} from '../firestore/CRUDDynamicQuestions';
import { useAuthData } from '../auth/useAuthData';
import HTMLRenderer from '../components/AI/HTMLRenderer';
import QuestionDataGridView from '../components/QuestionDataGridView';
import SectionSelector from '../components/SectionSelector';
import { toast } from 'react-hot-toast';

// Helper to convert DynamicQuestion state to a Query-like object for SectionSelector
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
    uid_2: 'dynamic_second_tab_placeholder',
  };
};

const CommunityQuestionDetailsPage: React.FC = () => {
  const { id, templateId } = useParams<{ id: string; templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthData();
  const isAdmin = user?.is_admin === true;

  const [question, setQuestion] = useState<DynamicQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Use getCommunityQuestion instead of getDynamicQuestion to target correct collection
        const data = await CRUDDynamicQuestions.getCommunityQuestion(id);
        if (data) {
          setQuestion(data);
        } else {
          setError('Question not found');
        }
      } catch (err) {
        console.error('Error fetching question:', err);
        setError('Failed to load question');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [id]);

  const handleStatusChange = async (
    newStatus: 'published' | 'rejected' | 'pending'
  ) => {
    if (!question) return;
    try {
      const updatedQuestion: DynamicQuestion = {
        ...question,
        status: newStatus,
        isCommunity: true, // Ensure isCommunity is set so it saves to the correct collection
        reviewerId: user?.id,
        publishedAt:
          newStatus === 'published' ? Date.now() : question.publishedAt,
      };
      await CRUDDynamicQuestions.saveDynamicQuestion(updatedQuestion);
      setQuestion(updatedQuestion);
      toast.success(`Question marked as ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleEdit = () => {
    navigate(`/${templateId}/dynamic-question`, {
      state: { questionToEdit: question },
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !question) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Question not found'}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/${templateId}/community-questions`)}
          sx={{ mt: 2 }}
        >
          Back to Community Questions
        </Button>
      </Container>
    );
  }

  const isOwner = user?.id === question.createdBy;
  const canEdit = isAdmin || isOwner;
  const dataCollection = question.state.queryResults || [];
  const mockQuery = dynamicQuestionToQuery(question);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/${templateId}/community-questions`)}
        sx={{ mb: 2 }}
      >
        Back to List
      </Button>

      <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                {question.name}
              </Typography>
              {question.status && (
                <Chip
                  label={question.status.toUpperCase()}
                  color={
                    question.status === 'published'
                      ? 'success'
                      : question.status === 'rejected'
                        ? 'error'
                        : 'warning'
                  }
                  size="small"
                />
              )}
            </Box>
            <Typography variant="subtitle1" color="text.secondary">
              Shared by {question.creatorName || 'Community User'} on{' '}
              {new Date(question.timestamp).toLocaleDateString()}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit
              </Button>
            )}
            {isAdmin && question.status !== 'published' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => handleStatusChange('published')}
              >
                Publish
              </Button>
            )}
            {isAdmin && question.status !== 'rejected' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => handleStatusChange('rejected')}
              >
                Reject
              </Button>
            )}
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Question
          </Typography>
          <Typography variant="body1">{question.state.question}</Typography>
        </Box>

        <SectionSelector
          sectionType="information"
          sectionTitle="Interpretation"
          // @ts-ignore
          query={mockQuery}
        />

        <Typography variant="body2" color="text.secondary" paragraph>
          {question.state.questionInterpretation}
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Chart" icon={<BarChart />} iconPosition="start" />
            <Tab label="Data" />
            <Tab label="Analysis" />
          </Tabs>
        </Box>

        <Box sx={{ py: 3 }}>
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
              <Alert severity="info" variant="outlined">
                No chart visualization available for this question.
              </Alert>
            )}
          </Box>

          {/* Data View */}
          <Box hidden={tab !== 1}>
            <QuestionDataGridView
              questionData={dataCollection}
              gridOptions={{}}
            />
          </Box>

          {/* Analysis View */}
          <Box hidden={tab !== 2}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Data Collection Interpretation
                </Typography>
                <Typography variant="body1">
                  {question.state.dataCollectionInterpretation ||
                    'No interpretation available.'}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Data Analysis Interpretation
                </Typography>
                <Typography variant="body1">
                  {question.state.dataAnalysisInterpretation ||
                    'No analysis available.'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CommunityQuestionDetailsPage;
