import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import Groups3Icon from '@mui/icons-material/Groups3';
import CRUDDynamicQuestions, {
  DynamicQuestion,
} from '../firestore/CRUDDynamicQuestions';
import CommunityQuestionAccordion from '../components/CommunityQuestionAccordion';
import { useAuthData } from '../auth/useAuthData';

const CommunityQuestions = () => {
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const { user } = useAuthData();
  const isAdmin = user?.is_admin === true;

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const data = await CRUDDynamicQuestions.getCommunityQuestions(50);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load community questions', err);
      setError('Failed to load community questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this community question? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await CRUDDynamicQuestions.deleteDynamicQuestion(id, true);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setDeleteSuccess(true);
    } catch (err) {
      console.error('Failed to delete question', err);
      setError('Failed to delete question. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, md: 6 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '1000px',
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Groups3Icon sx={{ fontSize: 48, color: '#e86161', mb: 2 }} />
        <Typography
          variant="h4"
          gutterBottom
          fontWeight="bold"
          color="text.primary"
        >
          Community Questions
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{ maxWidth: 600 }}
        >
          Explore questions created and shared by the community. These are
          dynamic questions powered by SPARQL queries and AI analysis.
        </Typography>
      </Box>

      <Box sx={{ width: '100%', maxWidth: '1000px' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#e86161' }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Snackbar
          open={deleteSuccess}
          autoHideDuration={4000}
          onClose={() => setDeleteSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setDeleteSuccess(false)}>
            Question deleted successfully
          </Alert>
        </Snackbar>

        {!loading && !error && questions.length === 0 && (
          <Alert severity="info" sx={{ mb: 4 }}>
            No community questions available yet. Be the first to share one from
            the Playground!
          </Alert>
        )}

        {!loading &&
          questions.map((q) => (
            <Box key={q.id} sx={{ mb: 3 }}>
              <CommunityQuestionAccordion
                question={q}
                onDelete={isAdmin ? () => handleDelete(q.id) : undefined}
              />
            </Box>
          ))}
      </Box>
    </Box>
  );
};

export default CommunityQuestions;
