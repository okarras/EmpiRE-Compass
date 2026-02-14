import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Groups3Icon from '@mui/icons-material/Groups3';
import CRUDDynamicQuestions, {
  DynamicQuestion,
} from '../firestore/CRUDDynamicQuestions';
import CommunityQuestionAccordion from '../components/CommunityQuestionAccordion';
import { useAuthData } from '../auth/useAuthData';

const CommunityQuestions = () => {
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const { user } = useAuthData();
  const isAdmin = user?.is_admin === true;
  console.log(questions);

  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'published' | 'rejected'
  >('published');

  // If user is admin, default to 'pending' if any? Or stick to 'published'?
  // Let's stick to 'published' as default for everyone, but admins see tabs.

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'popular'
  >('newest');

  const filteredQuestions = questions
    .filter((q) => {
      // 1. Filter by Status/Role
      if (!isAdmin) {
        // Regular users only see published or their own
        if (
          !(
            q.status === 'published' ||
            q.status === undefined ||
            q.createdBy === user?.id
          )
        ) {
          return false;
        }
      } else if (filterStatus !== 'all') {
        // Admin filter
        const status = q.status || 'published';
        if (status !== filterStatus) return false;
      }

      // 2. Filter by Search Term
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        const matchesName = q.name?.toLowerCase().includes(lowerTerm);
        const matchesCreator = q.creatorName?.toLowerCase().includes(lowerTerm);
        if (!matchesName && !matchesCreator) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // 3. Sort
      if (sortBy === 'newest') {
        return b.timestamp - a.timestamp;
      }
      if (sortBy === 'oldest') {
        return a.timestamp - b.timestamp;
      }
      if (sortBy === 'popular') {
        return (b.likes || 0) - (a.likes || 0);
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const data = await CRUDDynamicQuestions.getCommunityQuestions(50);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load community questions', err);
      setError('Failed to load community questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this community question? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await CRUDDynamicQuestions.deleteDynamicQuestion(id, true);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setDeleteSuccess(true);
    } catch (err) {
      console.error('Failed to delete question', err);
      setError('Failed to delete question. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, md: 6 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '1000px',
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Groups3Icon sx={{ fontSize: 48, color: '#e86161', mb: 2 }} />
        <Typography
          variant="h4"
          gutterBottom
          fontWeight="bold"
          color="text.primary"
        >
          Community Questions
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{ maxWidth: 600 }}
        >
          Explore questions created and shared by the community. These are
          dynamic questions powered by SPARQL queries and AI analysis.
        </Typography>
      </Box>

      <Box sx={{ width: '100%', maxWidth: '1000px' }}>
        {/* Controls Area */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            gap: 2,
          }}
        >
          {/* Search Bar */}
          <TextField
            placeholder="Search questions or creators..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, width: { xs: '100%', md: 'auto' } }}
          />

          {/* Sort Dropdown */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              displayEmpty
              inputProps={{ 'aria-label': 'Sort by' }}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="popular">Most Popular</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="name_asc">Name (A-Z)</MenuItem>
              <MenuItem value="name_desc">Name (Z-A)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {isAdmin && (
          <Box sx={{ width: '100%', mb: 3 }}>
            <Tabs
              value={filterStatus}
              onChange={(_, val) => setFilterStatus(val)}
              textColor="primary"
              indicatorColor="primary"
              variant="scrollable"
            >
              <Tab label="Published" value="published" />
              <Tab
                label="Pending"
                value="pending"
                icon={
                  questions.some((q) => q.status === 'pending') ? (
                    <Box
                      component="span"
                      sx={{
                        width: 8,
                        height: 8,
                        bgcolor: 'error.main',
                        borderRadius: '50%',
                      }}
                    />
                  ) : undefined
                }
                iconPosition="end"
              />
              <Tab label="Rejected" value="rejected" />
              <Tab label="All" value="all" />
            </Tabs>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#e86161' }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Snackbar
          open={deleteSuccess}
          autoHideDuration={4000}
          onClose={() => setDeleteSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setDeleteSuccess(false)}>
            Question deleted successfully
          </Alert>
        </Snackbar>

        {!loading && !error && filteredQuestions.length === 0 && (
          <Alert severity="info" sx={{ mb: 4 }}>
            {searchTerm
              ? 'No questions match your search.'
              : filterStatus === 'pending'
                ? 'No pending questions.'
                : 'No community questions available in this category yet.'}
          </Alert>
        )}

        {!loading &&
          filteredQuestions.map((q) => (
            <Box key={q.id} sx={{ mb: 3 }}>
              <CommunityQuestionAccordion
                question={q}
                onDelete={isAdmin ? () => handleDelete(q.id) : undefined}
                // Pass isAdmin to component if needed, or context usage inside
              />
            </Box>
          ))}
      </Box>
    </Box>
  );
};

export default CommunityQuestions;
