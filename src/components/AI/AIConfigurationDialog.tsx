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
  setGoogleModel,
  setOpenAIApiKey,
  setGroqApiKey,
  setMistralApiKey,
  setGoogleApiKey,
  setIsConfigured,
  setUseEnvironmentKeys,
  OPENAI_MODELS,
  GROQ_MODELS,
  MISTRAL_MODELS,
  GOOGLE_MODELS,
  type AIProvider,
  type OpenAIModel,
  type GroqModel,
  type MistralModel,
  type GoogleModel,
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
    googleModel,
    openaiApiKey,
    groqApiKey,
    mistralApiKey,
    googleApiKey,
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
  const [localGoogleModel, setLocalGoogleModel] =
    useState<GoogleModel>(googleModel);
  const [localOpenAIApiKey, setLocalOpenAIApiKey] = useState(openaiApiKey);
  const [localGroqApiKey, setLocalGroqApiKey] = useState(groqApiKey);
  const [localMistralApiKey, setLocalMistralApiKey] = useState(mistralApiKey);
  const [localGoogleApiKey, setLocalGoogleApiKey] = useState(googleApiKey);
  const [localUseEnvironmentKeys, setLocalUseEnvironmentKeys] =
    useState(useEnvironmentKeys);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showMistralKey, setShowMistralKey] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalProvider(provider);
      setLocalOpenAIModel(openaiModel);
      setLocalGroqModel(groqModel);
      setLocalMistralModel(mistralModel);
      setLocalGoogleModel(googleModel);
      setLocalOpenAIApiKey(openaiApiKey);
      setLocalGroqApiKey(groqApiKey);
      setLocalMistralApiKey(mistralApiKey);
      setLocalGoogleApiKey(googleApiKey);
      setLocalUseEnvironmentKeys(useEnvironmentKeys);
      setRiskAccepted(useEnvironmentKeys); // Auto-accept if using env keys
      setError(null);
    }
  }, [
    open,
    provider,
    openaiModel,
    groqModel,
    mistralModel,
    googleModel,
    openaiApiKey,
    groqApiKey,
    mistralApiKey,
    googleApiKey,
    useEnvironmentKeys,
  ]);

  const handleSave = () => {
    try {
      // Validate configuration
      if (!localUseEnvironmentKeys) {
        if (!riskAccepted) {
          setError('You must accept the security risks to continue');
          return;
        }
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
        if (localProvider === 'google' && !localGoogleApiKey.trim()) {
          setError('Google API key is required');
          return;
        }
      }

      // Save to store
      dispatch(setProvider(localProvider));
      dispatch(setOpenAIModel(localOpenAIModel));
      dispatch(setGroqModel(localGroqModel));
      dispatch(setMistralModel(localMistralModel));
      dispatch(setGoogleModel(localGoogleModel));
      dispatch(setOpenAIApiKey(localOpenAIApiKey));
      dispatch(setGroqApiKey(localGroqApiKey));
      dispatch(setMistralApiKey(localMistralApiKey));
      dispatch(setGoogleApiKey(localGoogleApiKey));
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
                        GPT-4o mini • Available for all users
                      </Typography>
                    </Box>
                    {localUseEnvironmentKeys && (
                      <Chip
                        label="System Default"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </MenuItem>
                <MenuItem
                  value="mistral"
                  disabled={localUseEnvironmentKeys}
                  sx={{ opacity: localUseEnvironmentKeys ? 0.5 : 1 }}
                  title={
                    localUseEnvironmentKeys
                      ? 'Login or provide your own API key to use this provider'
                      : undefined
                  }
                >
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
                        High-performance models • Requires API key
                      </Typography>
                    </Box>
                    {localUseEnvironmentKeys && (
                      <Chip
                        label="Requires Login"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </MenuItem>
                <MenuItem
                  value="groq"
                  disabled={localUseEnvironmentKeys}
                  sx={{ opacity: localUseEnvironmentKeys ? 0.5 : 1 }}
                  title={
                    localUseEnvironmentKeys
                      ? 'Login or provide your own API key to use this provider'
                      : undefined
                  }
                >
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
                        Fast inference • Requires API key
                      </Typography>
                    </Box>
                    {localUseEnvironmentKeys && (
                      <Chip
                        label="Requires Login"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </MenuItem>
                <MenuItem
                  value="google"
                  disabled={localUseEnvironmentKeys}
                  sx={{ opacity: localUseEnvironmentKeys ? 0.5 : 1 }}
                  title={
                    localUseEnvironmentKeys
                      ? 'Login or provide your own API key to use this provider'
                      : undefined
                  }
                >
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
                        Google Gemini
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Gemini 2.5 Flash, Gemma models • Requires API key
                      </Typography>
                    </Box>
                    {localUseEnvironmentKeys && (
                      <Chip
                        label="Requires Login"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
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
                      : localProvider === 'mistral'
                        ? localMistralModel
                        : localGoogleModel
                }
                onChange={(e) => {
                  if (localProvider === 'openai') {
                    setLocalOpenAIModel(e.target.value as OpenAIModel);
                  } else if (localProvider === 'groq') {
                    setLocalGroqModel(e.target.value as GroqModel);
                  } else if (localProvider === 'mistral') {
                    setLocalMistralModel(e.target.value as MistralModel);
                  } else if (localProvider === 'google') {
                    setLocalGoogleModel(e.target.value as GoogleModel);
                  }
                }}
                variant="outlined"
                sx={{ '& .MuiSelect-select': { py: 1.5 } }}
              >
                {localProvider === 'openai'
                  ? OPENAI_MODELS.map((model) => {
                      const isGpt4oMini = model === 'gpt-4o-mini';
                      const isDisabled =
                        localUseEnvironmentKeys && !isGpt4oMini;

                      return (
                        <MenuItem
                          key={model}
                          value={model}
                          disabled={isDisabled}
                          sx={{ opacity: isDisabled ? 0.5 : 1 }}
                          title={
                            isDisabled
                              ? 'Login or provide your own API key to use this model'
                              : undefined
                          }
                        >
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
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {isGpt4oMini && localUseEnvironmentKeys && (
                                <Chip
                                  label="Available"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                              {isDisabled && (
                                <Chip
                                  label="Requires Login"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              )}
                              {!localUseEnvironmentKeys && (
                                <Chip
                                  label={
                                    model.includes('gpt-4')
                                      ? 'Advanced'
                                      : 'Standard'
                                  }
                                  size="small"
                                  variant="outlined"
                                  color={
                                    model.includes('gpt-4')
                                      ? 'primary'
                                      : 'default'
                                  }
                                />
                              )}
                            </Box>
                          </Box>
                        </MenuItem>
                      );
                    })
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
                            {model === 'llama-3.1-8b-instant' && (
                              <Chip
                                label="Recommended"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {(model.includes('70b') ||
                              model.includes('405b') ||
                              model.includes('120b')) &&
                              model !== 'llama-3.1-8b-instant' && (
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
                    : localProvider === 'mistral'
                      ? MISTRAL_MODELS.map((model) => (
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
                        ))
                      : GOOGLE_MODELS.map((model) => {
                          // Get display label for model
                          const getModelLabel = (m: string) => {
                            if (m === 'gemini-2.5-flash')
                              return 'Gemini 2.5 Flash';
                            if (m === 'gemma-3-27b-it') return 'Gemma 3 (27B)';
                            return m;
                          };

                          return (
                            <MenuItem key={model} value={model}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                }}
                              >
                                <Typography sx={{ fontWeight: 500 }}>
                                  {getModelLabel(model)}
                                </Typography>
                                {model === 'gemini-2.5-flash' && (
                                  <Chip
                                    label="Recommended"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                )}
                                {model === 'gemini-2.5-flash' && (
                                  <Chip
                                    label="Fast"
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                  />
                                )}
                                {model === 'gemma-3-27b-it' && (
                                  <Chip
                                    label="Latest"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </MenuItem>
                          );
                        })}
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
                  onChange={(e) => {
                    setLocalUseEnvironmentKeys(e.target.checked);
                    if (e.target.checked) setRiskAccepted(true);
                  }}
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
                  />
                ) : localProvider === 'mistral' ? (
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
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Google API Key"
                    type={showGoogleKey ? 'text' : 'password'}
                    value={localGoogleApiKey}
                    onChange={(e) => setLocalGoogleApiKey(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowGoogleKey(!showGoogleKey)}
                          edge="end"
                        >
                          {showGoogleKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      ),
                    }}
                  />
                )}
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    Security & Risk Notice
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ mb: 1 }}>
                    Your API keys are stored in <strong>session memory</strong>{' '}
                    and cleared when you close this tab. They are never sent to
                    our servers.
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ mb: 1 }}>
                    <strong>Warning:</strong> Browser storage is not fully
                    secure. Malicious browser extensions or compromised devices
                    could access these keys. We strongly recommend using{' '}
                    <strong>restricted keys</strong> with usage limits/caps.
                  </Typography>
                  <Typography variant="body2">
                    By using this feature you acknowledge that you are solely
                    responsible for any potential exposure or misuse of your API
                    keys, and the EmpiRE-Compass team cannot be held liable for
                    any resulting damage or loss.
                  </Typography>
                </Alert>

                {/* Risk Acceptance Checkbox */}
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'rgba(232, 97, 97, 0.05)',
                    borderRadius: 1,
                    border: '1px solid rgba(232, 97, 97, 0.2)',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={riskAccepted}
                        onChange={(e) => setRiskAccepted(e.target.checked)}
                        color="error"
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        I understand and accept the security risks.
                      </Typography>
                    }
                  />
                </Box>
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info">
                  <Typography variant="body2">
                    Using API keys from backend environment variables. If not
                    configured, you'll need to provide your own API key above.
                  </Typography>
                </Alert>
              </Box>
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
            (!riskAccepted ||
              (localProvider === 'openai' && !localOpenAIApiKey.trim()) ||
              (localProvider === 'groq' && !localGroqApiKey.trim()) ||
              (localProvider === 'mistral' && !localMistralApiKey.trim()) ||
              (localProvider === 'google' && !localGoogleApiKey.trim()))
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
