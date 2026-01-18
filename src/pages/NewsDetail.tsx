import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Button,
  Stack,
} from '@mui/material';
import {
  CalendarToday,
  Person,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import CRUDNews, { NewsItem } from '../firestore/CRUDNews';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../utils/theme';

const NewsDetail = () => {
  const { templateId, newsId } = useParams<{
    templateId: string;
    newsId: string;
  }>();
  const navigate = useNavigate();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    fetchNewsItem();
    fetchAllNews();
  }, [newsId]);

  useEffect(() => {
    if (allNews.length > 0 && newsId) {
      const index = allNews.findIndex((item) => item.id === newsId);
      setCurrentIndex(index);
    }
  }, [allNews, newsId]);

  const fetchNewsItem = async () => {
    if (!newsId) return;

    setLoading(true);
    setError(null);
    try {
      const item = await CRUDNews.getNewsItem(newsId);
      if (!item || !item.published) {
        setError('News item not found or not published');
        setNewsItem(null);
      } else {
        setNewsItem(item);
      }
    } catch (err) {
      console.error('Error fetching news item:', err);
      setError('Failed to load news item. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllNews = async () => {
    try {
      const items = await CRUDNews.getAllNews(true); // Only published
      setAllNews(items);
    } catch (err) {
      console.error('Error fetching all news:', err);
    }
  };

  const getPreviousNews = () => {
    if (currentIndex > 0) {
      const prevNews = allNews[currentIndex - 1];
      navigate(`/${templateId}/news/${prevNews.id}`);
    }
  };

  const getNextNews = () => {
    if (currentIndex >= 0 && currentIndex < allNews.length - 1) {
      const nextNews = allNews[currentIndex + 1];
      navigate(`/${templateId}/news/${nextNews.id}`);
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
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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

  if (error || !newsItem) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'News item not found'}
          </Alert>
          <Button
            component={Link}
            to={`/${templateId}/news`}
            startIcon={<ArrowBack />}
            variant="outlined"
          >
            Back to News
          </Button>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ mt: { xs: 2, sm: 4 }, mb: 4 }}>
        {/* Back Button */}
        <Button
          component={Link}
          to={`/${templateId}/news`}
          startIcon={<ArrowBack />}
          sx={{ mb: 3 }}
        >
          Back to News
        </Button>

        {/* News Article */}
        <Paper sx={{ p: { xs: 2, sm: 4 }, mb: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={newsItem.priority || 'normal'}
                color={getPriorityColor(newsItem.priority)}
                variant={newsItem.priority === 'low' ? 'outlined' : 'filled'}
              />
              {newsItem.tags?.map((tag, idx) => (
                <Chip key={idx} label={tag} variant="outlined" size="small" />
              ))}
            </Box>
            <Typography
              variant="h3"
              sx={{
                color: '#e86161',
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                mb: 2,
              }}
            >
              {newsItem.title}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(newsItem.publishedAt || newsItem.createdAt)}
                </Typography>
              </Box>
              {newsItem.author && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {newsItem.author}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Image */}
          {newsItem.imageUrl && (
            <Box sx={{ mb: 3 }}>
              <img
                src={newsItem.imageUrl}
                alt={newsItem.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  maxHeight: '500px',
                  objectFit: 'cover',
                }}
              />
            </Box>
          )}

          {/* Content */}
          <Box
            sx={{
              lineHeight: 1.8,
              fontSize: '1.1rem',
              mb: 4,
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                marginTop: 2,
                marginBottom: 1,
                fontWeight: 600,
              },
              '& p': {
                marginBottom: 1.5,
              },
              '& ul, & ol': {
                marginLeft: 2,
                marginBottom: 1.5,
              },
              '& a': {
                color: '#e86161',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 1,
                marginY: 2,
              },
            }}
            dangerouslySetInnerHTML={{ __html: newsItem.content }}
          />

          {/* Navigation */}
          {(currentIndex > 0 ||
            (currentIndex >= 0 && currentIndex < allNews.length - 1)) && (
            <>
              <Divider sx={{ my: 3 }} />
              <Stack
                direction="row"
                spacing={2}
                sx={{ justifyContent: 'space-between' }}
              >
                {currentIndex > 0 && (
                  <Button
                    startIcon={<ArrowBack />}
                    onClick={getPreviousNews}
                    variant="outlined"
                  >
                    Previous
                  </Button>
                )}
                {currentIndex >= 0 && currentIndex < allNews.length - 1 && (
                  <Button
                    endIcon={<ArrowForward />}
                    onClick={getNextNews}
                    variant="outlined"
                    sx={{ ml: 'auto' }}
                  >
                    Next
                  </Button>
                )}
              </Stack>
            </>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default NewsDetail;
