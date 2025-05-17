import {
  Container,
  ThemeProvider,
  Typography,
  Box,
  Skeleton,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useParams } from 'react-router';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { queries } from '../constants/queries_chart_info';
import theme from '../utils/theme';
import { useEffect, useState } from 'react';
import Question from '../components/Question';
import fetchSPARQLData from '../helpers/fetch_query';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import { mergeQueryWithFirebase } from '../helpers/query';
import { FirebaseQuestion } from '../store/slices/questionSlice';

const LoadingSkeleton = () => (
  <Box sx={{ width: '100%', mt: 4 }}>
    <Skeleton variant="text" sx={{ fontSize: '2rem', mb: 2, width: '70%' }} />
    <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={400} />
  </Box>
);

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
  const [questionData, setQuestionData] = useState<Record<string, unknown>[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [normalized, setNormalized] = useState(true);
  const id = params.id;
  const firebaseQuestions = useSelector<
    RootState,
    Record<string, FirebaseQuestion>
  >(
    (state) =>
      state.questions.firebaseQuestions as Record<string, FirebaseQuestion>
  );

  const targetQuery = queries.find((query) => query.id == Number(id));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const data = await fetchSPARQLData(SPARQL_QUERIES[targetQuery.uid]);
        setQuestionData(data);
      } catch (err) {
        setError('Failed to load question data');
        console.error('Error fetching question data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (targetQuery?.uid) {
      fetchData();
    }
  }, [targetQuery?.uid]);

  if (!targetQuery) {
    return <ErrorState message="Question not found" />;
  }

  const finalQuery = mergeQueryWithFirebase(
    targetQuery,
    firebaseQuestions[targetQuery.uid] as unknown as Record<string, unknown>
  );

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
          <Typography
            variant="h3"
            sx={{
              color: '#e86161',
              fontWeight: 700,
              mb: 4,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              lineHeight: 1.3,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: '60px',
                height: '4px',
                backgroundColor: '#e86161',
                borderRadius: '2px',
              },
            }}
          >
            {`${targetQuery.id}. ${targetQuery.dataAnalysisInformation.question}`}
          </Typography>

          {loading && <LoadingSkeleton />}

          {error && <ErrorState message={error} />}

          {!loading && !error && (
            <Box
              sx={{
                opacity: loading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
                position: 'relative',
              }}
            >
              <Question
                query={finalQuery}
                questionData={questionData}
                normalized={normalized}
                setNormalized={setNormalized}
                chartData={finalQuery.dataProcessingFunction(
                  questionData ?? []
                )}
              />
            </Box>
          )}

          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <CircularProgress sx={{ color: '#e86161' }} />
              <Typography color="text.secondary">
                Loading question data...
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default QuestionPage;
