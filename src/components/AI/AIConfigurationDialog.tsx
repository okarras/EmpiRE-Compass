/* eslint-disable @typescript-eslint/ban-ts-comment */
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
  Error,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setProvider,
  setOpenAIModel,
  setGroqModel,
  setOpenAIApiKey,
  setGroqApiKey,
  setIsConfigured,
  setUseEnvironmentKeys,
  clearStoredConfiguration,
  OPENAI_MODELS,
  GROQ_MODELS,
  type AIProvider,
  type OpenAIModel,
  type GroqModel,
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
    openaiApiKey,
    groqApiKey,
    isConfigured,
    useEnvironmentKeys,
  } = useAppSelector((state) => state.ai);

  // Local state for form
  const [localProvider, setLocalProvider] = useState<AIProvider>(provider);
  const [localOpenAIModel, setLocalOpenAIModel] =
    useState<OpenAIModel>(openaiModel);
  const [localGroqModel, setLocalGroqModel] = useState<GroqModel>(groqModel);
  const [localOpenAIApiKey, setLocalOpenAIApiKey] = useState(openaiApiKey);
  const [localGroqApiKey, setLocalGroqApiKey] = useState(groqApiKey);
  const [localUseEnvironmentKeys, setLocalUseEnvironmentKeys] =
    useState(useEnvironmentKeys);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalProvider(provider);
      setLocalOpenAIModel(openaiModel);
      setLocalGroqModel(groqModel);
      setLocalOpenAIApiKey(openaiApiKey);
      setLocalGroqApiKey(groqApiKey);
      setLocalUseEnvironmentKeys(useEnvironmentKeys);
      setError(null);
    }
  }, [
    open,
    provider,
    openaiModel,
    groqModel,
    openaiApiKey,
    groqApiKey,
    useEnvironmentKeys,
  ]);

  const handleSave = () => {
    try {
      // Validate configuration
      if (!localUseEnvironmentKeys) {
        if (localProvider === 'openai' && !localOpenAIApiKey.trim()) {
          //@ts-ignore
          throw new Error('OpenAI API key is required');
        }
        if (localProvider === 'groq' && !localGroqApiKey.trim()) {
          //@ts-ignore
          throw new Error('Groq API key is required');
        }
      }

      // Save to store
      dispatch(setProvider(localProvider));
      dispatch(setOpenAIModel(localOpenAIModel));
      dispatch(setGroqModel(localGroqModel));
      dispatch(setOpenAIApiKey(localOpenAIApiKey));
      dispatch(setGroqApiKey(localGroqApiKey));
      dispatch(setUseEnvironmentKeys(localUseEnvironmentKeys));
      dispatch(setIsConfigured(true));

      onClose();
    } catch (err) {
      //@ts-ignore
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleClearStoredSettings = () => {
    dispatch(clearStoredConfiguration());
    // Reset to defaults
    setLocalProvider('groq');
    setLocalOpenAIModel('gpt-4o-mini');
    setLocalGroqModel('deepseek-r1-distill-llama-70b');
    setLocalOpenAIApiKey('');
    setLocalGroqApiKey('');
    setLocalUseEnvironmentKeys(true);
    setError(null);
  };

  // Check if settings are loaded from localStorage
  const hasStoredSettings = () => {
    try {
      return localStorage.getItem('ai-configuration') !== null;
    } catch {
      return false;
    }
  };

  const getCurrentApiKey = () => {
    if (localUseEnvironmentKeys) {
      return localProvider === 'openai'
        ? import.meta.env.VITE_OPEN_AI_API_KEY || 'Not set in environment'
        : import.meta.env.VITE_GROQ_API_KEY || 'Not set in environment';
    }
    return localProvider === 'openai' ? localOpenAIApiKey : localGroqApiKey;
  };

  const isApiKeyValid = () => {
    const key = getCurrentApiKey();
    return key && key !== 'Not set in environment' && key.length > 0;
  };

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
          Configure your AI provider to get started
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
                    <Chip
                      label="Recommended"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
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
                  localProvider === 'openai' ? localOpenAIModel : localGroqModel
                }
                onChange={(e) => {
                  if (localProvider === 'openai') {
                    setLocalOpenAIModel(e.target.value as OpenAIModel);
                  } else {
                    setLocalGroqModel(e.target.value as GroqModel);
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
                  : GROQ_MODELS.map((model) => (
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
                          {(model.includes('70b') || model.includes('405b')) &&
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
                    ))}
              </Select>
            </FormControl>
          </Box>

          {/* API Key Configuration */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              API Key Setup
            </Typography>

            <Box
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>What is an API key?</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                An API key is a secure token that allows this application to
                access AI services. You'll need to create one from your chosen
                provider's platform.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textTransform: 'none' }}
                >
                  Get Groq API Key
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textTransform: 'none' }}
                >
                  Get OpenAI API Key
                </Button>
              </Box>
            </Box>

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
                    Use environment variables
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Recommended for production deployments
                  </Typography>
                </Box>
              }
            />

            {localUseEnvironmentKeys ? (
              <Alert
                severity={isApiKeyValid() ? 'success' : 'warning'}
                sx={{ mt: 2 }}
                icon={isApiKeyValid() ? <CheckCircle /> : <Error />}
              >
                {isApiKeyValid()
                  ? `Using ${localProvider.toUpperCase()} API key from environment variables`
                  : `${localProvider.toUpperCase()} API key not found in environment variables`}
              </Alert>
            ) : (
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
                    helperText="Get your API key from https://platform.openai.com/api-keys"
                  />
                ) : (
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
                    helperText="Get your API key from https://console.groq.com/keys"
                  />
                )}
              </Box>
            )}
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Quick Status */}
          {hasStoredSettings() && (
            <Box
              sx={{
                p: 2,
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                borderRadius: 2,
                border: '1px solid rgba(25, 118, 210, 0.12)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {localProvider.toUpperCase()} •{' '}
                    {localProvider === 'openai'
                      ? localOpenAIModel
                      : localGroqModel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Settings saved locally
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={handleClearStoredSettings}
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  Reset
                </Button>
              </Box>
            </Box>
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
          disabled={!isApiKeyValid()}
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
