import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit,
  SmartToy,
  Save,
  Cancel,
  History,
  Refresh,
  Info,
} from '@mui/icons-material';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import { CodeEditor } from '../CodeEditor';

interface SparqlEditorPanelProps {
  sparqlQuery: string;
  loading: boolean;
  queryResults?: Record<string, unknown>[];
  queryError?: string | null;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  onSparqlChange: (sparql: string) => void;
  onRunEditedQuery: (query?: string) => void;
  handleEdit: () => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleOpenInORKG: () => void;
  onOpenExplanation: () => void;
  historyCount: number;
  onOpenHistory: () => void;
  error: string | null;
  showAIDialog: boolean;
  setShowAIDialog: (open: boolean) => void;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  isAIModifying: boolean;
  handleAIModify: () => void;
}

const SparqlEditorPanel: React.FC<SparqlEditorPanelProps> = ({
  sparqlQuery,
  loading,
  queryResults = [],
  queryError,
  isEditing,
  editContent,
  setEditContent,
  onSparqlChange,
  onRunEditedQuery,
  handleEdit,
  handleSave,
  handleCancel,
  handleOpenInORKG,
  onOpenExplanation,
  historyCount,
  onOpenHistory,
  error,
  showAIDialog,
  setShowAIDialog,
  aiPrompt,
  setAiPrompt,
  isAIModifying,
  handleAIModify,
}) => {
  if (!sparqlQuery) return null;

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h5" sx={{ color: '#e86161', fontWeight: 600 }}>
            SPARQL Query
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isEditing ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  startIcon={<Save />}
                  sx={{
                    backgroundColor: '#e86161',
                    '&:hover': { backgroundColor: '#d45151' },
                  }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCancel}
                  startIcon={<Cancel />}
                >
                  Cancel
                </Button>
                {historyCount > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onOpenHistory}
                    startIcon={<History />}
                    sx={{
                      borderColor: '#e86161',
                      color: '#e86161',
                      '&:hover': {
                        borderColor: '#d45151',
                        backgroundColor: 'rgba(232, 97, 97, 0.08)',
                      },
                    }}
                  >
                    History ({historyCount})
                  </Button>
                )}
              </Box>
            ) : (
              <>
                <Button
                  onClick={handleOpenInORKG}
                  sx={{
                    color: '#e86161',
                    mt: { xs: 2, sm: 0 },
                    ml: 2,
                    '&:hover': {
                      color: '#b33a3a',
                    },
                  }}
                  variant="outlined"
                >
                  <LiveHelpIcon sx={{ mr: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Open in ORKG
                  </Typography>
                </Button>
                <Tooltip title="Edit manually">
                  <IconButton
                    onClick={handleEdit}
                    size="small"
                    sx={{
                      color: '#e86161',
                      '&:hover': {
                        backgroundColor: 'rgba(232, 97, 97, 0.08)',
                      },
                    }}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Ask AI to modify">
                  <IconButton
                    onClick={() => setShowAIDialog(true)}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'rgba(232, 97, 97, 0.08)',
                      },
                    }}
                  >
                    <SmartToy />
                  </IconButton>
                </Tooltip>
                <Tooltip title="View query explanation">
                  <IconButton
                    onClick={onOpenExplanation}
                    size="small"
                    sx={{
                      color: '#e86161',
                      '&:hover': {
                        backgroundColor: 'rgba(232, 97, 97, 0.08)',
                      },
                    }}
                  >
                    <Info />
                  </IconButton>
                </Tooltip>
                {historyCount > 0 && (
                  <Tooltip title={`View ${historyCount} previous versions`}>
                    <IconButton
                      onClick={onOpenHistory}
                      size="small"
                      sx={{
                        color: '#e86161',
                        '&:hover': {
                          backgroundColor: 'rgba(232, 97, 97, 0.08)',
                        },
                      }}
                    >
                      <History />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2, mb: 2 }}>
          <CodeEditor
            value={isEditing ? editContent : sparqlQuery}
            onChange={(value) =>
              isEditing ? setEditContent(value) : onSparqlChange(value)
            }
            language="sparql"
            height="400px"
            readOnly={loading || !isEditing}
            label="SPARQL Query"
            copyable={true}
            formattable={!isEditing}
            fullscreenable={true}
            showMinimap={false}
            placeholder={`PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX orkgc: <http://orkg.org/orkg/class/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?paper ?title
WHERE {
  ?paper orkgp:P31 ?contribution .
  ?paper rdfs:label ?title .
}
LIMIT 10`}
          />
        </Box>

        {/* Query Results Status */}
        {!loading && sparqlQuery && !queryError && (
          <Box sx={{ mb: 2 }}>
            {queryResults &&
            Array.isArray(queryResults) &&
            queryResults.length > 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  ✅ Query executed successfully! Found{' '}
                  <strong>{queryResults.length}</strong> result
                  {queryResults.length !== 1 ? 's' : ''}.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  ⚠️ Query executed successfully but returned no results. Try
                  modifying your query or research question.
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Query Error */}
        {!loading && queryError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              ❌ Query failed: {queryError}
            </Typography>
          </Alert>
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={() =>
              onRunEditedQuery(isEditing ? editContent : sparqlQuery)
            }
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : null
            }
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            {loading ? 'Running...' : 'Run'}
          </Button>
        </Box>
      </Paper>

      {/* AI Modification Dialog */}
      <Dialog
        open={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy sx={{ color: '#e86161' }} />
            <Typography variant="h6">AI Query Modification</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe how you want the AI to modify the SPARQL query. The AI will
            have access to the full context of your research question and
            previous changes.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe how you want to modify the SPARQL query..."
            variant="outlined"
            disabled={isAIModifying}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowAIDialog(false)}
            disabled={isAIModifying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAIModify}
            variant="contained"
            disabled={isAIModifying || !aiPrompt.trim()}
            startIcon={
              isAIModifying ? <CircularProgress size={16} /> : <Refresh />
            }
            sx={{
              backgroundColor: '#e86161',
              '&:hover': { backgroundColor: '#d45151' },
            }}
          >
            {isAIModifying ? 'Modifying...' : 'Modify with AI'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SparqlEditorPanel;
