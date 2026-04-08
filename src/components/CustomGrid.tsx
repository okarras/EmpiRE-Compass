import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Box,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  AutoAwesome,
  AccountTree,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import GridStats from './GridStats';
import { orkgAskService } from '../services/orkgAskService';
import { useAIAssistantContext } from '../context/AIAssistantContext';
import type { PaperInfoItem } from '../context/AIAssistantContext';
import {
  extractOrkgResourceId,
  isOrkgResourceUri,
  isValidUrl,
} from '../utils/orkgResource';

const PaperStatementsGraph = lazy(() => import('./ORKG/PaperStatementsGraph'));

interface Props {
  questionData: Record<string, unknown>[];
  gridOptions?: {
    defaultColumns?: string[];
    defaultGroupBy?: string;
    defaultUseUniquePapers?: boolean;
  };
}

const MuiDataGrid: React.FC<Props> = ({ questionData, gridOptions }) => {
  const { setPaperInfo } = useAIAssistantContext();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  const [graphResourceId, setGraphResourceId] = useState<string | null>(null);
  const [graphDialogFullPage, setGraphDialogFullPage] = useState(false);
  const [viewportH, setViewportH] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const graphDialogReservedPx = 132;
  const graphHeightPx = graphDialogFullPage
    ? Math.max(320, viewportH - graphDialogReservedPx)
    : 480;

  const handlePaperClick = useCallback(
    async (paperId: string, paperUri: string) => {
      setLoading(true);
      setSnackbar((s) => ({ ...s, open: false }));
      try {
        const result = await orkgAskService.searchByPaper(paperId);
        const orkgPaper = result?.orkgPaper;
        const items = result?.payload?.items ?? [];
        const relatedPapersInAsk = items
          .filter((it) => it?.id)
          .map((it) => ({
            id: String(it.id),
            title: it.title as string,
            abstract: it.abstract as string,
            year: it.year,
          }));
        const firstItem = items[0];
        const paperForDisplay: PaperInfoItem | null = orkgPaper
          ? {
              ...orkgPaper,
              id: orkgPaper.id,
              abstract: orkgPaper.abstract ?? firstItem?.abstract,
              relatedPapersInAsk,
            }
          : items.length > 0
            ? {
                id: items[0].id,
                title: items[0].title as string,
                abstract: items[0].abstract as string,
                year: items[0].year,
                relatedPapersInAsk,
              }
            : null;
        if (paperForDisplay) {
          setPaperInfo(paperForDisplay, paperUri);
        } else {
          setSnackbar({
            open: true,
            message: 'No related papers found in ORKG Ask.',
            severity: 'info',
          });
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message:
            err instanceof Error ? err.message : 'Failed to load paper info.',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [setPaperInfo]
  );

  // Generate columns based on keys from the first data object
  const columns: GridColDef[] = React.useMemo(() => {
    if (
      !questionData ||
      !Array.isArray(questionData) ||
      questionData.length === 0
    ) {
      return [];
    }

    return Object.keys(questionData[0]).map((key) => ({
      field: key,
      headerName: key,
      flex: 1,
      minWidth: key.toLowerCase() === 'paper' ? 420 : undefined,
      sortable: true,
      filterable: true,
      renderCell: (params) => {
        const value = params.value;

        // Handle null/undefined
        if (value == null) {
          return '';
        }

        // If the cell content is an ORKG resource URL in the paper column, render link + AI assistant button
        if (
          key.toLowerCase() === 'paper' &&
          typeof value === 'string' &&
          isValidUrl(value) &&
          isOrkgResourceUri(value)
        ) {
          const paperId = extractOrkgResourceId(value);
          if (paperId) {
            return (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  width: '100%',
                  minWidth: 0,
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {value}
                </a>
                <Tooltip title="View paper in AI Assistant">
                  <IconButton
                    size="small"
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePaperClick(paperId, value);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    sx={{ color: '#e86161', flexShrink: 0 }}
                    aria-label="View paper in AI Assistant"
                  >
                    <AutoAwesome fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Subject–predicate–object graph (ORKG)">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setGraphResourceId(paperId);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    sx={{ color: '#5c6bc0', flexShrink: 0 }}
                    aria-label="Open ORKG statement graph"
                  >
                    <AccountTree fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          }
        }

        // If the cell content is a URL (non-ORKG), render it as a link
        if (typeof value === 'string' && isValidUrl(value)) {
          return (
            <a href={value} target="_blank" rel="noopener noreferrer">
              {value}
            </a>
          );
        }

        // Handle objects and arrays - convert to JSON string
        if (typeof value === 'object') {
          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        }

        // For other types, convert to string
        return String(value);
      },
    }));
  }, [questionData, handlePaperClick, loading]);

  // Ensure each row has a unique 'id' field
  const rows = React.useMemo(() => {
    if (!questionData || !Array.isArray(questionData)) {
      return [];
    }
    return questionData.map((row, index) => ({
      id: row.id ?? index,
      ...row,
    }));
  }, [questionData]);

  return (
    <Box sx={{ width: '100%', marginTop: 2 }}>
      {/* Statistics Section */}
      <GridStats questionData={questionData} gridOptions={gridOptions} />

      {/* Data Grid */}
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          key={`datagrid-${rows.length}-${columns.map((c) => c.field).join('-')}`}
          rows={rows}
          columns={columns}
          pageSizeOptions={[15, 30, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 15, page: 0 } },
          }}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-row:nth-of-type(odd)': {
              backgroundColor: '#f9f9f9', // light grey for odd rows
            },
            '& .MuiDataGrid-row:nth-of-type(even)': {
              backgroundColor: '#ffffff', // white for even rows
            },
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal',
              wordWrap: 'break-word',
            },
          }}
          showToolbar
        />
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Dialog
        open={Boolean(graphResourceId)}
        onClose={() => {
          setGraphResourceId(null);
          setGraphDialogFullPage(false);
        }}
        maxWidth="lg"
        fullWidth
        fullScreen={graphDialogFullPage}
        PaperProps={{
          sx: graphDialogFullPage
            ? { display: 'flex', flexDirection: 'column', overflow: 'hidden' }
            : undefined,
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
            pr: 1,
          }}
        >
          <Box>
            ORKG statement graph
            {graphResourceId && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Resource {graphResourceId} ·{' '}
                <a
                  href={`https://orkg.org/papers/${graphResourceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open on ORKG
                </a>
              </Typography>
            )}
          </Box>
          <Tooltip
            title={graphDialogFullPage ? 'Exit full screen' : 'Full screen'}
          >
            <IconButton
              edge="end"
              onClick={() => setGraphDialogFullPage((v) => !v)}
              aria-label={
                graphDialogFullPage ? 'Exit full screen' : 'Full screen'
              }
              size="small"
            >
              {graphDialogFullPage ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            flex: graphDialogFullPage ? 1 : undefined,
            display: 'flex',
            flexDirection: 'column',
            minHeight: graphDialogFullPage ? 0 : undefined,
          }}
        >
          {graphResourceId && (
            <Suspense
              fallback={
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress sx={{ color: '#e86161' }} />
                </Box>
              }
            >
              <PaperStatementsGraph
                resourceId={graphResourceId}
                height={graphHeightPx}
              />
            </Suspense>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGraphResourceId(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MuiDataGrid;
