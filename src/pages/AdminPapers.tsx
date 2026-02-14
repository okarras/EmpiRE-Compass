import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
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
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  LinearProgress,
  CircularProgress,
  DialogContentText,
  Link,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MenuBook,
  Refresh,
  Visibility,
  VisibilityOff,
  OpenInNew,
} from '@mui/icons-material';
import CRUDPapers, { Paper as PaperType } from '../firestore/CRUDPapers';
import { useAuth } from '../auth/useAuth';
import { useKeycloak } from '@react-keycloak/web';

const AdminPapers = () => {
  const { user } = useAuth();
  const { keycloak } = useKeycloak();
  const [papers, setPapers] = useState<PaperType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<PaperType | null>(null);
  const [deletingPaper, setDeletingPaper] = useState<PaperType | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    year: '',
    venue: '',
    link: '',
    description: '',
    priority: '0',
    showOnTeam: true,
  });

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await CRUDPapers.getPapers(false); // Get all papers
      const sorted = [...items].sort((a, b) => {
        const priorityA = a.priority ?? 999;
        const priorityB = b.priority ?? 999;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return (b.year ?? 0) - (a.year ?? 0);
      });
      setPapers(sorted);
    } catch (err) {
      console.error('Error fetching papers:', err);
      setError('Failed to load papers. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (paper?: PaperType) => {
    if (paper) {
      setEditingPaper(paper);
      setFormData({
        title: paper.title || '',
        authors: paper.authors || '',
        year: paper.year?.toString() || '',
        venue: paper.venue || '',
        link: paper.link || '',
        description: paper.description || '',
        priority: paper.priority?.toString() ?? '0',
        showOnTeam: paper.showOnTeam ?? true,
      });
    } else {
      setEditingPaper(null);
      setFormData({
        title: '',
        authors: '',
        year: '',
        venue: '',
        link: '',
        description: '',
        priority: '0',
        showOnTeam: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPaper(null);
    setFormData({
      title: '',
      authors: '',
      year: '',
      venue: '',
      link: '',
      description: '',
      priority: '0',
      showOnTeam: true,
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!user?.id || !user?.email) {
      setError('User authentication required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const yearNum = formData.year ? parseInt(formData.year, 10) : undefined;
      const priorityNum = formData.priority
        ? parseInt(formData.priority, 10)
        : 0;

      if (editingPaper) {
        await CRUDPapers.updatePaper(
          editingPaper.id,
          {
            title: formData.title.trim(),
            authors: formData.authors.trim() || undefined,
            year: isNaN(yearNum as number) ? undefined : yearNum,
            venue: formData.venue.trim() || undefined,
            link: formData.link.trim() || undefined,
            description: formData.description.trim() || undefined,
            priority: priorityNum,
            showOnTeam: formData.showOnTeam,
          },
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('Paper updated successfully');
      } else {
        await CRUDPapers.createPaper(
          {
            title: formData.title.trim(),
            authors: formData.authors.trim() || undefined,
            year: isNaN(yearNum as number) ? undefined : yearNum,
            venue: formData.venue.trim() || undefined,
            link: formData.link.trim() || undefined,
            description: formData.description.trim() || undefined,
            priority: priorityNum,
            showOnTeam: formData.showOnTeam,
          },
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('Paper added successfully');
      }

      handleCloseDialog();
      await fetchPapers();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error saving paper:', err);
      setError(err instanceof Error ? err.message : 'Failed to save paper');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (paper: PaperType) => {
    setDeletingPaper(paper);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPaper) return;

    if (!user?.id || !user?.email) {
      setError('User authentication required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await CRUDPapers.deletePaper(
        deletingPaper.id,
        user.id,
        user.email,
        keycloak?.token
      );
      setSuccess('Paper deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingPaper(null);
      await fetchPapers();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error deleting paper:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete paper');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleShowOnTeam = async (paper: PaperType) => {
    if (!user?.id || !user?.email) return;

    try {
      await CRUDPapers.updatePaper(
        paper.id,
        { showOnTeam: !paper.showOnTeam },
        user.id,
        user.email,
        keycloak?.token
      );
      setSuccess(
        `Paper ${paper.showOnTeam ? 'removed from' : 'added to'} Team page`
      );
      await fetchPapers();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error toggling show on team:', err);
      setError('Failed to update paper visibility');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Loading papers...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MenuBook sx={{ fontSize: 40, color: '#e86161' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Papers Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add and manage published papers shown on the Team page
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh papers list">
            <IconButton onClick={fetchPapers} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: '#e86161',
              '&:hover': {
                backgroundColor: '#d45151',
              },
            }}
          >
            Add Paper
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Authors</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Show on Team</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {papers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 4 }}
                    >
                      No papers found. Click "Add Paper" to add your first
                      published paper.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                papers.map((paper) => (
                  <TableRow key={paper.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {paper.title}
                      </Typography>
                      {paper.link && (
                        <Link
                          href={paper.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.5,
                            fontSize: '0.75rem',
                          }}
                        >
                          <OpenInNew sx={{ fontSize: 14 }} />
                          View paper
                        </Link>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {paper.authors || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {paper.year ?? '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {paper.venue || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {paper.showOnTeam ? (
                        <Chip
                          icon={<Visibility />}
                          label="Yes"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<VisibilityOff />}
                          label="No"
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={paper.priority ?? 0}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Tooltip
                          title={
                            paper.showOnTeam
                              ? 'Hide from Team page'
                              : 'Show on Team page'
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleToggleShowOnTeam(paper)}
                            color={paper.showOnTeam ? 'success' : 'default'}
                          >
                            {paper.showOnTeam ? (
                              <Visibility />
                            ) : (
                              <VisibilityOff />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(paper)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(paper)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingPaper ? 'Edit Paper' : 'Add Paper'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g. EmpiRE Compass: Navigating Empirical Research"
            />
            <TextField
              label="Authors"
              fullWidth
              value={formData.authors}
              onChange={(e) =>
                setFormData({ ...formData, authors: e.target.value })
              }
              placeholder="e.g. John Doe, Jane Smith"
            />
            <TextField
              label="Year"
              fullWidth
              type="number"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: e.target.value })
              }
              placeholder="e.g. 2024"
              inputProps={{ min: 1900, max: 2100 }}
            />
            <TextField
              label="Venue / Journal"
              fullWidth
              value={formData.venue}
              onChange={(e) =>
                setFormData({ ...formData, venue: e.target.value })
              }
              placeholder="e.g. ICSE 2024, TSE"
            />
            <TextField
              label="Link (URL)"
              fullWidth
              value={formData.link}
              onChange={(e) =>
                setFormData({ ...formData, link: e.target.value })
              }
              placeholder="https://doi.org/..."
            />
            <TextField
              label="Description (optional)"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description or abstract"
            />
            <TextField
              label="Priority (lower = shown first)"
              fullWidth
              type="number"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              helperText="Lower numbers appear first on the Team page"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.showOnTeam}
                  onChange={(e) =>
                    setFormData({ ...formData, showOnTeam: e.target.checked })
                  }
                />
              }
              label="Show on Team page"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.title.trim()}
            sx={{
              backgroundColor: '#e86161',
              '&:hover': {
                backgroundColor: '#d45151',
              },
            }}
          >
            {saving ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : editingPaper ? (
              'Update'
            ) : (
              'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !saving && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Paper</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deletingPaper?.title}"? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <Delete />}
          >
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPapers;
