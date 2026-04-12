import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  TextField,
  Link,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
} from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { Settings, CheckCircle, Search } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { AppDispatch } from '../../store';
import {
  setProvider,
  setOpenAIModel,
  setGroqModel,
  setMistralModel,
  setGoogleModel,
  setOpenRouterModel,
  setOpenRouterApiKey,
  setOpenRouterTermsAccepted,
  setUseEnvironmentKeys,
  type AIProvider,
  type OpenAIModel,
  type GroqModel,
  type MistralModel,
  type GoogleModel,
} from '../../store/slices/aiSlice';
import {
  fetchOpenRouterModels,
  fetchBackendAiConfig,
  formatUsdPerM,
  openRouterUsdPerMillion,
  type OpenRouterApiModel,
  type BackendAiConfigResponse,
} from '../../services/openrouterModelsService';

interface AIConfigurationDialogProps {
  open: boolean;
  onClose: () => void;
}

const filterModels = createFilterOptions<OpenRouterApiModel>({
  matchFrom: 'any',
  stringify: (option) =>
    [
      option.name,
      option.id,
      option.description ?? '',
      option.architecture?.modality ?? '',
      ...(option.architecture?.input_modalities ?? []),
      ...(option.architecture?.output_modalities ?? []),
    ].join(' '),
});

function applyServerModelToState(
  dispatch: AppDispatch,
  provider: AIProvider,
  model: string
) {
  switch (provider) {
    case 'openai':
      dispatch(setOpenAIModel(model as OpenAIModel));
      break;
    case 'groq':
      dispatch(setGroqModel(model as GroqModel));
      break;
    case 'mistral':
      dispatch(setMistralModel(model as MistralModel));
      break;
    case 'google':
      dispatch(setGoogleModel(model as GoogleModel));
      break;
    default:
      break;
  }
}

