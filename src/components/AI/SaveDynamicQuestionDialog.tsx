import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Save } from '@mui/icons-material';

interface SaveDynamicQuestionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  defaultName?: string;
  loading?: boolean;
}

const SaveDynamicQuestionDialog = ({
  open,
  onClose,
  onSave,
  defaultName = '',
  loading = false,
}: SaveDynamicQuestionDialogProps) => {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for this example question');
      return;
    }

    try {
      setError(null);
      await onSave(name.trim());
      setName('');
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save example question'
      );
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName(defaultName);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Save as Example Question</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Save this dynamic question as an example that other users can load
            and reference. The example will include the question, SPARQL query,
            results, chart, and all interpretations.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Example Name"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g., Empirical studies by periods"
            disabled={loading}
            helperText="Enter a descriptive name for this example question"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={loading || !name.trim()}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': {
              backgroundColor: '#d45555',
            },
          }}
        >
          {loading ? 'Saving...' : 'Save Example'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveDynamicQuestionDialog;
