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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  DialogContentText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Article,
  Refresh,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import CRUDNews, { NewsItem } from '../firestore/CRUDNews';
import { useAuth } from '../auth/useAuth';
import { useKeycloak } from '@react-keycloak/web';
import CodeEditor from '../components/CodeEditor/CodeEditor';

const AdminNews = () => {
  const { user } = useAuth();
  const { keycloak } = useKeycloak();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [deletingNews, setDeletingNews] = useState<NewsItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: false,
    tags: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    imageUrl: '',
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await CRUDNews.getAllNews(false); // Get all, including unpublished
      setNewsItems(items);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news items. Please check Firebase permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (news?: NewsItem) => {
    if (news) {
      setEditingNews(news);
      setFormData({
        title: news.title || '',
        content: news.content || '',
        published: news.published || false,
        tags: news.tags?.join(', ') || '',
        priority: news.priority || 'normal',
        imageUrl: news.imageUrl || '',
      });
    } else {
      setEditingNews(null);
      setFormData({
        title: '',
        content: '',
        published: false,
        tags: '',
        priority: 'normal',
        imageUrl: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingNews(null);
    setFormData({
      title: '',
      content: '',
      published: false,
      tags: '',
      priority: 'normal',
      imageUrl: '',
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (!user?.id || !user?.email) {
      setError('User authentication required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (editingNews) {
        // Update existing news
        await CRUDNews.updateNewsItem(
          editingNews.id,
          {
            title: formData.title.trim(),
            content: formData.content.trim(),
            published: formData.published,
            tags: tagsArray.length > 0 ? tagsArray : undefined,
            priority: formData.priority,
            imageUrl: formData.imageUrl.trim() || undefined,
          },
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('News item updated successfully');
      } else {
        // Create new news
        await CRUDNews.createNewsItem(
          {
            title: formData.title.trim(),
            content: formData.content.trim(),
            published: formData.published,
            tags: tagsArray.length > 0 ? tagsArray : undefined,
            priority: formData.priority,
            imageUrl: formData.imageUrl.trim() || undefined,
            createdAt: new Date(),
          },
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('News item created successfully');
      }

      handleCloseDialog();
      await fetchNews();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error saving news:', err);
      setError(err instanceof Error ? err.message : 'Failed to save news item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (news: NewsItem) => {
    setDeletingNews(news);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingNews) return;

    if (!user?.id || !user?.email) {
      setError('User authentication required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await CRUDNews.deleteNewsItem(
        deletingNews.id,
        user.id,
        user.email,
        keycloak?.token
      );
      setSuccess('News item deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingNews(null);
      await fetchNews();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error deleting news:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to delete news item'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (news: NewsItem) => {
    if (!user?.id || !user?.email) {
      setError('User authentication required');
      return;
    }

    try {
      await CRUDNews.updateNewsItem(
        news.id,
        {
          published: !news.published,
        },
        user.id,
        user.email,
        keycloak?.token
      );
      setSuccess(
        `News item ${!news.published ? 'published' : 'unpublished'} successfully`
      );
      await fetchNews();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error toggling publish status:', err);
      setError('Failed to update publish status');
    }
  };

  const formatDate = (timestamp: Date | string | number | undefined) => {
    if (!timestamp) return 'N/A';
    try {
      let date: Date;
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return 'Invalid Date';
      }
      return date.toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Loading news items...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Article sx={{ fontSize: 40, color: '#e86161' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              News Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create, edit, and manage news announcements
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh news list">
            <IconButton onClick={fetchNews} color="primary">
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
            Add News
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

      {/* News Table */}
      <Paper sx={{ width: '100%' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {newsItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 4 }}
                    >
                      No news items found. Click "Add News" to create your first
                      announcement.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                newsItems.map((news) => (
                  <TableRow key={news.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {news.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {news.content.substring(0, 100)}
                        {news.content.length > 100 ? '...' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {news.published ? (
                        <Chip
                          icon={<Visibility />}
                          label="Published"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<VisibilityOff />}
                          label="Draft"
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={news.priority || 'normal'}
                        size="small"
                        color={
                          news.priority === 'high'
                            ? 'error'
                            : news.priority === 'low'
                              ? 'default'
                              : 'primary'
                        }
                        variant={
                          news.priority === 'low' ? 'outlined' : 'filled'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {news.tags && news.tags.length > 0 ? (
                        <Box
                          sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}
                        >
                          {news.tags.slice(0, 3).map((tag, idx) => (
                            <Chip
                              key={idx}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                          {news.tags.length > 3 && (
                            <Chip
                              label={`+${news.tags.length - 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No tags
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(news.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(news.updatedAt)}
                      </Typography>
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
                          title={news.published ? 'Unpublish' : 'Publish'}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleTogglePublish(news)}
                            color={news.published ? 'success' : 'default'}
                          >
                            {news.published ? (
                              <Visibility />
                            ) : (
                              <VisibilityOff />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(news)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(news)}
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

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingNews ? 'Edit News Item' : 'Create News Item'}
        </DialogTitle>
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
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Content <span style={{ color: 'red' }}>*</span>
              </Typography>
              <CodeEditor
                value={formData.content}
                onChange={(value) =>
                  setFormData({ ...formData, content: value })
                }
                language="html"
                height="300px"
                readOnly={false}
                showLineNumbers={true}
                placeholder="Enter HTML content here..."
                label="News Content"
                copyable={false}
                formattable={true}
                fullscreenable={true}
              />
            </Box>
            <TextField
              label="Image URL (optional)"
              fullWidth
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              placeholder="https://example.com/image.jpg"
            />
            <TextField
              label="Tags (comma-separated)"
              fullWidth
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="announcement, update, feature"
              helperText="Separate multiple tags with commas"
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as 'low' | 'normal' | 'high',
                  })
                }
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.published}
                  onChange={(e) =>
                    setFormData({ ...formData, published: e.target.checked })
                  }
                />
              }
              label="Published"
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
            disabled={
              saving || !formData.title.trim() || !formData.content.trim()
            }
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
            ) : editingNews ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !saving && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete News Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deletingNews?.title}"? This action
            cannot be undone.
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

export default AdminNews;