const AIConfigurationDialog: React.FC<AIConfigurationDialogProps> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const {
    openrouterModel,
    openrouterApiKey,
    isConfigured,
    openRouterTermsAccepted,
    useEnvironmentKeys,
  } = useAppSelector((state) => state.ai);

  const [localMode, setLocalMode] = useState<'system' | 'openrouter'>(
    useEnvironmentKeys ? 'system' : 'openrouter'
  );
  const [localModel, setLocalModel] = useState(openrouterModel);
  const [localApiKey, setLocalApiKey] = useState(openrouterApiKey);
  const [localTermsAccepted, setLocalTermsAccepted] = useState(
    openRouterTermsAccepted
  );
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<OpenRouterApiModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [serverConfig, setServerConfig] =
    useState<BackendAiConfigResponse | null>(null);
  const [serverConfigLoading, setServerConfigLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalMode(useEnvironmentKeys ? 'system' : 'openrouter');
      setLocalModel(openrouterModel);
      setLocalApiKey(openrouterApiKey);
      setLocalTermsAccepted(openRouterTermsAccepted);
      setError(null);
    }
  }, [
    open,
    useEnvironmentKeys,
    openrouterModel,
    openrouterApiKey,
    openRouterTermsAccepted,
  ]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setServerConfigLoading(true);
    fetchBackendAiConfig()
      .then((c) => {
        if (!cancelled) setServerConfig(c);
      })
      .finally(() => {
        if (!cancelled) setServerConfigLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || localMode !== 'openrouter') return;
    const ac = new AbortController();
    setModelsError(null);
    setModelsLoading(true);
    fetchOpenRouterModels({ signal: ac.signal })
      .then((list) => setModels(list))
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return;
        const msg =
          e instanceof Error ? e.message : 'Could not load OpenRouter models';
        setModelsError(msg);
      })
      .finally(() => setModelsLoading(false));
    return () => ac.abort();
  }, [open, localMode]);

  const optionsWithSavedFallback = useMemo(() => {
    const ids = new Set(models.map((m) => m.id));
    if (localModel.trim() && !ids.has(localModel.trim())) {
      return [
        {
          id: localModel.trim(),
          name: `${localModel.trim()} (saved — not in current catalog)`,
        },
        ...models,
      ];
    }
    return models;
  }, [models, localModel]);

  const selectedOption = useMemo((): OpenRouterApiModel | null => {
    if (!localModel.trim()) return null;
    return optionsWithSavedFallback.find((m) => m.id === localModel.trim()) ?? null;
  }, [optionsWithSavedFallback, localModel]);

  const handleSave = async () => {
    try {
      if (localMode === 'system') {
        let cfg = serverConfig;
        if (!cfg) {
          cfg = await fetchBackendAiConfig();
        }
        dispatch(setUseEnvironmentKeys(true));
        if (
          cfg &&
          ['openai', 'groq', 'mistral', 'google'].includes(cfg.provider)
        ) {
          dispatch(setProvider(cfg.provider as AIProvider));
          applyServerModelToState(
            dispatch,
            cfg.provider as AIProvider,
            cfg.model
          );
        } else {
          dispatch(setProvider('openai'));
          dispatch(setOpenAIModel('gpt-4o-mini'));
        }
        onClose();
        return;
      }

      if (!localApiKey.trim()) {
        setError('OpenRouter API key is required');
        return;
      }
      if (!localTermsAccepted) {
        setError('You must accept the security terms to continue');
        return;
      }
      if (!localModel.trim()) {
        setError('Select a model');
        return;
      }

      dispatch(setUseEnvironmentKeys(false));
      dispatch(setProvider('openrouter'));
      dispatch(setOpenRouterModel(localModel.trim()));
      dispatch(setOpenRouterApiKey(localApiKey.trim()));
      dispatch(setOpenRouterTermsAccepted(localTermsAccepted));

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

  const canSave =
    localMode === 'system' ||
    (localApiKey.trim().length > 0 &&
      localTermsAccepted &&
      localModel.trim().length > 0);

  const renderModelDetails = (m: OpenRouterApiModel) => {
    const ctx = m.context_length ?? m.top_provider?.context_length ?? null;
    const inP = openRouterUsdPerMillion(m.pricing?.prompt);
    const outP = openRouterUsdPerMillion(m.pricing?.completion);
    const created =
      typeof m.created === 'number'
        ? new Date(m.created * 1000).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : null;

    return (
      <Box sx={{ width: '100%', py: 0.25 }}>
        <Typography sx={{ fontWeight: 600 }}>{m.name}</Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          ID: {m.id}
        </Typography>
        {m.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            component="div"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {m.description.replace(/\n/g, ' ')}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" component="div">
          Context: {ctx != null ? `${ctx.toLocaleString()} tokens` : '—'}
          {created ? ` · Listed: ${created}` : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          Input ($/1M): {formatUsdPerM(inP)} · Output ($/1M):{' '}
          {formatUsdPerM(outP)}
          {m.architecture?.modality ? ` · ${m.architecture.modality}` : ''}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
          Choose the shared <strong>system default</strong> (server API keys) or
          your own <strong>OpenRouter</strong> account. Requests always go
          through the EmpiRE Compass backend.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl>
            <FormLabel id="ai-mode-label" sx={{ fontWeight: 600, mb: 1 }}>
              AI source
            </FormLabel>
            <RadioGroup
              aria-labelledby="ai-mode-label"
              value={localMode}
              onChange={(_, v) => setLocalMode(v as 'system' | 'openrouter')}
            >
              <FormControlLabel
                value="system"
                control={<Radio color="primary" />}
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      System default (EmpiRE Compass)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Uses API keys configured on the server. No personal
                      OpenRouter key or terms required.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="openrouter"
                control={<Radio color="primary" />}
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      My OpenRouter key
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Choose any OpenRouter model; your key is sent to our
                      backend only.
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          {localMode === 'system' && (
            <>
              <Alert severity="info">
                <Typography variant="body2" component="div">
                  The deployment operator configures the default provider and
                  model (e.g. OpenAI, Groq, Mistral, Google) using environment
                  variables. You use that shared setup; you do not need to paste
                  an API key here.
                </Typography>
              </Alert>
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Server configuration (read-only)
                </Typography>
                {serverConfigLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">
                      Loading server settings…
                    </Typography>
                  </Box>
                ) : serverConfig ? (
                  <Typography variant="body2">
                    Provider: <strong>{serverConfig.provider}</strong>
                    {' · '}
                    Model: <strong>{serverConfig.model}</strong>
                    {serverConfig.apiKeyConfigured === false && (
                      <span>
                        {' '}
                        — <em>Server reports no API key; ask your operator.</em>
                      </span>
                    )}
                  </Typography>
                ) : (
                  <Alert severity="warning">
                    Could not load server AI settings (you may need to sign in).
                    Saving will fall back to OpenAI / gpt-4o-mini for request
                    routing; the server may still use its own defaults.
                  </Alert>
                )}
              </Box>
            </>
          )}

          {localMode === 'openrouter' && (
            <>
              <Alert severity="warning">
                <Typography variant="body2" component="div">
                  <strong>
                    When you create your OpenRouter API key, you must set a
                    spending limit and an expiration date
                  </strong>{' '}
                  in the OpenRouter dashboard for your own security. EmpiRE
                  Compass and its operators{' '}
                  <strong>
                    assume no responsibility if your key is leaked, stolen, or
                    misused
                  </strong>
                  , including through your device, network, or any third party.
                </Typography>
              </Alert>

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Model (search OpenRouter catalog)
                </Typography>
                {modelsError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {modelsError} — check that the backend is reachable and{' '}
                    <code>/api/ai/openrouter-models</code> is available.
                  </Alert>
                )}
                <Autocomplete<OpenRouterApiModel, false, true, false>
                  loading={modelsLoading}
                  options={optionsWithSavedFallback}
                  value={selectedOption}
                  onChange={(_, v) => {
                    if (v) setLocalModel(v.id);
                  }}
                  filterOptions={filterModels}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  groupBy={(o) => o.id.split('/')[0] || 'Other'}
                  disableClearable={true}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search by name, id, provider, modality…"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <Search fontSize="small" color="action" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {modelsLoading ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      key={option.id}
                      style={{ alignItems: 'flex-start' }}
                    >
                      {renderModelDetails(option)}
                    </li>
                  )}
                  ListboxProps={{ style: { maxHeight: 400 } }}
                />
                {selectedOption && !modelsLoading && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Selected model id for API calls:{' '}
                    <strong>{localModel}</strong>
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  OpenRouter API key
                </Typography>
                <TextField
                  fullWidth
                  type="password"
                  autoComplete="off"
                  placeholder="sk-or-v1-…"
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  variant="outlined"
                  helperText={
                    <span>
                      Create a key at{' '}
                      <Link
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                      >
                        openrouter.ai/keys
                      </Link>
                      . Stored in session storage for this browser tab only.
                    </span>
                  }
                />
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={localTermsAccepted}
                    onChange={(_, v) => setLocalTermsAccepted(v)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I have read and agree to the security notice above,
                    including that I am responsible for key safety and limits on
                    OpenRouter, and that EmpiRE Compass is not liable for key
                    leakage or misuse.
                  </Typography>
                }
              />

              <Alert severity="info">
                <Typography variant="body2">
                  Requests go to your EmpiRE Compass backend, which calls
                  OpenRouter using your key. The key is not written to
                  application logs or mixed into client-side provider SDKs. AI
                  features are enabled only after you save a key and accept
                  these terms.
                </Typography>
              </Alert>
            </>
          )}

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
          onClick={() => void handleSave()}
          variant="contained"
          disabled={!canSave}
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
          {isConfigured ? 'Update configuration' : 'Save & continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIConfigurationDialog;
