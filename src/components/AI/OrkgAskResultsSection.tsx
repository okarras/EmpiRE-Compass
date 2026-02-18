import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
  Link,
  Stack,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  Psychology,
  Article,
  CalendarToday,
  School,
  Link as LinkIcon,
  Star,
} from '@mui/icons-material';
import type { OrkgAskResponse } from '../../services/orkgAskService';

interface OrkgAskResultsSectionProps {
  result: OrkgAskResponse | null;
  loading: boolean;
  error: string | null;
  question: string;
}

const OrkgAskResultsSection: React.FC<OrkgAskResultsSectionProps> = ({
  result,
  loading,
  error,
  question,
}) => {
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Asking AI Researcher...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <Box sx={{ mt: 4 }}>
      {/* Answer Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
          }}
        >
          <Psychology sx={{ color: '#e86161', fontSize: 28 }} />
          <Typography variant="h5" sx={{ color: '#e86161', fontWeight: 600 }}>
            AI Researcher Answer
          </Typography>
        </Box>

        {question && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Your Question:
            </Typography>
            <Typography
              variant="body1"
              sx={{
                p: 2,
                backgroundColor: 'rgba(232, 97, 97, 0.05)',
                borderRadius: 1,
                borderLeft: '4px solid #e86161',
                fontStyle: 'italic',
              }}
            >
              {question}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            '& p': {
              mb: 2,
              lineHeight: 1.8,
            },
            '& ul, & ol': {
              pl: 3,
              mb: 2,
            },
            '& li': {
              mb: 1,
            },
          }}
        >
          <Typography
            variant="body1"
            component="div"
            sx={{
              whiteSpace: 'pre-wrap',
              fontSize: '1.05rem',
            }}
            dangerouslySetInnerHTML={{
              __html: result.answer.replace(/\n/g, '<br />'),
            }}
          />
        </Box>

        {result.metadata && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {result.metadata.total_results !== undefined && (
                <Chip
                  icon={<Article />}
                  label={`${result.metadata.total_results} sources`}
                  size="small"
                  variant="outlined"
                />
              )}
              {result.metadata.processing_time !== undefined && (
                <Chip
                  label={`${(result.metadata.processing_time / 1000).toFixed(1)}s`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Citations Section */}
      {result.citations && result.citations.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 3,
            }}
          >
            <Article sx={{ color: '#e86161', fontSize: 28 }} />
            <Typography variant="h5" sx={{ color: '#e86161', fontWeight: 600 }}>
              Citations ({result.citations.length})
            </Typography>
          </Box>

          <Stack spacing={3}>
            {result.citations.map((citation, index) => (
              <Card
                key={citation.id || index}
                elevation={0}
                sx={{
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: '#e86161',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: 'text.primary',
                      }}
                    >
                      {citation.title || `Citation ${index + 1}`}
                    </Typography>

                    {citation.relevance_score !== undefined && (
                      <Chip
                        icon={<Star />}
                        label={`Relevance: ${(citation.relevance_score * 100).toFixed(0)}%`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(232, 97, 97, 0.1)',
                          color: '#e86161',
                          mb: 1,
                        }}
                      />
                    )}
                  </Box>

                  <Stack spacing={1} sx={{ mb: 2 }}>
                    {citation.authors && citation.authors.length > 0 && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          <strong>Authors:</strong>{' '}
                          {citation.authors.join(', ')}
                        </Typography>
                      </Box>
                    )}

                    {(citation.year || citation.venue) && (
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        {citation.year && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <CalendarToday
                              sx={{ fontSize: 16, color: 'text.secondary' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {citation.year}
                            </Typography>
                          </Box>
                        )}
                        {citation.venue && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <School
                              sx={{ fontSize: 16, color: 'text.secondary' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {citation.venue}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    )}

                    {citation.url && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <LinkIcon
                          sx={{ fontSize: 16, color: 'text.secondary' }}
                        />
                        <Link
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: '#e86161',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          View Paper
                        </Link>
                      </Box>
                    )}
                  </Stack>

                  {citation.abstract && (
                    <Box
                      sx={{
                        mt: 2,
                        pt: 2,
                        borderTop: '1px solid rgba(0,0,0,0.1)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontStyle: 'italic',
                          lineHeight: 1.6,
                        }}
                      >
                        {citation.abstract}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default OrkgAskResultsSection;
