import React, { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Container,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Snackbar,
  Typography,
  Alert,
  ThemeProvider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ClearIcon from '@mui/icons-material/Clear';
import { templateConfig } from '../constants/template_config';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import theme from '../utils/theme';
import { useNavigate, useLocation } from 'react-router-dom';

const MAX_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB
const templates = templateConfig;

const ContributePage: React.FC = () => {
  const location = useLocation();

  const [selectedTemplate, setSelectedTemplate] =
    useState<keyof typeof templates>('R186491');

  useEffect(() => {
    if (selectedTemplate === 'R186491' || selectedTemplate === 'R1544125') {
      setSelectedTemplate(selectedTemplate);
    }
  }, [selectedTemplate]);
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const templateFromUrl = pathSegments[0];
    if (templateFromUrl && templateFromUrl in templates) {
      setSelectedTemplate(templateFromUrl as keyof typeof templates);
    }
  }, [location.pathname]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info'
  >('info');
  const navigate = useNavigate();

  useEffect(() => {
    let t: number | undefined;
    if (uploading) {
      t = window.setInterval(() => {
        setProgress((p) =>
          Math.min(100, p + Math.floor(Math.random() * 12) + 6)
        );
      }, 300);
    } else {
      setProgress(0);
    }
    return () => {
      if (t) window.clearInterval(t);
    };
  }, [uploading]);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function validateAndSet(f: File | null) {
    setSnackbarOpen(false);
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setFile(null);
      setSnackbarMessage('Only PDF files are supported.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setFile(null);
      setSnackbarMessage(
        'File too large — please upload a file smaller than 30 MB.'
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setFile(f);
    setSnackbarMessage('File ready.');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    validateAndSet(f || null);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    validateAndSet(f || null);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  function clearFile() {
    setFile(null);
    setSnackbarOpen(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function startUploadSimulation() {
    if (!file) {
      setSnackbarMessage('Please pick a PDF first.');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }
    setUploading(true);
    setSnackbarMessage('Uploading...');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    setTimeout(() => {
      setUploading(false);
      setProgress(100);
      const pdfUrl = URL.createObjectURL(file);
      navigate(`/${selectedTemplate}/contribute/viewer`, {
        state: {
          pdfUrl,
          filename: file.name,
        },
      });
    }, 1200);
  }

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: 4, sm: 6, md: 8 },
          mb: { xs: 4, sm: 6, md: 8 },
          minHeight: 'calc(100vh - 200px)',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              mb: 4,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                lineHeight: 1.3,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'primary.main',
                  borderRadius: '2px',
                },
              }}
            >
              Contribute
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Upload a research paper and extract structured insights according to
            your chosen template.
          </Typography>
          {/* Main upload panel */}
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2.5, md: 4 },
              mt: 1,
              width: '100%',
              borderRadius: 2,
              minHeight: 420,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <UploadFileIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Upload paper
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  PDF only. Max 30MB.
                </Typography>
              </Box>
            </Box>

            {/* Drag & drop zone */}
            <Box
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              sx={{
                border: `2px dashed ${isDragging ? theme.palette.primary.main : 'rgba(0,0,0,0.12)'}`,
                borderRadius: 1,
                p: { xs: 2, md: 3 },
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                bgcolor: isDragging ? 'action.hover' : 'background.paper',
              }}
              aria-label="file-dropzone"
            >
              <CloudUploadIcon sx={{ fontSize: 44, color: 'action.active' }} />
              <Typography variant="subtitle1">
                Drag & drop a PDF here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>

              <input
                ref={inputRef}
                id="contribute-file-input"
                type="file"
                accept="application/pdf"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />

              <label htmlFor="contribute-file-input">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<UploadFileIcon />}
                >
                  Choose file
                </Button>
              </label>

              <Typography variant="caption" color="text.secondary">
                PDF only · Max size 30MB
              </Typography>
            </Box>

            {/* File preview */}
            {file && (
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <PictureAsPdfIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={file.name}
                    secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  />
                </ListItem>
              </List>
            )}

            {/* Upload progress */}
            {uploading && (
              <LinearProgress variant="determinate" value={progress} />
            )}

            {/* Actions */}
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
            >
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFile}
                disabled={uploading}
              >
                Clear
              </Button>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CheckCircleIcon />}
                  onClick={startUploadSimulation}
                  disabled={!file || uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </Box>
            </Box>

            {/* Why use contribute */}
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6">Why use contribute?</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                The Contribution workflow helps you extract structured
                information from research papers according to your chosen
                template. After uploading, our tools will help locate
                contributions, datasets, methods, and more — streamlining the
                process of scientific analysis.
              </Typography>
            </Box>
          </Paper>

          {/* Snackbar for feedback */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3500}
            onClose={() => setSnackbarOpen(false)}
          >
            <Alert
              onClose={() => setSnackbarOpen(false)}
              severity={snackbarSeverity}
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default ContributePage;
