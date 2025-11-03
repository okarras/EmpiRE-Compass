import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Alert,
} from '@mui/material';
import {
  Visibility,
  Refresh,
  FilterList,
  CheckCircle,
  Error as ErrorIcon,
  Delete,
  Create,
  Search,
  Description,
  //   BugReport,
} from '@mui/icons-material';
import { getRequestLogs, RequestLog } from '../services/backendApi';
import { useAuth } from '../auth/useAuth';
import { useKeycloak } from '@react-keycloak/web';

const AdminRequestMonitor = () => {
  const { user } = useAuth();
  const { keycloak } = useKeycloak();
  const [requests, setRequests] = useState<RequestLog[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestLog[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestLog | null>(
    null
  );
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [filterOperation, setFilterOperation] = useState<string>('all');
  const [filterCollection, setFilterCollection] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!user || !keycloak?.token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const options: {
        limit?: number;
        operation?: string;
        collection?: string;
        success?: boolean;
      } = {
        limit: 200,
      };

      if (filterOperation !== 'all') {
        options.operation = filterOperation;
      }
      if (filterCollection !== 'all') {
        options.collection = filterCollection;
      }

      const response = await getRequestLogs(
        options,
        user.id,
        user.email,
        keycloak.token
      );

      setRequests(response.logs);
    } catch (err) {
      console.error('Error fetching request logs:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch request logs'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoRefresh || !user || !keycloak?.token) return;

    // Initial fetch
    fetchLogs();

    // Set up polling if auto-refresh is enabled
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoRefresh,
    user?.id,
    keycloak?.token,
    filterOperation,
    filterCollection,
  ]);

  //   const handleTestLog = async () => {
  //     setTestStatus('Creating test log...');
  //     try {
  //       await RequestLogger.logRequest(
  //         'write',
  //         'TestCollection',
  //         'test-doc-123',
  //         true,
  //         user?.id || 'test-user',
  //         user?.email || 'test@example.com',
  //         undefined,
  //         { method: 'test', note: 'This is a test log entry' },
  //         { testData: 'Hello from request monitor!' },
  //         { success: true }
  //       );
  //       setTestStatus('✅ Test log created successfully! Check the table below.');
  //       setTimeout(() => setTestStatus(''), 3000);
  //     } catch (error) {
  //       setTestStatus(
  //         '❌ Failed to create test log: ' +
  //           (error instanceof Error ? error.message : 'Unknown error')
  //       );
  //       console.error('Test log error:', error);
  //     }
  //   };

  useEffect(() => {
    let filtered = [...requests];

    // Filter by operation
    if (filterOperation !== 'all') {
      filtered = filtered.filter((req) => req.operation === filterOperation);
    }

    // Filter by collection
    if (filterCollection !== 'all') {
      filtered = filtered.filter((req) => req.collection === filterCollection);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.collection.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.documentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, filterOperation, filterCollection, searchTerm]);

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'read':
        return <Visibility />;
      case 'write':
        return <Create />;
      case 'update':
        return <Create />;
      case 'delete':
        return <Delete />;
      case 'query':
        return <Search />;
      default:
        return <Description />;
    }
  };

  const getOperationColor = (
    operation: string
  ): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (operation) {
      case 'read':
        return 'info';
      case 'write':
        return 'success';
      case 'update':
        return 'warning';
      case 'delete':
        return 'error';
      case 'query':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const uniqueCollections = [
    'all',
    ...new Set(requests.map((r) => r.collection)),
  ];

  const stats = {
    total: requests.length,
    successful: requests.filter((r) => r.success).length,
    failed: requests.filter((r) => !r.success).length,
    reads: requests.filter((r) => r.operation === 'read').length,
    writes: requests.filter((r) => r.operation === 'write').length,
    updates: requests.filter((r) => r.operation === 'update').length,
    deletes: requests.filter((r) => r.operation === 'delete').length,
    queries: requests.filter((r) => r.operation === 'query').length,
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#e86161' }}>
            Firebase Request Monitor
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* <Button
              variant="outlined"
              size="small"
              startIcon={<BugReport />}
              onClick={handleTestLog}
              sx={{ textTransform: 'none' }}
            >
              Test Logging
            </Button> */}
            {/* <Tooltip
              title={
                autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'
              }
            >
              <Chip
                label={autoRefresh ? 'Live' : 'Paused'}
                color={autoRefresh ? 'success' : 'default'}
                size="small"
                onClick={() => setAutoRefresh(!autoRefresh)}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            </Tooltip> */}
            <Tooltip
              title={autoRefresh ? 'Pause Auto-refresh' : 'Enable Auto-refresh'}
            >
              <Chip
                label={autoRefresh ? 'Live' : 'Paused'}
                color={autoRefresh ? 'success' : 'default'}
                size="small"
                onClick={() => setAutoRefresh(!autoRefresh)}
                sx={{ cursor: 'pointer', fontWeight: 600, mr: 1 }}
              />
            </Tooltip>
            <Tooltip title="Refresh Now">
              <IconButton
                size="small"
                onClick={fetchLogs}
                disabled={loading}
                sx={{ color: '#e86161' }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Monitor and debug all backend API requests in real-time
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Setup Instructions */}
      {requests.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            📊 Request Logs
          </Typography>
          <Typography variant="body2">
            Request logs are fetched from the backend. Make some API requests to
            see them appear here.
          </Typography>
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #2196f3' }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3' }}>
            {stats.total}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Requests
          </Typography>
        </Paper>
        <Paper
          sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #4caf50' }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
            {stats.successful}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Successful
          </Typography>
        </Paper>
        <Paper
          sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #f44336' }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
            {stats.failed}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Failed
          </Typography>
        </Paper>
        <Paper
          sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #9c27b0' }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#9c27b0' }}>
            {stats.reads}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Reads
          </Typography>
        </Paper>
        <Paper
          sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #ff9800' }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
            {stats.writes}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Writes
          </Typography>
        </Paper>
        <Paper
          sx={{ p: 2, textAlign: 'center', borderLeft: '4px solid #00bcd4' }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#00bcd4' }}>
            {stats.queries}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Queries
          </Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList sx={{ color: '#1976d2' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filters
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 2,
          }}
        >
          <TextField
            label="Search"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Collection, document, user..."
          />
          <FormControl size="small">
            <InputLabel>Operation</InputLabel>
            <Select
              value={filterOperation}
              onChange={(e) => setFilterOperation(e.target.value)}
              label="Operation"
            >
              <MenuItem value="all">All Operations</MenuItem>
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="write">Write</MenuItem>
              <MenuItem value="update">Update</MenuItem>
              <MenuItem value="delete">Delete</MenuItem>
              <MenuItem value="query">Query</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Collection</InputLabel>
            <Select
              value={filterCollection}
              onChange={(e) => setFilterCollection(e.target.value)}
              label="Collection"
            >
              {uniqueCollections.map((col) => (
                <MenuItem key={col} value={col}>
                  {col === 'all' ? 'All Collections' : col}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Requests Table */}
      <Paper elevation={2}>
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Request Log
          </Typography>
          <Badge badgeContent={filteredRequests.length} color="primary">
            <Chip label="Requests" size="small" />
          </Badge>
        </Box>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5' }}>
                  Operation
                </TableCell>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5' }}>
                  Collection
                </TableCell>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5' }}>
                  Document ID
                </TableCell>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5' }}>
                  User
                </TableCell>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5' }}>
                  Timestamp
                </TableCell>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f5f5f5' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No requests found. Try adjusting your filters or wait for
                      new requests.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    sx={{
                      '&:hover': { backgroundColor: '#f5f5f5' },
                      backgroundColor: request.success
                        ? 'inherit'
                        : 'rgba(244, 67, 54, 0.05)',
                    }}
                  >
                    <TableCell>
                      {request.success ? (
                        <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                      ) : (
                        <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getOperationIcon(request.operation)}
                        label={request.operation}
                        size="small"
                        color={getOperationColor(request.operation)}
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                      >
                        {request.collection}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                      >
                        {request.documentId || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {request.userEmail || request.userId || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {formatTimestamp(request.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRequest(request);
                            setOpenDetailsDialog(true);
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Request Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Request Details
            </Typography>
            {selectedRequest && (
              <>
                <Chip
                  icon={getOperationIcon(selectedRequest.operation)}
                  label={selectedRequest.operation}
                  size="small"
                  color={getOperationColor(selectedRequest.operation)}
                />
                {selectedRequest.success ? (
                  <Chip
                    icon={<CheckCircle />}
                    label="Success"
                    size="small"
                    color="success"
                  />
                ) : (
                  <Chip
                    icon={<ErrorIcon />}
                    label="Failed"
                    size="small"
                    color="error"
                  />
                )}
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Basic Info */}
              <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Basic Information
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr',
                    gap: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Collection:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {selectedRequest.collection}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Document ID:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {selectedRequest.documentId || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    User:
                  </Typography>
                  <Typography variant="body2">
                    {selectedRequest.userEmail ||
                      selectedRequest.userId ||
                      'System'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Timestamp:
                  </Typography>
                  <Typography variant="body2">
                    {formatTimestamp(selectedRequest.timestamp)}
                  </Typography>
                </Box>
              </Paper>

              {/* Metadata */}
              {selectedRequest.metadata && (
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#e3f2fd' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Metadata
                  </Typography>
                  <pre
                    style={{
                      fontSize: '0.75rem',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {JSON.stringify(selectedRequest.metadata, null, 2)}
                  </pre>
                </Paper>
              )}

              {/* Request Body */}
              {selectedRequest.requestBody && (
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#fff3e0' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Request Body
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <pre
                      style={{
                        fontSize: '0.75rem',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {JSON.stringify(selectedRequest.requestBody, null, 2)}
                    </pre>
                  </Box>
                </Paper>
              )}

              {/* Response Data */}
              {selectedRequest.responseData && (
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Response Data
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <pre
                      style={{
                        fontSize: '0.75rem',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {JSON.stringify(selectedRequest.responseData, null, 2)}
                    </pre>
                  </Box>
                </Paper>
              )}

              {/* Error */}
              {selectedRequest.error && (
                <Alert severity="error">
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Error Message:
                  </Typography>
                  <Typography variant="body2">
                    {selectedRequest.error}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminRequestMonitor;
