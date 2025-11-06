import React, { useState, useEffect } from 'react';
import {
  // IconButton,
  // Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
// import { Input } from '@mui/icons-material';

interface ResourceIdInputButtonProps {
  currentTemplateId: string | null;
  onTemplateIdChange: (templateId: string) => void | Promise<void>;
}

const ResourceIdInputButton: React.FC<ResourceIdInputButtonProps> = ({
  currentTemplateId,
  onTemplateIdChange,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState(currentTemplateId || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Update input value when currentTemplateId changes
  useEffect(() => {
    setInputValue(currentTemplateId || '');
  }, [currentTemplateId]);

  // const handleOpenDialog = () => {
  //   setInputValue(currentTemplateId || '');
  //   setError(null);
  //   setDialogOpen(true);
  // };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError(null);
    setLoading(false);
  };

  const handleSave = async () => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      setError('Please enter a resource ID');
      return;
    }

    // Basic validation for resource ID format (should start with 'R' followed by numbers)
    if (!/^R\d+$/.test(trimmedValue)) {
      setError(
        'Resource ID should start with "R" followed by numbers (e.g., R186491)'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onTemplateIdChange(trimmedValue);
      handleCloseDialog();
    } catch (err) {
      setError(
        'Failed to load template. Please check the template ID and try again.'
      );
      console.error('Template change error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setError(null);
  };

  return (
    <>
      {/* <Tooltip title="Change Resource Template ID">
        <IconButton
          onClick={handleOpenDialog}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(232, 97, 97, 0.08)',
            },
          }}
        >
          <Input />
        </IconButton>
      </Tooltip> */}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Resource Template ID</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Resource ID"
            placeholder="e.g., R186491"
            fullWidth
            variant="outlined"
            value={inputValue}
            onChange={handleInputChange}
            error={!!error}
            helperText={
              error ||
              "Enter a resource ID starting with 'R' followed by numbers"
            }
            sx={{ mt: 2 }}
          />
          {currentTemplateId && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Current template ID: {currentTemplateId}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!inputValue.trim() || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Loading...' : 'Change Template'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ResourceIdInputButton;
