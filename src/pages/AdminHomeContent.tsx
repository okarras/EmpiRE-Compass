import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Save,
  Refresh,
  Add,
  Delete,
  Home as HomeIcon,
} from '@mui/icons-material';
import CRUDHomeContent, {
  HomeContentData,
  Feature,
  Phase,
  Partner,
} from '../firestore/CRUDHomeContent';

const AdminHomeContent = () => {
  const [content, setContent] = useState<HomeContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await CRUDHomeContent.getHomeContent();
      setContent(data);
    } catch (err) {
      console.error('Error loading home content:', err);
      setError('Failed to load home content');
      // Use default content on error
      setContent(CRUDHomeContent.defaultHomeContent);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content) return;

    try {
      setSaving(true);
      await CRUDHomeContent.setHomeContent(content);
      setSuccess('Home content saved successfully!');
    } catch (err) {
      console.error('Error saving home content:', err);
      setError('Failed to save home content');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      confirm(
        'Are you sure you want to reload the content? Any unsaved changes will be lost.'
      )
    ) {
      await loadContent();
    }
  };

  const handleInitialize = async () => {
    if (confirm('Are you sure you want to initialize with default content?')) {
      try {
        setSaving(true);
        await CRUDHomeContent.initializeHomeContent();
        await loadContent();
        setSuccess('Home content initialized with defaults');
      } catch (err) {
        console.error('Error initializing home content:', err);
        setError('Failed to initialize home content');
      } finally {
        setSaving(false);
      }
    }
  };

  const updateHeader = (
    field: keyof HomeContentData['header'],
    value: string
  ) => {
    if (!content) return;
    setContent({
      ...content,
      header: { ...content.header, [field]: value },
    });
  };

  const updateAboutProject = (
    field: keyof HomeContentData['aboutProject'],
    value: string | string[]
  ) => {
    if (!content) return;
    setContent({
      ...content,
      aboutProject: { ...content.aboutProject, [field]: value },
    });
  };

  const addTheme = () => {
    if (!content) return;
    setContent({
      ...content,
      aboutProject: {
        ...content.aboutProject,
        themes: [...content.aboutProject.themes, 'New Theme'],
      },
    });
  };

  const updateTheme = (index: number, value: string) => {
    if (!content) return;
    const newThemes = [...content.aboutProject.themes];
    newThemes[index] = value;
    setContent({
      ...content,
      aboutProject: { ...content.aboutProject, themes: newThemes },
    });
  };

  const deleteTheme = (index: number) => {
    if (!content) return;
    const newThemes = content.aboutProject.themes.filter((_, i) => i !== index);
    setContent({
      ...content,
      aboutProject: { ...content.aboutProject, themes: newThemes },
    });
  };

  const addFeature = () => {
    if (!content) return;
    setContent({
      ...content,
      keyFeatures: {
        ...content.keyFeatures,
        features: [
          ...content.keyFeatures.features,
          { title: 'New Feature', description: 'Description' },
        ],
      },
    });
  };

  const updateFeature = (
    index: number,
    field: keyof Feature,
    value: string
  ) => {
    if (!content) return;
    const newFeatures = [...content.keyFeatures.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setContent({
      ...content,
      keyFeatures: { ...content.keyFeatures, features: newFeatures },
    });
  };

  const deleteFeature = (index: number) => {
    if (!content) return;
    const newFeatures = content.keyFeatures.features.filter(
      (_, i) => i !== index
    );
    setContent({
      ...content,
      keyFeatures: { ...content.keyFeatures, features: newFeatures },
    });
  };

  const addPhase = () => {
    if (!content) return;
    setContent({
      ...content,
      futureDevelopment: {
        ...content.futureDevelopment,
        phases: [
          ...content.futureDevelopment.phases,
          { phase: 'New Phase', goal: 'Goal description' },
        ],
      },
    });
  };

  const updatePhase = (index: number, field: keyof Phase, value: string) => {
    if (!content) return;
    const newPhases = [...content.futureDevelopment.phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setContent({
      ...content,
      futureDevelopment: { ...content.futureDevelopment, phases: newPhases },
    });
  };

  const deletePhase = (index: number) => {
    if (!content) return;
    const newPhases = content.futureDevelopment.phases.filter(
      (_, i) => i !== index
    );
    setContent({
      ...content,
      futureDevelopment: { ...content.futureDevelopment, phases: newPhases },
    });
  };

  const updateContact = (
    field: keyof HomeContentData['contact'],
    value: string | string[]
  ) => {
    if (!content) return;
    setContent({
      ...content,
      contact: { ...content.contact, [field]: value },
    });
  };

  const addPartner = () => {
    if (!content) return;
    setContent({
      ...content,
      partners: {
        ...content.partners,
        partners: [
          ...content.partners.partners,
          {
            label: 'New Partner',
            link: 'https://example.com',
            logoUrl: '/src/assets/TIB.png',
          },
        ],
      },
    });
  };

  const updatePartner = (
    index: number,
    field: keyof Partner,
    value: string
  ) => {
    if (!content) return;
    const newPartners = [...content.partners.partners];
    newPartners[index] = { ...newPartners[index], [field]: value };
    setContent({
      ...content,
      partners: { ...content.partners, partners: newPartners },
    });
  };

  const deletePartner = (index: number) => {
    if (!content) return;
    const newPartners = content.partners.partners.filter((_, i) => i !== index);
    setContent({
      ...content,
      partners: { ...content.partners, partners: newPartners },
    });
  };

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: 4, display: 'flex', justifyContent: 'center' }}
      >
        <CircularProgress sx={{ color: '#e86161' }} />
      </Container>
    );
  }

  if (!content) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load home content</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
          <HomeIcon sx={{ fontSize: 40, color: '#e86161' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ color: '#e86161', fontWeight: 700 }}>
              Home Page Content Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Edit the content displayed on the home page
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleReset}
              disabled={saving}
            >
              Reload
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                backgroundColor: '#e86161',
                '&:hover': { backgroundColor: '#d45151' },
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{ mb: 2, color: '#e86161', fontWeight: 600 }}
          >
            Header Section
          </Typography>
          <TextField
            fullWidth
            label="Title"
            value={content.header.title}
            onChange={(e) => updateHeader('title', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Subtitle"
            value={content.header.subtitle}
            onChange={(e) => updateHeader('subtitle', e.target.value)}
            multiline
            rows={2}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* About Project Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{ mb: 2, color: '#e86161', fontWeight: 600 }}
          >
            About Project Section
          </Typography>
          <TextField
            fullWidth
            label="Title"
            value={content.aboutProject.title}
            onChange={(e) => updateAboutProject('title', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Content"
            value={content.aboutProject.content}
            onChange={(e) => updateAboutProject('content', e.target.value)}
            multiline
            rows={4}
            sx={{ mb: 2 }}
            helperText="Use double line breaks (\\n\\n) to separate paragraphs"
          />
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Themes
              </Typography>
              <Button startIcon={<Add />} size="small" onClick={addTheme}>
                Add Theme
              </Button>
            </Box>
            {content.aboutProject.themes.map((theme, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  value={theme}
                  onChange={(e) => updateTheme(index, e.target.value)}
                  size="small"
                />
                <IconButton onClick={() => deleteTheme(index)} color="error">
                  <Delete />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Key Features Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{ mb: 2, color: '#e86161', fontWeight: 600 }}
          >
            Key Features Section
          </Typography>
          <TextField
            fullWidth
            label="Title"
            value={content.keyFeatures.title}
            onChange={(e) =>
              setContent({
                ...content,
                keyFeatures: { ...content.keyFeatures, title: e.target.value },
              })
            }
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Features
              </Typography>
              <Button startIcon={<Add />} size="small" onClick={addFeature}>
                Add Feature
              </Button>
            </Box>
            {content.keyFeatures.features.map((feature, index) => (
              <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Chip label={`Feature ${index + 1}`} size="small" />
                  <IconButton
                    onClick={() => deleteFeature(index)}
                    color="error"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>
                <TextField
                  fullWidth
                  label="Title"
                  value={feature.title}
                  onChange={(e) =>
                    updateFeature(index, 'title', e.target.value)
                  }
                  sx={{ mb: 1 }}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={feature.description}
                  onChange={(e) =>
                    updateFeature(index, 'description', e.target.value)
                  }
                  multiline
                  rows={2}
                  size="small"
                />
              </Paper>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Future Development Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{ mb: 2, color: '#e86161', fontWeight: 600 }}
          >
            Future Development Section
          </Typography>
          <TextField
            fullWidth
            label="Title"
            value={content.futureDevelopment.title}
            onChange={(e) =>
              setContent({
                ...content,
                futureDevelopment: {
                  ...content.futureDevelopment,
                  title: e.target.value,
                },
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Introduction"
            value={content.futureDevelopment.intro}
            onChange={(e) =>
              setContent({
                ...content,
                futureDevelopment: {
                  ...content.futureDevelopment,
                  intro: e.target.value,
                },
              })
            }
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Development Phases
              </Typography>
              <Button startIcon={<Add />} size="small" onClick={addPhase}>
                Add Phase
              </Button>
            </Box>
            {content.futureDevelopment.phases.map((phase, index) => (
              <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Chip label={`Phase ${index + 1}`} size="small" />
                  <IconButton
                    onClick={() => deletePhase(index)}
                    color="error"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>
                <TextField
                  fullWidth
                  label="Phase Name"
                  value={phase.phase}
                  onChange={(e) => updatePhase(index, 'phase', e.target.value)}
                  sx={{ mb: 1 }}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Goal"
                  value={phase.goal}
                  onChange={(e) => updatePhase(index, 'goal', e.target.value)}
                  multiline
                  rows={2}
                  size="small"
                />
              </Paper>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Contact Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{ mb: 2, color: '#e86161', fontWeight: 600 }}
          >
            Contact Section
          </Typography>
          <TextField
            fullWidth
            label="Title"
            value={content.contact.title}
            onChange={(e) => updateContact('title', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Name"
            value={content.contact.name}
            onChange={(e) => updateContact('name', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Position"
            value={content.contact.position}
            onChange={(e) => updateContact('position', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Organization"
            value={content.contact.organization}
            onChange={(e) => updateContact('organization', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Address (one line per item)"
            value={content.contact.address.join('\n')}
            onChange={(e) =>
              updateContact('address', e.target.value.split('\n'))
            }
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            value={content.contact.email}
            onChange={(e) => updateContact('email', e.target.value)}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Partners Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{ mb: 2, color: '#e86161', fontWeight: 600 }}
          >
            Partners Section
          </Typography>
          <TextField
            fullWidth
            label="Title"
            value={content.partners.title}
            onChange={(e) =>
              setContent({
                ...content,
                partners: { ...content.partners, title: e.target.value },
              })
            }
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Partners
              </Typography>
              <Button startIcon={<Add />} size="small" onClick={addPartner}>
                Add Partner
              </Button>
            </Box>
            {content.partners.partners.map((partner, index) => (
              <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Chip label={`Partner ${index + 1}`} size="small" />
                  <IconButton
                    onClick={() => deletePartner(index)}
                    color="error"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>
                <TextField
                  fullWidth
                  label="Label"
                  value={partner.label}
                  onChange={(e) =>
                    updatePartner(index, 'label', e.target.value)
                  }
                  sx={{ mb: 1 }}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Link"
                  value={partner.link}
                  onChange={(e) => updatePartner(index, 'link', e.target.value)}
                  sx={{ mb: 1 }}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Logo URL"
                  value={partner.logoUrl}
                  onChange={(e) =>
                    updatePartner(index, 'logoUrl', e.target.value)
                  }
                  size="small"
                  helperText="Use /src/assets/[filename] for static assets"
                />
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}
        >
          <Button
            variant="outlined"
            onClick={handleInitialize}
            disabled={saving}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              backgroundColor: '#e86161',
              '&:hover': { backgroundColor: '#d45151' },
            }}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </Box>
      </Paper>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminHomeContent;
