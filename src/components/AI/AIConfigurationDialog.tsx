import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { Settings, CheckCircle } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setProvider,
  setOpenAIModel,
  setGroqModel,
  setMistralModel,
  setIsConfigured,
  setUseEnvironmentKeys,
  OPENAI_MODELS,
  GROQ_MODELS,
  MISTRAL_MODELS,
  type AIProvider,
  type OpenAIModel,
  type GroqModel,
  type MistralModel,
} from '../../store/slices/aiSlice';

interface AIConfigurationDialogProps {
  open: boolean;
  onClose: () => void;
}

const AIConfigurationDialog: React.FC<AIConfigurationDialogProps> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { provider, openaiModel, groqModel, mistralModel, isConfigured } =
    useAppSelector((state) => state.ai);

  // Local state for form
  const [localProvider, setLocalProvider] = useState<AIProvider>(provider);
  const [localOpenAIModel, setLocalOpenAIModel] =
    useState<OpenAIModel>(openaiModel);
  const [localGroqModel, setLocalGroqModel] = useState<GroqModel>(groqModel);
  const [localMistralModel, setLocalMistralModel] =
    useState<MistralModel>(mistralModel);
  const [error, setError] = useState<string | null>(null);

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalProvider(provider);
      setLocalOpenAIModel(openaiModel);
      setLocalGroqModel(groqModel);
      setLocalMistralModel(mistralModel);
      setError(null);
    }
  }, [open, provider, openaiModel, groqModel, mistralModel]);

  const handleSave = () => {
    try {
      // Save to store — always use backend environment keys
      dispatch(setProvider(localProvider));
      dispatch(setOpenAIModel(localOpenAIModel));
      dispatch(setGroqModel(localGroqModel));
      dispatch(setMistralModel(localMistralModel));
      dispatch(setUseEnvironmentKeys(true));
      dispatch(setIsConfigured(true));

      onClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : err
            ? String(err)
            : 'An error occurred';
      setError(errorMessage);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // handleClearStoredSettings removed - no longer needed without API keys

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Settings sx={{ color: '#e86161' }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            AI Assistant Setup
          </Typography>
          {isConfigured && (
            <Chip
              icon={<CheckCircle />}
              label="Ready"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Configure your AI provider and model. API keys are managed securely
          via backend environment variables.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Provider Selection */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Choose AI Provider
            </Typography>
            <FormControl fullWidth>
              <Select
                value={localProvider}
                onChange={(e) => setLocalProvider(e.target.value as AIProvider)}
                variant="outlined"
                sx={{ '& .MuiSelect-select': { py: 1.5 } }}
              >
                <MenuItem value="mistral">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Mistral AI
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        High-performance models • Mistral Large, Medium, Small
                      </Typography>
                    </Box>
                    <Chip
                      label="Default"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </MenuItem>
                <MenuItem value="groq">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Groq
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Fast inference • Llama, DeepSeek, Mixtral
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value="openai">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        OpenAI
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        GPT-4, GPT-3.5 models
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Model Selection */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Select Model
            </Typography>
            <FormControl fullWidth>
              <Select
                value={
                  localProvider === 'openai'
                    ? localOpenAIModel
                    : localProvider === 'groq'
                      ? localGroqModel
                      : localMistralModel
                }
                onChange={(e) => {
                  if (localProvider === 'openai') {
                    setLocalOpenAIModel(e.target.value as OpenAIModel);
                  } else if (localProvider === 'groq') {
                    setLocalGroqModel(e.target.value as GroqModel);
                  } else if (localProvider === 'mistral') {
                    setLocalMistralModel(e.target.value as MistralModel);
                  }
                }}
                variant="outlined"
                sx={{ '& .MuiSelect-select': { py: 1.5 } }}
              >
                {localProvider === 'openai'
                  ? OPENAI_MODELS.map((model) => (
                      <MenuItem key={model} value={model}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                          }}
                        >
                          <Typography sx={{ fontWeight: 500 }}>
                            {model}
                          </Typography>
                          <Chip
                            label={
                              model.includes('gpt-4') ? 'Advanced' : 'Standard'
                            }
                            size="small"
                            variant="outlined"
                            color={
                              model.includes('gpt-4') ? 'primary' : 'default'
                            }
                          />
                        </Box>
                      </MenuItem>
                    ))
                  : localProvider === 'groq'
                    ? GROQ_MODELS.map((model) => (
                        <MenuItem key={model} value={model}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%',
                            }}
                          >
                            <Typography sx={{ fontWeight: 500 }}>
                              {model}
                            </Typography>
                            {model === 'deepseek-r1-distill-llama-70b' && (
                              <Chip
                                label="Recommended"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {(model.includes('70b') ||
                              model.includes('405b')) &&
                              model !== 'deepseek-r1-distill-llama-70b' && (
                                <Chip
                                  label="Large"
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              )}
                          </Box>
                        </MenuItem>
                      ))
                    : MISTRAL_MODELS.map((model) => (
                        <MenuItem key={model} value={model}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%',
                            }}
                          >
                            <Typography sx={{ fontWeight: 500 }}>
                              {model}
                            </Typography>
                            {model === 'mistral-large-latest' && (
                              <Chip
                                label="Default"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {model.includes('large') &&
                              model !== 'mistral-large-latest' && (
                                <Chip
                                  label="Large"
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              )}
                          </Box>
                        </MenuItem>
                      ))}
              </Select>
            </FormControl>
          </Box>

          {/* API keys are managed via backend environment variables */}
          <Alert severity="info">
            <Typography variant="body2">
              API keys are managed via backend environment variables for
              security. No manual key entry is needed.
            </Typography>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={handleCancel}
          color="inherit"
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            backgroundColor: '#e86161',
            textTransform: 'none',
            px: 3,
            '&:hover': {
              backgroundColor: '#d45151',
            },
            '&:disabled': {
              backgroundColor: 'action.disabledBackground',
            },
          }}
        >
          {isConfigured ? 'Update Configuration' : 'Save & Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIConfigurationDialog;
