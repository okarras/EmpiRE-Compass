import { Container, ThemeProvider, Typography, Box } from '@mui/material';
import { useParams, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import type { RootState } from '../store';
import { getTemplateConfig } from '../constants/template_config';
import theme from '../utils/theme';
import Question from '../components/Question';
import { findFirebaseQuestion, mergeQueryWithFirebase } from '../helpers/query';
import { FirebaseQuestion } from '../store/slices/questionSlice';

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
  let targetQuery = queries?.find(
    (query) =>
      query.id === Number(id) || String(query.id) === id || query.uid === id
  );

  if (!targetQuery) {
    const fbq = Object.values(firebaseQuestions).find(
      (q) => q.id === Number(id) || String(q.id) === id || q.uid === id
    );

    if (fbq) {
      targetQuery = {
        ...fbq,
        id: fbq.id || Number(id) || undefined,
        uid: fbq.uid || String(fbq.id) || id,
      } as any;
    }
  }

  useEffect(() => {
    if (!targetQuery) {
      toast.error('Question not found');
    }
  }, [targetQuery]);

  if (!targetQuery) {
    return <Navigate to={`/${templateId}/allquestions`} replace />;
  }

  const firebaseTargetQuery = findFirebaseQuestion(
    Object.values(firebaseQuestions),
    targetQuery
  ) as unknown as Record<string, unknown> | undefined;

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
              alignItems: { xs: 'flex-start', sm: 'flex-end' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 4,
              pb: 1,
              borderBottom: '4px solid #e86161',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: '#e86161',
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                lineHeight: 1.3,
                flex: 1,
                minWidth: 0,
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {`${finalQuery.id}. ${finalQuery.dataAnalysisInformation.question}`}
            </Typography>
            <Box id="question-title-export-action" sx={{ flexShrink: 0 }} />
          </Box>

          <Question query={finalQuery} />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default QuestionPage;
