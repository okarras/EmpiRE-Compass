import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { orkgAskService } from '../../services/orkgAskService';

interface PaperSynthesisDialogProps {
  open: boolean;
  onClose: () => void;
  paperId: string;
  paperUri?: string;
}

const PaperSynthesisDialog: React.FC<PaperSynthesisDialogProps> = ({
  open,
  onClose,
  paperId,
  paperUri,
}) => {
  const [question, setQuestion] = useState('');
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSynthesize = async () => {
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    setLoading(true);
    setError(null);
    setSynthesis(null);

    try {
      const response = await orkgAskService.askQuestion(question.trim(), [
        paperId,
      ]);
      const text =
        response?.payload?.synthesis ??
        (response as { synthesis?: string })?.synthesis ??
        '';
      setSynthesis(text || 'No synthesis text returned.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate synthesis.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuestion('');
    setSynthesis(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: '#e86161', fontWeight: 600 }}>
        Paper Synthesis
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ask a question about this paper. The AI will synthesize an answer from
          the paper&apos;s abstract.
        </Typography>
        {paperUri && (
          <Typography
            variant="caption"
            component="a"
            href={paperUri}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'block', mb: 2, color: 'primary.main' }}
          >
            {paperUri}
          </Typography>
        )}
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Question"
          placeholder="e.g., What methods does this paper use?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
        />
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Generating synthesis...
            </Typography>
          </Box>
        )}
        {synthesis && !loading && (
          <Box
            sx={{
              p: 2,
              backgroundColor: 'rgba(248, 249, 250, 0.8)',
              borderRadius: 1,
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 1, color: '#e86161' }}
            >
              Synthesis
            </Typography>
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
            >
              {synthesis}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handleSynthesize}
          disabled={loading || !question.trim()}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': { backgroundColor: '#d45151' },
          }}
        >
          {loading ? 'Synthesizing...' : 'Synthesize'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaperSynthesisDialog;
