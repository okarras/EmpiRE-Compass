import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import VerifiedIcon from '@mui/icons-material/Verified';

interface MissingField {
  questionId: string;
  questionLabel: string;
  sectionId: string;
  sectionTitle: string;
}

interface InvalidField {
  questionId: string;
  questionLabel: string;
  errorMessage: string;
  sectionId: string;
  sectionTitle: string;
}

interface AIVerification {
  questionId: string;
  status: 'pending' | 'verified' | 'needs_improvement' | 'error';
  feedback?: string;
  suggestions?: string[];
  confidence: number;
  qualityScore?: number;
}

interface ValidationStatusButtonProps {
  totalRequired: number;
  answeredRequired: number;
  missingFields?: MissingField[];
  invalidFields?: InvalidField[];
  aiVerificationStatus?: 'not_started' | 'in_progress' | 'complete';
  aiVerifications?: Record<string, AIVerification>;
  onRunAIVerification?: () => Promise<void>;
}

type ButtonState = 'incomplete' | 'invalid' | 'ready' | 'complete';

const ValidationStatusButton: React.FC<ValidationStatusButtonProps> = ({
  totalRequired,
  answeredRequired,
  missingFields = [],
  invalidFields = [],
  aiVerificationStatus = 'not_started',
  aiVerifications = {},
  onRunAIVerification,
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const actualInvalidCount = invalidFields.length;

  const getButtonState = (): ButtonState => {
    if (actualInvalidCount > 0) return 'invalid';
    if (answeredRequired < totalRequired) return 'incomplete';
    if (aiVerificationStatus === 'complete') return 'complete';
    return 'ready';
  };

  const buttonState = getButtonState();

  const getButtonConfig = () => {
    switch (buttonState) {
      case 'incomplete':
        const remaining = totalRequired - answeredRequired;
        return {
          color: 'primary' as const,
          icon: <WarningIcon />,
          text: `Complete ${remaining} more required`,
          variant: 'contained' as const,
        };
      case 'invalid':
        return {
          color: 'primary' as const,
          icon: <ErrorIcon />,
          text: `Fix ${actualInvalidCount} invalid answer${actualInvalidCount !== 1 ? 's' : ''}`,
          variant: 'contained' as const,
        };
      case 'ready':
        return {
          color: 'primary' as const,
          icon: <VerifiedIcon />,
          text: 'Verify with AI',
          variant: 'contained' as const,
        };
      case 'complete':
        return {
          color: 'success' as const,
          icon: <CheckCircleIcon />,
          text: 'All validated ✓',
          variant: 'contained' as const,
        };
    }
  };

  const buttonConfig = getButtonConfig();

  const handleClick = () => {
    if (buttonState === 'incomplete' && missingFields.length > 0) {
      setActiveTab(0);
    } else if (buttonState === 'invalid' && invalidFields.length > 0) {
      setActiveTab(1);
    } else {
      setActiveTab(2);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRunAIVerification = async () => {
    if (onRunAIVerification && !isVerifying) {
      setIsVerifying(true);
      try {
        await onRunAIVerification();
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const groupedMissingFields = missingFields.reduce(
    (acc, field) => {
      if (!acc[field.sectionTitle]) {
        acc[field.sectionTitle] = [];
      }
      acc[field.sectionTitle].push(field);
      return acc;
    },
    {} as Record<string, MissingField[]>
  );

  return (
    <>
      <Button
        size="small"
        color={buttonConfig.color}
        variant={buttonConfig.variant}
        startIcon={buttonConfig.icon}
        onClick={handleClick}
      >
        {buttonConfig.text}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        aria-labelledby="validation-dialog-title"
      >
        <DialogTitle id="validation-dialog-title">
          Validation Status
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab
              label={`Missing (${missingFields.length})`}
              disabled={missingFields.length === 0}
            />
            <Tab
              label={`Invalid (${invalidFields.length})`}
              disabled={invalidFields.length === 0}
            />
            <Tab label="AI Verification" />
          </Tabs>
        </Box>

        <DialogContent dividers sx={{ minHeight: 300, maxHeight: 500 }}>
          {/* Missing Fields Tab */}
          {activeTab === 0 && (
            <Box>
              {missingFields.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  All required fields are completed.
                </Typography>
              ) : (
                Object.entries(groupedMissingFields).map(
                  ([sectionTitle, fields]) => (
                    <Box key={sectionTitle} sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        {sectionTitle}
                      </Typography>
                      <List dense disablePadding>
                        {fields.map((field) => (
                          <ListItem key={field.questionId} disablePadding>
                            <ListItemText
                              primary={field.questionLabel}
                              slotProps={{
                                primary: { variant: 'body2' },
                              }}
                              sx={{ py: 0.5, pl: 2 }}
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Divider sx={{ mt: 1 }} />
                    </Box>
                  )
                )
              )}
            </Box>
          )}

          {/* Invalid Fields Tab */}
          {activeTab === 1 && (
            <Box>
              {invalidFields.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No validation errors found.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {invalidFields.map((field) => (
                    <React.Fragment key={field.questionId}>
                      <ListItem
                        sx={{
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          py: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {field.questionLabel}
                        </Typography>
                        <Typography variant="caption" color="error">
                          {field.errorMessage}
                        </Typography>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* AI Verification Tab */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleRunAIVerification}
                  disabled={isVerifying || answeredRequired < totalRequired}
                  startIcon={
                    isVerifying ? (
                      <CircularProgress size={16} />
                    ) : (
                      <VerifiedIcon />
                    )
                  }
                >
                  {isVerifying
                    ? 'Verifying All Answers...'
                    : 'Verify All Answers'}
                </Button>
                {answeredRequired < totalRequired && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Complete all required fields before running AI verification
                  </Typography>
                )}
                {isVerifying && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Verifying answers... This may take a moment.
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      <CircularProgress size={20} />
                      <Typography variant="caption">
                        Processing {Object.keys(aiVerifications).length}{' '}
                        questions
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {(aiVerificationStatus === 'complete' ||
                aiVerificationStatus === 'in_progress') &&
                Object.keys(aiVerifications).length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, fontWeight: 600 }}
                    >
                      Verification Results (
                      {Object.keys(aiVerifications).length})
                    </Typography>
                    <List dense disablePadding>
                      {Object.entries(aiVerifications).map(
                        ([questionId, verification]) => (
                          <React.Fragment key={questionId}>
                            <ListItem
                              sx={{
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                py: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  width: '100%',
                                }}
                              >
                                {verification.status === 'verified' && (
                                  <CheckCircleIcon
                                    color="success"
                                    fontSize="small"
                                  />
                                )}
                                {verification.status ===
                                  'needs_improvement' && (
                                  <WarningIcon
                                    color="warning"
                                    fontSize="small"
                                  />
                                )}
                                {verification.status === 'error' && (
                                  <ErrorIcon color="error" fontSize="small" />
                                )}
                                {verification.status === 'pending' && (
                                  <CircularProgress size={16} />
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{ flex: 1, fontWeight: 500 }}
                                >
                                  {questionId}
                                </Typography>
                                {verification.confidence !== undefined &&
                                  verification.status !== 'pending' && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {Math.round(
                                        verification.confidence * 100
                                      )}
                                      %
                                    </Typography>
                                  )}
                              </Box>
                              {verification.feedback && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ mt: 0.5 }}
                                >
                                  {verification.feedback}
                                </Typography>
                              )}
                              {verification.suggestions &&
                                verification.suggestions.length > 0 && (
                                  <Box sx={{ mt: 0.5 }}>
                                    <Typography
                                      variant="caption"
                                      fontWeight="bold"
                                    >
                                      Suggestions:
                                    </Typography>
                                    {verification.suggestions
                                      .slice(0, 2)
                                      .map((suggestion, idx) => (
                                        <Typography
                                          key={idx}
                                          variant="caption"
                                          display="block"
                                          sx={{ ml: 1 }}
                                        >
                                          • {suggestion}
                                        </Typography>
                                      ))}
                                  </Box>
                                )}
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        )
                      )}
                    </List>
                  </Box>
                )}

              {aiVerificationStatus === 'not_started' &&
                Object.keys(aiVerifications).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No verification results yet. Click "Verify All Answers" to
                    check answer quality with AI.
                  </Typography>
                )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ValidationStatusButton;
