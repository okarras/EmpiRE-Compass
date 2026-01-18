import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { CalendarToday, Person, PriorityHigh } from '@mui/icons-material';
import CRUDNews, { NewsItem } from '../../firestore/CRUDNews';

const HighPriorityNews = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [highPriorityNews, setHighPriorityNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHighPriorityNews();
  }, []);

  const fetchHighPriorityNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await CRUDNews.getAllNews(true); // Only published news
      // Filter for high priority news and limit to 3 most recent
      const highPriority = items
        .filter((item) => item.priority === 'high')
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
        .slice(0, 3); // Limit to 3 items
      setHighPriorityNews(highPriority);
    } catch (err) {
      console.error('Error fetching high priority news:', err);
      setError('Failed to load news.');
    } finally {
      setLoading(false);
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
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Don't render if there are no high priority news items or templateId is missing
  if (!loading && (highPriorityNews.length === 0 || !templateId)) {
    return null;
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 3, sm: 4, md: 5 },
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 3,
        }}
      >
        <PriorityHigh sx={{ color: '#e86161', fontSize: { xs: 32, sm: 40 } }} />
        <Typography
          variant="h4"
          sx={{
            color: '#e86161',
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
          }}
        >
          Important Updates
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
          <CircularProgress sx={{ color: '#e86161' }} />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {highPriorityNews.map((news) => (
              <Grid item xs={12} sm={6} md={4} key={news.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    border: '2px solid #e86161',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea
                    component={Link}
                    to={`/${templateId || ''}/news/${news.id}`}
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
                        height="180"
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
                          alignItems: 'center',
                        }}
                      >
                        <Chip
                          label="High Priority"
                          size="small"
                          color="error"
                          icon={<PriorityHigh />}
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
                        component="h3"
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
                        {news.content}
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
                          <Typography variant="caption" color="text.secondary">
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
          {highPriorityNews.length > 0 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography
                component={Link}
                to={`/${templateId || ''}/news`}
                sx={{
                  color: '#e86161',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                View All News &rarr;
              </Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default HighPriorityNews;
