import {
  Container,
  ThemeProvider,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import { useParams } from 'react-router';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { getTemplateConfig } from '../constants/template_config';
import theme from '../utils/theme';
import Question from '../components/Question';
import { mergeQueryWithFirebase } from '../helpers/query';
import { FirebaseQuestion } from '../store/slices/questionSlice';

const ErrorState = ({ message }: { message: string }) => (
  <Paper
    elevation={0}
    sx={{
      p: 4,
      mt: 4,
      textAlign: 'center',
      backgroundColor: 'rgba(232, 97, 97, 0.05)',
      border: '1px solid rgba(232, 97, 97, 0.1)',
      borderRadius: 2,
    }}
  >
    <Typography variant="h5" color="error" gutterBottom>
      {message}
    </Typography>
    <Typography color="text.secondary">
      Please try again later or contact support if the problem persists.
    </Typography>
  </Paper>
);

const QuestionPage = () => {
  const params = useParams();
  const id = params.id;
  const templateId = params.templateId as string;
  const firebaseQuestions = useSelector<
    RootState,
    Record<string, FirebaseQuestion>
  >(
    (state) =>
      state.questions.firebaseQuestions as Record<string, FirebaseQuestion>
  );

  const queries = getTemplateConfig(templateId).queries;
  const targetQuery = queries?.find((query) => query.id === Number(id));

  if (!targetQuery) {
    return <ErrorState message="Question not found" />;
  }

  const firebaseTargetQuery = Object.values(firebaseQuestions).find(
    (q) => q.id === targetQuery.id
  ) as unknown as Record<string, unknown>;

  const finalQuery = mergeQueryWithFirebase(targetQuery, firebaseTargetQuery);

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: 4, sm: 6, md: 8 },
          mb: { xs: 4, sm: 6, md: 8 },
          minHeight: 'calc(100vh - 200px)',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              mb: 4,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: '#e86161',
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                lineHeight: 1.3,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e86161',
                  borderRadius: '2px',
                },
              }}
            >
              {`${targetQuery.id}. ${targetQuery.dataAnalysisInformation.question}`}
            </Typography>
          </Box>

          <Question query={finalQuery} />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default QuestionPage;
