import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  ThumbDown,
  ThumbDownOutlined,
} from '@mui/icons-material';
import CRUDAiEvaluations from '../../firestore/CRUDAiEvaluations';
import { useAuthData } from '../../auth/useAuthData';

export interface AiEvaluationWidgetProps {
  targetType: 'chart' | 'question' | 'sparql';
  targetId: string;
}

const AiEvaluationWidget: React.FC<AiEvaluationWidgetProps> = ({
  targetType,
  targetId,
}) => {
  const { user } = useAuthData();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Only show the widget if the user is authenticated (evaluations require user context)
  if (!user) {
    return null;
  }

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
    setShowComment(true);
  };

  const handleSubmit = async () => {
    if (rating === null) return;

    setIsSubmitting(true);
    try {
      await CRUDAiEvaluations.submitAiEvaluation(
        {
          targetType,
          targetId,
          rating,
          comment,
        },
        user.id,
        user.email
      );

      setSnackbar({
        open: true,
        message: 'Feedback submitted successfully. Thank you!',
        severity: 'success',
      });

      // Reset after submission
      setRating(null);
      setComment('');
      setShowComment(false);
    } catch (error) {
      console.error('Submission failed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit feedback. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'nowrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Helpful">
          <IconButton
            color={rating === 1 ? 'primary' : 'default'}
            onClick={() => handleRatingClick(1)}
            disabled={isSubmitting}
          >
            {rating === 1 ? <ThumbUp /> : <ThumbUpOutlined />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Not Helpful">
          <IconButton
            color={rating === -1 ? 'error' : 'default'}
            onClick={() => handleRatingClick(-1)}
            disabled={isSubmitting}
          >
            {rating === -1 ? <ThumbDown /> : <ThumbDownOutlined />}
          </IconButton>
        </Tooltip>
      </Box>

      {showComment && (
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}
        >
          <TextField
            fullWidth
            size="small"
            label="Additional comments (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
            sx={{ minWidth: '400px' }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={() => {
                setShowComment(false);
                setRating(null);
                setComment('');
              }}
              disabled={isSubmitting}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === null}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Submit Feedback
            </Button>
          </Box>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AiEvaluationWidget;
