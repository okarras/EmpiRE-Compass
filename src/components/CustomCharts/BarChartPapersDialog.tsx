import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  AutoAwesome,
  AccountTree,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';

const PaperStatementsGraph = lazy(() => import('../ORKG/PaperStatementsGraph'));
import {
  orkgAskService,
  type SearchByPaperResponse,
} from '../../services/orkgAskService';
import { useAIAssistantContext } from '../../context/AIAssistantContext';
import type { PaperInfoItem } from '../../context/AIAssistantContext';
import {
  extractOrkgResourceId,
  isOrkgResourceUri,
  isValidUrl,
} from '../../utils/orkgResource';

export type PaperRowState =
  | {
      uri: string;
      status: 'loading';
    }
  | {
      uri: string;
      status: 'ok';
      paperForDisplay: PaperInfoItem;
      relatedPapersInAsk: {
        id: string;
        title: string;
        abstract?: string;
        year?: number;
      }[];
    }
  | {
      uri: string;
      status: 'error';
      message: string;
    }
  | {
      uri: string;
      status: 'not_orkg';
    };

function buildPaperForDisplay(result: SearchByPaperResponse): {
  paper: PaperInfoItem | null;
  relatedPapersInAsk: {
    id: string;
    title: string;
    abstract?: string;
    year?: number;
  }[];
} {
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
          id: items[0].id as string,
          title: items[0].title as string,
          abstract: items[0].abstract as string,
          year: items[0].year,
          relatedPapersInAsk,
        }
      : null;
  return { paper: paperForDisplay, relatedPapersInAsk };
}

interface BarChartPapersDialogProps {
  open: boolean;
  onClose: () => void;
  barTitle: string;
  itemsInGroup: Record<string, unknown>[];
}

