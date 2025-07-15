/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
  Divider,
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
    setLocalProvider('openai');
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings sx={{ color: '#e86161' }} />
          <Typography variant="h6">AI Configuration</Typography>
          {isConfigured && (
            <Chip
              icon={<CheckCircle />}
              label="Configured"
              size="small"
              sx={{
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                color: '#4caf50',
                border: '1px solid #4caf50',
              }}
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            marginTop: 2,
          }}
        >
          {/* Provider Selection */}
          <FormControl fullWidth>
            <InputLabel>AI Provider</InputLabel>
            <Select
              value={localProvider}
              onChange={(e) => setLocalProvider(e.target.value as AIProvider)}
              label="AI Provider"
            >
              <MenuItem value="openai">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>OpenAI</Typography>
                  <Chip
                    label="GPT-4, GPT-3.5"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </MenuItem>
              <MenuItem value="groq">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>Groq</Typography>
                  <Chip
                    label="Llama, Mixtral, Gemma"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Model Selection */}
          <FormControl fullWidth>
            <InputLabel>Model</InputLabel>
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
              label="Model"
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
                        <Typography>{model}</Typography>
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
                        <Typography>{model}</Typography>
                        <Chip
                          label={
                            model.includes('70b') || model.includes('405b')
                              ? 'Large'
                              : 'Standard'
                          }
                          size="small"
                          variant="outlined"
                          color={
                            model.includes('70b') || model.includes('405b')
                              ? 'primary'
                              : 'default'
                          }
                        />
                      </Box>
                    </MenuItem>
                  ))}
            </Select>
          </FormControl>

          <Divider />

          {/* API Key Configuration */}
          <Box>
            <Typography variant="h6" gutterBottom>
              API Key Configuration
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localUseEnvironmentKeys}
                  onChange={(e) => setLocalUseEnvironmentKeys(e.target.checked)}
                />
              }
              label="Use environment variables (recommended for production)"
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

          {/* Configuration Status */}
          <Box
            sx={{
              p: 2,
              backgroundColor: 'rgba(232, 97, 97, 0.02)',
              borderRadius: 1,
              border: '1px solid rgba(232, 97, 97, 0.1)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="subtitle2" sx={{ color: '#e86161' }}>
                Current Configuration
              </Typography>
              {hasStoredSettings() && (
                <Chip
                  label="Saved in Browser"
                  size="small"
                  variant="outlined"
                  color="success"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Provider: <strong>{localProvider.toUpperCase()}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Model:{' '}
              <strong>
                {localProvider === 'openai' ? localOpenAIModel : localGroqModel}
              </strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              API Key:{' '}
              <strong>{isApiKeyValid() ? 'Valid' : 'Invalid/Missing'}</strong>
            </Typography>
            {hasStoredSettings() && (
              <Button
                size="small"
                onClick={handleClearStoredSettings}
                sx={{
                  mt: 1,
                  color: '#e86161',
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(232, 97, 97, 0.08)',
                  },
                }}
              >
                Clear Stored Settings
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isApiKeyValid()}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': {
              backgroundColor: '#d45151',
            },
          }}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIConfigurationDialog;
