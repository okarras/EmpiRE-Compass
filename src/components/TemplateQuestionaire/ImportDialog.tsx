import React, { useState, useEffect, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Fade from '@mui/material/Fade';
import DescriptionIcon from '@mui/icons-material/Description';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: 'replace' | 'merge') => void;
  fileName: string;
  importData: Record<string, any> | null;
  error: string | null;
  isValidating: boolean;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  open,
  onClose,
  onConfirm,
  fileName,
  importData,
  error,
  isValidating,
}) => {
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      open &&
      !error &&
      !isValidating &&
      importData &&
      importButtonRef.current
    ) {
      const timer = setTimeout(() => {
        importButtonRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [open, error, isValidating, importData]);

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = event.target.value as 'replace' | 'merge';
    setImportMode(newMode);
  };

  const handleConfirm = () => {
    onConfirm(importMode);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
    if (event.key === 'Enter' && !isValidating && !error && importData) {
      event.preventDefault();
      handleConfirm();
    }
  };

  const calculatePreviewData = () => {
    if (!importData)
      return { answerCount: 0, sectionCount: 0, hasArrayData: false };

    const keys = Object.keys(importData);
    let sectionCount = 0;
    let hasArrayData = false;

    keys.forEach((key) => {
      const value = importData[key];
      if (Array.isArray(value)) {
        hasArrayData = true;
        sectionCount++;
      }
    });

    return {
      answerCount: keys.length,
      sectionCount,
      hasArrayData,
    };
  };

  const previewData = calculatePreviewData();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      fullWidth
      maxWidth="sm"
      aria-labelledby="import-dialog-title"
      aria-describedby="import-dialog-description"
      aria-modal="true"
      role="dialog"
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 300 }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3,
        },
      }}
    >
      <DialogTitle
        id="import-dialog-title"
        sx={{
          pb: 2,
          fontWeight: 600,
        }}
      >
        Import Questionnaire Data
      </DialogTitle>

      <DialogContent
        ref={dialogContentRef}
        dividers
        sx={{
          pt: 2.5,
          pb: 2.5,
          px: { xs: 2, sm: 3 },
        }}
        role="document"
        tabIndex={-1}
      >
        <Fade in={!!fileName} timeout={300}>
          <Box sx={{ mb: 2.5 }}>
            {fileName && (
              <Chip
                icon={<DescriptionIcon aria-hidden="true" />}
                label={fileName}
                color="primary"
                variant="outlined"
                role="status"
                aria-label={`Selected file: ${fileName}`}
                sx={{
                  maxWidth: '100%',
                  height: 'auto',
                  py: 1,
                  '& .MuiChip-label': {
                    display: 'block',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                  },
                }}
              />
            )}
          </Box>
        </Fade>

        <Collapse in={!!error} timeout={300}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
              role="alert"
              aria-live="assertive"
            >
              <Typography
                variant="body2"
                component="div"
                sx={{ fontWeight: 600 }}
              >
                Import Error
              </Typography>
              <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                {error}
              </Typography>
              <Typography
                variant="caption"
                component="div"
                sx={{
                  mt: 1.5,
                  fontStyle: 'italic',
                  color: 'text.secondary',
                }}
              >
                Please select a different file or fix the issues in your JSON
                file and try again.
              </Typography>
            </Alert>
          )}
        </Collapse>

        <Fade in={isValidating} timeout={300}>
          <Box>
            {isValidating && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2.5,
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                }}
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <CircularProgress size={24} aria-hidden="true" />
                <Typography>Validating file...</Typography>
              </Box>
            )}
          </Box>
        </Fade>

        <Fade in={!error && !isValidating && !!importData} timeout={400}>
          <Box>
            {!error && !isValidating && importData && (
              <>
                <FormControl
                  component="fieldset"
                  sx={{
                    mb: 2.5,
                    width: '100%',
                  }}
                >
                  <FormLabel
                    component="legend"
                    id="import-mode-label"
                    sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      color: 'text.primary',
                      '&.Mui-focused': {
                        color: 'text.primary',
                      },
                    }}
                  >
                    Import Mode
                  </FormLabel>
                  <RadioGroup
                    aria-labelledby="import-mode-label"
                    name="import-mode"
                    value={importMode}
                    onChange={handleModeChange}
                    sx={{
                      '& .MuiFormControlLabel-root': {
                        mb: 1,
                        ml: 0,
                        p: 1.5,
                        borderRadius: 1,
                        transition: 'background-color 0.2s ease-in-out',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      },
                    }}
                  >
                    <FormControlLabel
                      value="replace"
                      control={
                        <Radio
                          inputProps={{
                            'aria-describedby': 'replace-mode-description',
                            'aria-label': 'Replace all existing data',
                          }}
                        />
                      }
                      label={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flex: 1,
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: importMode === 'replace' ? 600 : 400,
                            }}
                          >
                            Replace all existing data
                          </Typography>
                          <WarningAmberIcon
                            color="warning"
                            fontSize="small"
                            aria-hidden="true"
                            titleAccess="Warning: This will delete existing data"
                          />
                        </Box>
                      }
                      sx={{
                        bgcolor:
                          importMode === 'replace'
                            ? 'action.selected'
                            : 'transparent',
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 6.5, mb: 1.5, display: 'block' }}
                      id="replace-mode-description"
                    >
                      This will erase all current answers
                    </Typography>

                    <FormControlLabel
                      value="merge"
                      control={
                        <Radio
                          inputProps={{
                            'aria-describedby': 'merge-mode-description',
                            'aria-label': 'Merge with existing data',
                          }}
                        />
                      }
                      label={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flex: 1,
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: importMode === 'merge' ? 600 : 400,
                            }}
                          >
                            Merge with existing data
                          </Typography>
                          <InfoIcon
                            color="info"
                            fontSize="small"
                            aria-hidden="true"
                            titleAccess="Information about merge mode"
                          />
                        </Box>
                      }
                      sx={{
                        bgcolor:
                          importMode === 'merge'
                            ? 'action.selected'
                            : 'transparent',
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 6.5, display: 'block' }}
                      id="merge-mode-description"
                    >
                      Keep existing, add/update new answers
                    </Typography>
                  </RadioGroup>
                </FormControl>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    mb: 2.5,
                    bgcolor: 'background.default',
                    borderRadius: 1.5,
                    transition: 'box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 1,
                    },
                  }}
                  role="region"
                  aria-labelledby="preview-heading"
                  aria-live="polite"
                >
                  <Typography
                    id="preview-heading"
                    variant="subtitle2"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      mb: 1.5,
                    }}
                  >
                    Preview
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
                    role="list"
                    aria-label="Import data summary"
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      role="listitem"
                    >
                      • {previewData.answerCount} answer field
                      {previewData.answerCount !== 1 ? 's' : ''} to import
                    </Typography>
                    {previewData.sectionCount > 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        role="listitem"
                      >
                        • {previewData.sectionCount} section
                        {previewData.sectionCount !== 1 ? 's' : ''} with
                        multiple entries
                      </Typography>
                    )}
                    {previewData.hasArrayData && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 1,
                          fontStyle: 'italic',
                          fontSize: '0.8125rem',
                        }}
                        role="listitem"
                      >
                        Contains repeatable section data
                      </Typography>
                    )}
                  </Box>
                </Paper>

                <Box sx={{ minHeight: 80 }}>
                  <Collapse in={importMode === 'replace'} timeout={300}>
                    {importMode === 'replace' && (
                      <Alert
                        severity="warning"
                        icon={<WarningAmberIcon />}
                        sx={{
                          mb: 0,
                          borderRadius: 1.5,
                        }}
                        role="alert"
                        aria-live="polite"
                      >
                        <Typography variant="body2">
                          <strong>Warning:</strong> Replace mode will
                          permanently delete all existing answers. This cannot
                          be undone.
                        </Typography>
                      </Alert>
                    )}
                  </Collapse>

                  <Collapse in={importMode === 'merge'} timeout={300}>
                    {importMode === 'merge' && (
                      <Alert
                        severity="info"
                        icon={<InfoIcon />}
                        sx={{
                          mb: 0,
                          borderRadius: 1.5,
                        }}
                        role="alert"
                        aria-live="polite"
                      >
                        <Typography variant="body2">
                          <strong>Info:</strong> Merge mode will keep your
                          existing answers and add or update them with the
                          imported data.
                        </Typography>
                      </Alert>
                    )}
                  </Collapse>
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          aria-label={error ? 'Close dialog' : 'Cancel import operation'}
          sx={{
            minWidth: 80,
          }}
        >
          {error ? 'Close' : 'Cancel'}
        </Button>
        <Button
          ref={importButtonRef}
          onClick={handleConfirm}
          variant="contained"
          disabled={isValidating || !!error || !importData}
          aria-label={`Import ${previewData.answerCount} answer fields in ${importMode} mode`}
          aria-disabled={isValidating || !!error || !importData}
          aria-describedby={
            importMode === 'replace'
              ? 'replace-mode-description'
              : 'merge-mode-description'
          }
          sx={{
            minWidth: 80,
          }}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportDialog;