const BarChartPapersDialog: React.FC<BarChartPapersDialogProps> = ({
  open,
  onClose,
  barTitle,
  itemsInGroup,
}) => {
  const { setPaperInfo } = useAIAssistantContext();
  const [rows, setRows] = useState<PaperRowState[]>([]);
  const [assistantLoadingUri, setAssistantLoadingUri] = useState<string | null>(
    null
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  const [spoGraphResourceId, setSpoGraphResourceId] = useState<string | null>(
    null
  );
  const [papersDialogFullPage, setPapersDialogFullPage] = useState(false);
  const [graphDialogFullPage, setGraphDialogFullPage] = useState(false);
  const [viewportH, setViewportH] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /** Title + actions + padding when graph dialog is fullscreen */
  const graphDialogReservedPx = 132;
  const graphHeightPx = graphDialogFullPage
    ? Math.max(320, viewportH - graphDialogReservedPx)
    : 480;

  const handlePaperClick = useCallback(
    async (paperId: string, paperUri: string) => {
      setAssistantLoadingUri(paperUri);
      setSnackbar((s) => ({ ...s, open: false }));
      try {
        const result = await orkgAskService.searchByPaper(paperId);
        const { paper: paperForDisplay } = buildPaperForDisplay(result);
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
        setAssistantLoadingUri(null);
      }
    },
    [setPaperInfo]
  );

  useEffect(() => {
    if (!open) {
      setRows([]);
      return;
    }

    if (!itemsInGroup.length) {
      setRows([]);
      return;
    }

    const uris = [
      ...new Set(
        itemsInGroup
          .map((row) => {
            const p = row.paper;
            return typeof p === 'string' ? p.trim() : '';
          })
          .filter(Boolean)
      ),
    ];

    if (uris.length === 0) {
      setRows([]);
      return;
    }

    let cancelled = false;

    // Rows that need ORKG stay "loading"; others resolve immediately (no wait for other papers).
    const initialRows: PaperRowState[] = uris.map((uri) => {
      if (!isValidUrl(uri)) return { uri, status: 'not_orkg' as const };
      if (!isOrkgResourceUri(uri)) return { uri, status: 'not_orkg' as const };
      const resourceId = extractOrkgResourceId(uri);
      if (!resourceId) return { uri, status: 'not_orkg' as const };
      return { uri, status: 'loading' as const };
    });
    setRows(initialRows);

    uris.forEach((uri) => {
      if (!isValidUrl(uri) || !isOrkgResourceUri(uri)) return;
      const resourceId = extractOrkgResourceId(uri);
      if (!resourceId) return;

      void (async () => {
        try {
          const result = await orkgAskService.searchByPaper(resourceId);
          if (cancelled) return;
          const { paper: paperForDisplay, relatedPapersInAsk } =
            buildPaperForDisplay(result);
          if (!paperForDisplay) {
            setRows((prev) =>
              prev.map((r) =>
                r.uri === uri
                  ? {
                      uri,
                      status: 'error' as const,
                      message: 'No metadata returned from ORKG Ask.',
                    }
                  : r
              )
            );
            return;
          }
          setRows((prev) =>
            prev.map((r) =>
              r.uri === uri
                ? {
                    uri,
                    status: 'ok' as const,
                    paperForDisplay,
                    relatedPapersInAsk,
                  }
                : r
            )
          );
        } catch (e) {
          if (cancelled) return;
          setRows((prev) =>
            prev.map((r) =>
              r.uri === uri
                ? {
                    uri,
                    status: 'error' as const,
                    message:
                      e instanceof Error
                        ? e.message
                        : 'Failed to load from ORKG.',
                  }
                : r
            )
          );
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [open, itemsInGroup]);

  const anyLoading = rows.some((r) => r.status === 'loading');

  return (
    <>
      <Dialog
        open={open}
        onClose={() => {
          setPapersDialogFullPage(false);
          onClose();
        }}
        maxWidth="md"
        fullWidth
        fullScreen={papersDialogFullPage}
        scroll="paper"
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
            Papers for {barTitle || 'this category'}
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {itemsInGroup.length} row(s) in selection ·{' '}
              {
                [
                  ...new Set(
                    itemsInGroup
                      .map((r) =>
                        typeof r.paper === 'string' ? r.paper.trim() : ''
                      )
                      .filter(Boolean)
                  ),
                ].length
              }{' '}
              unique paper URI(s)
            </Typography>
          </Box>
          <Tooltip
            title={papersDialogFullPage ? 'Exit full screen' : 'Full screen'}
          >
            <IconButton
              edge="end"
              onClick={() => setPapersDialogFullPage((v) => !v)}
              aria-label={
                papersDialogFullPage ? 'Exit full screen' : 'Full screen'
              }
              size="small"
            >
              {papersDialogFullPage ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent dividers>
          {anyLoading && (
            <LinearProgress sx={{ mb: 2 }} aria-label="Loading papers" />
          )}
          {rows.length === 0 && !anyLoading && (
            <Typography color="text.secondary">
              No paper URIs found in <code>itemsInGroup</code> (expected a{' '}
              <code>paper</code> field per row).
            </Typography>
          )}
          {rows.map((row, idx) => (
            <Box key={`${row.uri}-${idx}`} sx={{ mb: 2 }}>
              {row.status === 'loading' && (
                <Typography variant="body2" color="text.secondary">
                  Loading… {row.uri}
                </Typography>
              )}
              {row.status === 'not_orkg' && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Non-ORKG or invalid URL
                  </Typography>
                  {isValidUrl(row.uri) ? (
                    <a href={row.uri} target="_blank" rel="noopener noreferrer">
                      {row.uri}
                    </a>
                  ) : (
                    <Typography variant="body2">{row.uri}</Typography>
                  )}
                </Box>
              )}
              {row.status === 'error' && (
                <Alert severity="warning" sx={{ py: 0.5 }}>
                  <Typography variant="body2" component="span">
                    {row.uri}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {row.message}
                  </Typography>
                </Alert>
              )}
              {row.status === 'ok' && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {row.paperForDisplay.title ?? 'Untitled'}
                  </Typography>
                  {row.paperForDisplay.year != null && (
                    <Typography variant="caption" color="text.secondary">
                      {String(row.paperForDisplay.year)}
                    </Typography>
                  )}
                  {row.paperForDisplay.abstract && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, color: 'text.secondary' }}
                    >
                      {String(row.paperForDisplay.abstract).slice(0, 400)}
                      {String(row.paperForDisplay.abstract).length > 400
                        ? '…'
                        : ''}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 1,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a
                      href={row.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.uri}
                    </a>
                    <Tooltip title="View paper in AI Assistant">
                      <IconButton
                        size="small"
                        disabled={assistantLoadingUri === row.uri}
                        onClick={() => {
                          const id = extractOrkgResourceId(row.uri);
                          if (id) void handlePaperClick(id, row.uri);
                        }}
                        sx={{ color: '#e86161', flexShrink: 0 }}
                        aria-label="View paper in AI Assistant"
                      >
                        <AutoAwesome fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Subject–predicate–object graph (ORKG)">
                      <IconButton
                        size="small"
                        onClick={() => {
                          const id = extractOrkgResourceId(row.uri);
                          if (id) setSpoGraphResourceId(id);
                        }}
                        sx={{ color: '#5c6bc0', flexShrink: 0 }}
                        aria-label="Open ORKG statement graph"
                      >
                        <AccountTree fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {row.relatedPapersInAsk.length > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {row.relatedPapersInAsk.length} related in ORKG Ask
                    </Typography>
                  )}
                </Box>
              )}
              {idx < rows.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Dialog
        open={Boolean(spoGraphResourceId)}
        onClose={() => {
          setSpoGraphResourceId(null);
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
            {spoGraphResourceId && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Resource {spoGraphResourceId} ·{' '}
                <a
                  href={`https://orkg.org/papers/${spoGraphResourceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open paper page
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
          {spoGraphResourceId && (
            <Suspense
              fallback={
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress sx={{ color: '#e86161' }} />
                </Box>
              }
            >
              <PaperStatementsGraph
                resourceId={spoGraphResourceId}
                height={graphHeightPx}
              />
            </Suspense>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSpoGraphResourceId(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BarChartPapersDialog;
