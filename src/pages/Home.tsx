import {
  Container,
  Typography,
  Paper,
  Box,
  Stack,
  Divider,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../utils/theme';
import StatCard from '../components/StatCard';
import tibLogo from '../assets/TIB.png';
import orkgLogo from '../assets/ORKG.png';
import orkgaskLogo from '../assets/ORKGask.png';

const Home = () => {
  return (
    <ThemeProvider theme={theme}>
      <Container 
        maxWidth="lg"
        sx={{ 
          mt: { xs: 4, sm: 6, md: 8 }, 
          mb: { xs: 4, sm: 6, md: 8 },
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <Stack spacing={4}>
          {/* Main Title Section */}
          <Box 
            sx={{ 
              textAlign: 'center', 
              mb: { xs: 4, sm: 5, md: 6 },
              px: { xs: 2, sm: 4, md: 6 }
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                color: '#e86161',
                fontWeight: 800,
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                letterSpacing: '-0.02em',
                mb: 3,
              }}
            >
              EmpiRE-Compass
            </Typography>
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ 
                mb: 3,
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                lineHeight: 1.5,
                maxWidth: '800px',
                mx: 'auto'
              }}
            >
              A Community-Maintainable Knowledge Graph Dashboard for Empirical
              Research in Requirements Engineering
            </Typography>
          </Box>

          <Divider sx={{ my: { xs: 3, sm: 4, md: 5 } }} />

          {/* Content Sections */}
          <Stack spacing={4}>
            {/* About Project Section */}
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
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  color: '#e86161',
                  fontWeight: 700,
                  mb: 3,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                }}
              >
                About the Project
              </Typography>
              <Typography 
                paragraph
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  lineHeight: 1.7,
                  color: 'text.primary',
                  mb: 3
                }}
              >
                EmpiRE-Compass is a dashboard for visualizing and analyzing data
                from KG-EmpiRE, a community-maintainable knowledge graph of
                empirical research in requirements engineering. The project
                currently contains data from over 680 papers published in the
                research track of the IEEE International Conference on
                Requirements Engineering from 1994 to 2022.
              </Typography>
              <Typography 
                paragraph
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  lineHeight: 1.7,
                  mb: 2
                }}
              >
                The knowledge graph organizes scientific data using a defined
                template across six key themes:
              </Typography>
              <Box sx={{ pl: { xs: 2, sm: 3, md: 4 } }}>
                <Typography component="ul" sx={{ listStyle: 'none', p: 0 }}>
                  {[
                    'Research Paradigm',
                    'Research Design',
                    'Research Method',
                    'Data Collection',
                    'Data Analysis',
                    'Bibliographic Metadata',
                  ].map((theme) => (
                    <Typography 
                      component="li" 
                      key={theme} 
                      sx={{ 
                        mb: 1.5,
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        display: 'flex',
                        alignItems: 'center',
                        '&:before': {
                          content: '""',
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#e86161',
                          borderRadius: '50%',
                          display: 'inline-block',
                          mr: 2
                        }
                      }}
                    >
                      {theme}
                    </Typography>
                  ))}
                </Typography>
              </Box>
            </Paper>

            {/* Key Features Section */}
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
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  color: '#e86161',
                  fontWeight: 700,
                  mb: 3,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                }}
              >
                Key Features
              </Typography>
              <Box sx={{ pl: { xs: 2, sm: 3, md: 4 } }}>
                <Typography component="ul" sx={{ listStyle: 'none', p: 0 }}>
                  {[
                    {
                      title: 'Community Maintainable',
                      description: 'Built on the Open Research Knowledge Graph (ORKG) infrastructure, allowing collaborative maintenance and updates.'
                    },
                    {
                      title: 'FAIR Principles',
                      description: 'Implements Findable, Accessible, Interoperable, and Reusable data principles.'
                    },
                    {
                      title: 'Comprehensive Analysis',
                      description: 'Provides detailed insights into the evolution of empirical research in RE.'
                    },
                    {
                      title: 'Long-term Sustainability',
                      description: 'Supported by TIB - Leibniz Information Centre for Science and Technology.'
                    }
                  ].map((feature, index) => (
                    <Typography 
                      component="li" 
                      key={index}
                      sx={{ 
                        mb: 3,
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        lineHeight: 1.7
                      }}
                    >
                      <Box component="strong" sx={{ 
                        color: '#e86161',
                        display: 'block',
                        mb: 1,
                        fontSize: { xs: '1.1rem', sm: '1.2rem' }
                      }}>
                        {feature.title}
                      </Box>
                      {feature.description}
                    </Typography>
                  ))}
                </Typography>
              </Box>
            </Paper>

            {/* Future Development Section */}
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
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  color: '#e86161',
                  fontWeight: 700,
                  mb: 3,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                }}
              >
                Future Development
              </Typography>
              <Typography 
                paragraph
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  lineHeight: 1.7,
                  mb: 3
                }}
              >
                The project has a comprehensive development plan with short-,
                mid-, and long-term goals:
              </Typography>
              <Box sx={{ pl: { xs: 2, sm: 3, md: 4 } }}>
                <Typography component="ul" sx={{ listStyle: 'none', p: 0 }}>
                  {[
                    {
                      phase: 'Short-term',
                      goal: 'Expand coverage to include the entire research track of RE conference (1993-2023).'
                    },
                    {
                      phase: 'Mid-term',
                      goal: 'Include papers from other important venues and publish comprehensive ORKG reviews.'
                    },
                    {
                      phase: 'Long-term',
                      goal: 'Extend the template to organize more extensive scientific data and address open competency questions.'
                    }
                  ].map((item, index) => (
                    <Typography 
                      component="li" 
                      key={index}
                      sx={{ 
                        mb: 3,
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        lineHeight: 1.7,
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <Box component="strong" sx={{ 
                        color: '#e86161',
                        mb: 1,
                        fontSize: { xs: '1.1rem', sm: '1.2rem' }
                      }}>
                        {item.phase}
                      </Box>
                      {item.goal}
                    </Typography>
                  ))}
                </Typography>
              </Box>
            </Paper>

            {/* Contact Section */}
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
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  color: '#e86161',
                  fontWeight: 700,
                  mb: 3,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                }}
              >
                Contact
              </Typography>
              <Box sx={{ 
                p: { xs: 2, sm: 3 },
                backgroundColor: 'rgba(232, 97, 97, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(232, 97, 97, 0.1)'
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2,
                    color: '#e86161',
                    fontWeight: 600
                  }}
                >
                  Dr. rer. nat. Oliver Karras
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    lineHeight: 1.7,
                    '& > span': {
                      display: 'block',
                      mb: 1
                    }
                  }}
                >
                  <span>Researcher and Data Scientist - Open Research Knowledge Graph</span>
                  <span>TIB - Leibniz Information Centre for Science and Technology</span>
                  <span>Welfengarten 1B</span>
                  <span>30167 Hannover</span>
                  <span>
                    <Box component="strong" sx={{ color: '#e86161', mr: 1 }}>Email:</Box>
                    oliver.karras@tib.eu
                  </span>
                </Typography>
              </Box>
            </Paper>
          </Stack>

          {/* Partner Links Section - Moved to bottom */}
          <Box sx={{ mt: 8 }}>
            <Divider sx={{ mb: 6 }} />
            <Typography
              variant="h6"
              align="center"
              sx={{
                mb: 4,
                color: 'text.secondary',
                fontSize: { xs: '1.1rem', sm: '1.2rem' },
              }}
            >
              Project Partners & Resources
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                gap: { xs: 3, sm: 6, md: 8 },
                flexWrap: 'wrap',
              }}
            >
              <StatCard
                label="TIB"
                link="https://www.tib.eu/de/forschung-entwicklung/open-research-knowledge-graph"
              >
                <Box
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <img
                    src={tibLogo}
                    alt="TIB Logo"
                    style={{
                      width: '45px',
                      height: '45px',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              </StatCard>
              <StatCard label="ORKG" link="https://orkg.org/class/C27001">
                <Box
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <img
                    src={orkgLogo}
                    alt="ORKG Logo"
                    style={{
                      width: '45px',
                      height: '45px',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              </StatCard>
              <StatCard
                label="ORKG Ask"
                link="https://ask.orkg.org/search?query=what%20is%20empirical%20research"
              >
                <Box
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <img
                    src={orkgaskLogo}
                    alt="ORKGask Logo"
                    style={{
                      width: '45px',
                      height: '45px',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              </StatCard>
            </Box>
          </Box>
        </Stack>
      </Container>
    </ThemeProvider>
  );
};

export default Home;
