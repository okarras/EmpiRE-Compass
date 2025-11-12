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
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Settings,
  CheckCircle,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setProvider,
  setOpenAIModel,
  setGroqModel,
  setMistralModel,
  setOpenAIApiKey,
  setGroqApiKey,
  setMistralApiKey,
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
  const {
    provider,
    openaiModel,
    groqModel,
    mistralModel,
    openaiApiKey,
    groqApiKey,
    mistralApiKey,
    isConfigured,
    useEnvironmentKeys,
  } = useAppSelector((state) => state.ai);

  // Local state for form
  const [localProvider, setLocalProvider] = useState<AIProvider>(provider);
  const [localOpenAIModel, setLocalOpenAIModel] =
    useState<OpenAIModel>(openaiModel);
  const [localGroqModel, setLocalGroqModel] = useState<GroqModel>(groqModel);
  const [localMistralModel, setLocalMistralModel] =
    useState<MistralModel>(mistralModel);
  const [localOpenAIApiKey, setLocalOpenAIApiKey] = useState(openaiApiKey);
  const [localGroqApiKey, setLocalGroqApiKey] = useState(groqApiKey);
  const [localMistralApiKey, setLocalMistralApiKey] = useState(mistralApiKey);
  const [localUseEnvironmentKeys, setLocalUseEnvironmentKeys] =
    useState(useEnvironmentKeys);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showMistralKey, setShowMistralKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalProvider(provider);
      setLocalOpenAIModel(openaiModel);
      setLocalGroqModel(groqModel);
      setLocalMistralModel(mistralModel);
      setLocalOpenAIApiKey(openaiApiKey);
      setLocalGroqApiKey(groqApiKey);
      setLocalMistralApiKey(mistralApiKey);
      setLocalUseEnvironmentKeys(useEnvironmentKeys);
      setError(null);
    }
  }, [
    open,
    provider,
    openaiModel,
    groqModel,
    mistralModel,
    openaiApiKey,
    groqApiKey,
    mistralApiKey,
    useEnvironmentKeys,
  ]);

  const handleSave = () => {
    try {
      // Validate configuration
      if (!localUseEnvironmentKeys) {
        if (localProvider === 'openai' && !localOpenAIApiKey.trim()) {
          setError('OpenAI API key is required');
          return;
        }
        if (localProvider === 'groq' && !localGroqApiKey.trim()) {
          setError('Groq API key is required');
          return;
        }
        if (localProvider === 'mistral' && !localMistralApiKey.trim()) {
          setError('Mistral API key is required');
          return;
        }
      }

      // Save to store
      dispatch(setProvider(localProvider));
      dispatch(setOpenAIModel(localOpenAIModel));
      dispatch(setGroqModel(localGroqModel));
      dispatch(setMistralModel(localMistralModel));
      dispatch(setOpenAIApiKey(localOpenAIApiKey));
      dispatch(setGroqApiKey(localGroqApiKey));
      dispatch(setMistralApiKey(localMistralApiKey));
      dispatch(setUseEnvironmentKeys(localUseEnvironmentKeys));
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
          Configure your AI provider and API keys. API keys are sent securely to
          the backend.
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

          {/* API Key Configuration */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              API Key Setup
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localUseEnvironmentKeys}
                  onChange={(e) => setLocalUseEnvironmentKeys(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">
                    Use backend environment variables
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Use API keys configured in backend (if available)
                  </Typography>
                </Box>
              }
            />

            {!localUseEnvironmentKeys ? (
              <Box sx={{ mt: 2 }}>
                {localProvider === 'openai' ? (
                  <TextField
                    fullWidth
                    label="OpenAI API Key"
                    type={showOpenAIKey ? 'text' : 'password'}
                    value={localOpenAIApiKey}
                    onChange={(e) => setLocalOpenAIApiKey(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                          edge="end"
                        >
                          {showOpenAIKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      ),
                    }}
                    helperText="Your API key is sent securely to the backend and never exposed"
                  />
                ) : localProvider === 'groq' ? (
                  <TextField
                    fullWidth
                    label="Groq API Key"
                    type={showGroqKey ? 'text' : 'password'}
                    value={localGroqApiKey}
                    onChange={(e) => setLocalGroqApiKey(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowGroqKey(!showGroqKey)}
                          edge="end"
                        >
                          {showGroqKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      ),
                    }}
                    helperText="Your API key is sent securely to the backend and never exposed"
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Mistral API Key"
                    type={showMistralKey ? 'text' : 'password'}
                    value={localMistralApiKey}
                    onChange={(e) => setLocalMistralApiKey(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowMistralKey(!showMistralKey)}
                          edge="end"
                        >
                          {showMistralKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      ),
                    }}
                    helperText="Your API key is sent securely to the backend and never exposed"
                  />
                )}
              </Box>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Using API keys from backend environment variables. If not
                  configured, you'll need to provide your own API key above.
                </Typography>
              </Alert>
            )}
          </Box>

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
          disabled={
            !localUseEnvironmentKeys &&
            ((localProvider === 'openai' && !localOpenAIApiKey.trim()) ||
              (localProvider === 'groq' && !localGroqApiKey.trim()) ||
              (localProvider === 'mistral' && !localMistralApiKey.trim()))
          }
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
