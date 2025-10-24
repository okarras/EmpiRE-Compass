import QuestionAccordion from './QuestionAccordion';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { mergeQueryWithFirebase } from '../helpers/query';
import { FirebaseQuestion } from '../store/slices/questionSlice';
import { useParams } from 'react-router';
import { getTemplateConfig, Query } from '../constants/template_config';
import InfoIcon from '@mui/icons-material/Info';

const Dashboard = () => {
  const params = useParams();
  const templateId = params.templateId;
  const firebaseQuestions = useSelector<
    RootState,
    Record<string, FirebaseQuestion>
  >(
    (state) =>
      state.questions.firebaseQuestions as Record<string, FirebaseQuestion>
  );

  const sortedFirebaseQuestions = Object.values(firebaseQuestions).sort(
    (a, b) => a.id - b.id
  );

  const templateConfig = getTemplateConfig(templateId as string);
  const queries = templateConfig.queries;

  if (!queries) {
    return <div>No queries found</div>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        flexGrow: 1,
        flexDirection: 'column',
      }}
    >
      {/* Template Info Box */}
      <Box
        sx={{
          width: '90%',
          mb: 3,
          mt: 5,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            borderLeft: '4px solid #e86161',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 1,
                backgroundColor: 'rgba(232, 97, 97, 0.1)',
                flexShrink: 0,
              }}
            >
              <InfoIcon sx={{ color: '#e86161', fontSize: '1.25rem' }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              {templateConfig.title}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 2,
              fontSize: '0.875rem',
              lineHeight: 1.6,
            }}
          >
            This template contains {queries.length} research questions designed
            to help you explore and analyze data related to{' '}
            {templateConfig.title.toLowerCase()}. Each question is carefully
            crafted to provide insights into different aspects of your research
            domain.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Chip
              label={`${queries.length} Questions`}
              size="small"
              sx={{
                backgroundColor: 'rgba(232, 97, 97, 0.1)',
                color: '#e86161',
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 24,
              }}
            />
            <Chip
              label={templateConfig.collectionName}
              size="small"
              variant="outlined"
              sx={{
                borderColor: 'divider',
                color: 'text.secondary',
                fontWeight: 400,
                fontSize: '0.75rem',
                height: 24,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                opacity: 0.7,
                ml: 'auto',
              }}
            >
              ID: {templateId}
            </Typography>
          </Box>
        </Paper>
      </Box>
      {Object.values(sortedFirebaseQuestions).map((query: FirebaseQuestion) => (
        <>
          <div
            style={{
              width: '92%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              padding: '16px',
            }}
            id={`question-${query.id}`}
          >
            {queries.find((q) => q.id === query.id) && (
              <QuestionAccordion
                key={`question-${query.uid}`}
                query={mergeQueryWithFirebase(
                  queries.find((q) => q.uid === query.uid) as Query,
                  firebaseQuestions[query.uid] as unknown as Record<
                    string,
                    unknown
                  >
                )}
              />
            )}
          </div>
        </>
      ))}
    </Box>
  );
};

export default Dashboard;
