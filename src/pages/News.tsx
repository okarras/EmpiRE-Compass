import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Divider,
} from '@mui/material';
import {
  Article,
  Search,
  CalendarToday,
  Person,
  FilterList,
} from '@mui/icons-material';
import CRUDNews, { NewsItem } from '../firestore/CRUDNews';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../utils/theme';

const News = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    filterNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsItems, searchQuery, selectedTag, selectedPriority]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await CRUDNews.getAllNews(true); // Only published news
      setNewsItems(items);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterNews = () => {
    let filtered = [...newsItems];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Tag filter
    if (selectedTag !== 'all') {
      filtered = filtered.filter((item) => item.tags?.includes(selectedTag));
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter((item) => item.priority === selectedPriority);
    }

    setFilteredNews(filtered);
    setPage(1); // Reset to first page when filters change
  };

  const getAllTags = () => {
    const tags = new Set<string>();
    newsItems.forEach((item) => {
      item.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
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
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'low':
        return 'default';
      default:
        return 'primary';
    }
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Pagination
  const paginatedNews = filteredNews.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
            }}
          >
            <CircularProgress sx={{ color: '#e86161' }} />
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              color: '#e86161',
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Article sx={{ fontSize: { xs: 32, sm: 40, md: 48 } }} />
            News & Updates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Stay updated with the latest announcements, features, and news from
            EmpiRE Compass.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', md: 'center' },
            }}
          >
            <TextField
              fullWidth
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: { md: 2 } }}
            />
            <FormControl sx={{ minWidth: { xs: '100%', md: 150 } }}>
              <InputLabel>Tag</InputLabel>
              <Select
                value={selectedTag}
                label="Tag"
                onChange={(e) => setSelectedTag(e.target.value)}
                startAdornment={
                  selectedTag !== 'all' ? (
                    <InputAdornment position="start">
                      <FilterList fontSize="small" />
                    </InputAdornment>
                  ) : null
                }
              >
                <MenuItem value="all">All Tags</MenuItem>
                {getAllTags().map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: { xs: '100%', md: 150 } }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={selectedPriority}
                label="Priority"
                onChange={(e) => setSelectedPriority(e.target.value)}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Article
              sx={{
                fontSize: 64,
                color: 'text.secondary',
                mb: 2,
                opacity: 0.5,
              }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchQuery ||
              selectedTag !== 'all' ||
              selectedPriority !== 'all'
                ? 'No news found matching your filters'
                : 'No news available'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ||
              selectedTag !== 'all' ||
              selectedPriority !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Check back later for updates'}
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {paginatedNews.map((news) => (
                <Grid item xs={12} sm={6} md={4} key={news.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardActionArea
                      component={Link}
                      to={`/${templateId}/news/${news.id}`}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                      }}
                    >
                      {news.imageUrl && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={news.imageUrl}
                          alt={news.title}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      <CardContent
                        sx={{
                          flexGrow: 1,
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Box
                          sx={{
                            mb: 1,
                            display: 'flex',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Chip
                            label={news.priority || 'normal'}
                            size="small"
                            color={getPriorityColor(news.priority)}
                            variant={
                              news.priority === 'low' ? 'outlined' : 'filled'
                            }
                          />
                          {news.tags
                            ?.slice(0, 2)
                            .map((tag, idx) => (
                              <Chip
                                key={idx}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                        </Box>
                        <Typography
                          variant="h6"
                          component="h2"
                          sx={{
                            fontWeight: 600,
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '3.5rem',
                          }}
                        >
                          {news.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            flexGrow: 1,
                          }}
                        >
                          {stripHtml(news.content).substring(0, 150)}
                          {stripHtml(news.content).length > 150 ? '...' : ''}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mt: 'auto',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <CalendarToday fontSize="small" color="action" />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDate(news.publishedAt || news.createdAt)}
                            </Typography>
                          </Box>
                          {news.author && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Person fontSize="small" color="action" />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {news.author}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default News;
