import {
  Container,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Link,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { ThemeProvider } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import theme from '../utils/theme';
import CRUDTeam, { TeamMember } from '../firestore/CRUDTeam';

// Placeholder image as data URI
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2U4NjE2MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

const Team = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        const members = await CRUDTeam.getTeamMembers();
        // Sort by priority (lower number = higher priority)
        const sortedMembers = [...members].sort((a, b) => {
          const priorityA = a.priority ?? 999;
          const priorityB = b.priority ?? 999;
          return priorityA - priorityB;
        });
        console.log('members', sortedMembers);
        setTeamMembers(sortedMembers);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError('Failed to load team members. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            minHeight: '100vh',
            width: '100%',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress sx={{ color: '#e86161' }} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          py: { xs: 3, sm: 4, md: 6 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Page Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 5, md: 6 } }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: 'text.primary',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              }}
            >
              Our Team
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {teamMembers.length === 0 && !loading && !error && (
            <Alert severity="info" sx={{ mb: 4 }}>
              No team members found.
            </Alert>
          )}

          {/* Team Members Grid */}
          {teamMembers.length > 0 && (
            <Grid container spacing={4} sx={{ mt: 2 }}>
              {teamMembers.map((member) => (
                <Grid item xs={12} sm={6} md={4} key={member.id}>
                  <Card
                    component={member.link ? 'a' : 'div'}
                    href={member.link || undefined}
                    target={
                      member.link?.startsWith('http') ? '_blank' : undefined
                    }
                    rel={
                      member.link?.startsWith('http')
                        ? 'noopener noreferrer'
                        : undefined
                    }
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition:
                        'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                      cursor: member.link ? 'pointer' : 'default',
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 6,
                      },
                      borderRadius: 3,
                      overflow: 'hidden',
                      boxShadow: 2,
                    }}
                  >
                    {/* Member Image */}
                    <CardMedia
                      component="img"
                      image={(() => {
                        const imgUrl = member.image?.trim();
                        // Remove any trailing newlines or whitespace
                        return imgUrl && imgUrl.length > 0
                          ? imgUrl.replace(/\n/g, '').trim()
                          : PLACEHOLDER_IMAGE;
                      })()}
                      alt={member.name}
                      sx={{
                        width: '100%',
                        height: { xs: 250, sm: 280, md: 300 },
                        objectFit: 'cover',
                        backgroundColor: 'grey.100',
                      }}
                      onError={(e) => {
                        // If image fails to load, set placeholder
                        const target = e.target as HTMLImageElement;
                        if (target.src !== PLACEHOLDER_IMAGE) {
                          target.src = PLACEHOLDER_IMAGE;
                        }
                      }}
                    />

                    {/* Member Info */}
                    <CardContent
                      sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        p: { xs: 2, sm: 2.5, md: 3 },
                      }}
                    >
                      <Typography
                        variant="h5"
                        component="h2"
                        sx={{
                          fontWeight: 600,
                          mb: member.role ? 0.5 : 1.5,
                          color: 'text.primary',
                          fontSize: { xs: '1.25rem', sm: '1.4rem' },
                        }}
                      >
                        {member.name}
                      </Typography>
                      {member.role && (
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: '#e86161',
                            fontWeight: 500,
                            mb: 1.5,
                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {member.role}
                        </Typography>
                      )}
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.7,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          flexGrow: 1,
                          mb: member.email ? 2 : 0,
                        }}
                      >
                        {member.description}
                      </Typography>
                      {member.email && (
                        <Link
                          href={`mailto:${member.email}`}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: '#e86161',
                            textDecoration: 'none',
                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                            '&:hover': {
                              textDecoration: 'underline',
                              color: '#d45555',
                            },
                            transition: 'color 0.2s ease-in-out',
                          }}
                        >
                          <EmailIcon sx={{ fontSize: '1.1rem' }} />
                          {member.email}
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Team;
