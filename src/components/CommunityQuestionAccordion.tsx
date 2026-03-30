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
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FeedIcon from '@mui/icons-material/Feed';
import DeleteIcon from '@mui/icons-material/Delete';
import HTMLRenderer from './AI/HTMLRenderer';
import SectionSelector from './SectionSelector';
import QuestionDataGridView from './QuestionDataGridView';
import CRUDDynamicQuestions, {
  DynamicQuestion,
} from '../firestore/CRUDDynamicQuestions';
import { useAuthData } from '../auth/useAuthData';
import { useNavigate, useParams } from 'react-router';
import TemplateManagement, {
  QuestionData,
} from '../firestore/TemplateManagement';
import { useKeycloak } from '@react-keycloak/web';

// Convert DynamicQuestion state to a Query-like object for SectionSelector
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
  const { user } = useAuthData();
  const { keycloak } = useKeycloak();

  // Local state for optimistic updates
  const [likes, setLikes] = useState(question.likes || 0);
  const [likedBy, setLikedBy] = useState<string[]>(question.likedBy || []);
  const hasLiked = user ? likedBy.includes(user.id) : false;

  const { templateId } = useParams();

  const handleAddToCurated = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.is_admin || !templateId || !user.email) {
      return;
    }

    try {
      const existingQuestions: QuestionData[] =
        await TemplateManagement.getAllQuestions(templateId);

      const linked = existingQuestions.find(
        (q: QuestionData) =>
          q.fromCommunity === true && q.communityQuestionId === question.id
      );

      // If already present in curated list, offer to remove it (toggle behavior)
      if (linked) {
        if (
          !window.confirm(
            'This question is already in the curated questions sidebar. Remove it?'
          )
        ) {
          return;
        }

        const docId = (linked as any).uid || String(linked.id);
        await TemplateManagement.deleteQuestion(
          templateId,
          docId,
          user.id,
          user.email,
          keycloak?.token
        );
        window.alert('Question removed from curated questions.');
        return;
      }

      if (
        !window.confirm(
          'Add this community question to the curated questions sidebar?'
        )
      ) {
        return;
      }

      const curatedQuestion: QuestionData = {
        // Use a large unique id that won’t collide with existing curated questions
        id: Date.now(),
        // Use a stable uid namespace for community-derived curated items
        uid: `community-${question.id}`,
        title: question.name,
        fromCommunity: true,
        communityQuestionId: question.id,
        dataAnalysisInformation: {
          question: question.state.question,
          questionExplanation:
            question.state.questionInterpretation || undefined,
          requiredDataForAnalysis:
            question.state.dataCollectionInterpretation || undefined,
          dataAnalysis: question.state.dataAnalysisInterpretation || undefined,
          dataInterpretation: [
            question.state.dataCollectionInterpretation || '',
            question.state.dataAnalysisInterpretation || '',
          ],
        },
        sparqlQuery: question.state.sparqlQuery,
      };

      await TemplateManagement.createQuestion(
        templateId,
        curatedQuestion.uid,
        curatedQuestion,
        user.id,
        user.email,
        keycloak?.token
      );
      window.alert('Question added to curated questions.');
    } catch (error) {
      console.error(
        'Failed to add/remove curated question from community',
        error
      );
      window.alert('Failed to update curated questions.');
    }
  };

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  const openInPlayground = () => {
    navigate(`/${templateId}/dynamic-question`, {
      state: { questionToEdit: question },
    });
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return; // Should ideally prompt login

    // Optimistic update
    const previousLikes = likes;
    const previousLikedBy = likedBy;

    if (hasLiked) {
      setLikes(Math.max(0, likes - 1));
      setLikedBy(likedBy.filter((id) => id !== user.id));
    } else {
      setLikes(likes + 1);
      setLikedBy([...likedBy, user.id]);
    }

    try {
      await CRUDDynamicQuestions.toggleLike(question.id, user.id, true);
    } catch (error) {
      // Revert on error
      console.error('Failed to toggle like', error);
      setLikes(previousLikes);
      setLikedBy(previousLikedBy);
    }
  };

  // Use stored state
  const dataCollection = question.state.queryResults || [];

  // Use `chartHtml` for display

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

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            ml: 2,
          }}
        >
          <Chip
            label={
              question.state.templateId
                ? `Template: ${question.state.templateId}`
                : 'Custom'
            }
            size="small"
            variant="outlined"
            sx={{ display: { xs: 'none', md: 'inline-flex' } }} // Hide on small screens if needed
          />

          <Button
            startIcon={hasLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            variant="outlined"
            onClick={handleToggleLike}
            size="small"
            color={hasLiked ? 'error' : 'inherit'}
            sx={{
              minWidth: 'auto',
              borderColor: hasLiked ? 'error.main' : 'divider',
              color: hasLiked ? 'error.main' : 'text.secondary',
              '&:hover': {
                borderColor: hasLiked ? 'error.dark' : 'text.primary',
                color: hasLiked ? 'error.dark' : 'text.primary',
              },
            }}
          >
            {likes > 0 ? likes : '0'}
          </Button>

          {user?.is_admin && (
            <Tooltip title="Add to curated questions (sidebar)">
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddToCurated}
                sx={{
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': {
                    backgroundColor: 'success.main',
                    color: 'white',
                    borderColor: 'success.main',
                  },
                }}
              >
                Add to curated
              </Button>
            </Tooltip>
          )}

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
                  '&:hover': { color: 'error.main', bgcolor: 'error.lighter' },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}

          <Button
            startIcon={<FeedIcon />}
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/${templateId}/community-questions/${question.id}`);
            }}
            size="small"
            sx={{
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: 'primary.lighter',
              },
            }}
          >
            Details
          </Button>

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
            Playground
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
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
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
