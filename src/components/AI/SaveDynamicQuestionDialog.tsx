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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Save, Groups3 as Groups3Icon } from '@mui/icons-material';

interface SaveDynamicQuestionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, isCommunity: boolean) => Promise<void>;
  defaultName?: string;
  loading?: boolean;
  mode: 'save' | 'share';
}

const SaveDynamicQuestionDialog = ({
  open,
  onClose,
  onSave,
  defaultName = '',
  loading = false,
  mode,
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
      // If mode is 'share', it is a community question (true).
      // If mode is 'save', it is a system example (false).
      await onSave(name.trim(), mode === 'share');
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

  const title = mode === 'save' ? 'Save as Example' : 'Share with Community';
  const description =
    mode === 'save'
      ? 'Save this dynamic question as a system example.'
      : 'Share this dynamic question with the community. It will be visible to all users.';
  const buttonLabel = mode === 'save' ? 'Save Example' : 'Share Question';
  const icon = mode === 'save' ? <Save /> : <Groups3Icon />; // Need to import Groups3Icon if using it, or just use Save/Share icon

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Question Name"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g., Empirical studies by periods"
            disabled={loading}
            helperText="Enter a descriptive name"
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
          startIcon={icon}
          disabled={loading || !name.trim()}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': {
              backgroundColor: '#d45555',
            },
          }}
        >
          {loading ? 'Processing...' : buttonLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveDynamicQuestionDialog;
