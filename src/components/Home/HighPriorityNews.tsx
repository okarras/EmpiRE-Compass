import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { PriorityHigh, ChevronRight, Close } from '@mui/icons-material';
import CRUDNews, { NewsItem } from '../../firestore/CRUDNews';

const HighPriorityNews = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [highPriorityNews, setHighPriorityNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchHighPriorityNews();
  }, []);

  const fetchHighPriorityNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await CRUDNews.getAllNews(true); // Only published news
      // Filter for news that should be shown on home page
      const homeNews = items
        .filter((item) => item.showOnHome === true)
        .sort((a, b) => {
          const dateA = a.publishedAt || a.createdAt;
          const dateB = b.publishedAt || b.createdAt;
          const timeA =
            dateA instanceof Date
              ? dateA.getTime()
              : typeof dateA === 'string'
                ? new Date(dateA).getTime()
                : typeof dateA === 'number'
                  ? dateA
                  : 0;
          const timeB =
            dateB instanceof Date
              ? dateB.getTime()
              : typeof dateB === 'string'
                ? new Date(dateB).getTime()
                : typeof dateB === 'number'
                  ? dateB
                  : 0;
          return timeB - timeA; // Most recent first
        })
        .slice(0, 5); // Limit to 5 items
      setHighPriorityNews(homeNews);
    } catch (err) {
      console.error('Error fetching home news:', err);
      setError('Failed to load news.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (highPriorityNews.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % highPriorityNews.length);
      }, 5000); // Auto-rotate every 5 seconds
      return () => clearInterval(interval);
    }
  }, [highPriorityNews.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % highPriorityNews.length);
  };

  const handlePrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + highPriorityNews.length) % highPriorityNews.length
    );
  };

  // Don't render if there are no news items to show on home, templateId is missing, or dismissed
  if (!loading && (highPriorityNews.length === 0 || !templateId || dismissed)) {
    return null;
  }

  const currentNews = highPriorityNews[currentIndex];

  return (
    <Paper
      elevation={1}
      sx={{
        backgroundColor: '#fff3f3',
        borderLeft: '4px solid #e86161',
        borderRadius: 1,
        mb: 2,
        overflow: 'hidden',
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 0 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 2,
            px: 2,
          }}
        >
          <CircularProgress size={20} sx={{ color: '#e86161' }} />
        </Box>
      ) : (
        currentNews && (
          <Box
            component={Link}
            to={`/${templateId || ''}/news/${currentNews.id}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1.5,
              px: 2,
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: '#ffe8e8',
              },
            }}
          >
            <PriorityHigh
              sx={{
                color: '#e86161',
                fontSize: 20,
                flexShrink: 0,
              }}
            />
            {currentNews.priority === 'high' && (
              <Chip
                label="High Priority"
                size="small"
                color="error"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#333',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                }}
              >
                {currentNews.title}
              </Typography>
            </Box>
            {highPriorityNews.length > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  flexShrink: 0,
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePrevious();
                  }}
                  sx={{
                    padding: 0.5,
                    '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.1)' },
                  }}
                >
                  <ChevronRight
                    sx={{
                      transform: 'rotate(180deg)',
                      fontSize: 18,
                      color: '#e86161',
                    }}
                  />
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    minWidth: '30px',
                    textAlign: 'center',
                  }}
                >
                  {currentIndex + 1}/{highPriorityNews.length}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNext();
                  }}
                  sx={{
                    padding: 0.5,
                    '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.1)' },
                  }}
                >
                  <ChevronRight
                    sx={{
                      fontSize: 18,
                      color: '#e86161',
                    }}
                  />
                </IconButton>
              </Box>
            )}
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                setDismissed(true);
              }}
              sx={{
                padding: 0.5,
                ml: 0.5,
                '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.1)' },
              }}
            >
              <Close sx={{ fontSize: 18, color: '#666' }} />
            </IconButton>
          </Box>
        )
      )}
    </Paper>
  );
};

export default HighPriorityNews;
