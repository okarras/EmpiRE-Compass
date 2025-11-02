import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { Download, Upload } from '@mui/icons-material';
import { TemplateData } from '../../firestore/TemplateManagement';

interface ImportExportTabProps {
  selectedTemplate: string;
  templates: Record<string, TemplateData>;
  onExport: () => void;
  onImport: (jsonData: any) => void;
  onError: (message: string) => void;
}

const ImportExportTab = ({
  selectedTemplate,
  templates,
  onExport,
  onImport,
  onError,
}: ImportExportTabProps) => {
  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      onImport(jsonData);
    } catch (err) {
      onError('Failed to import template');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Import & Export
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Download sx={{ color: '#e86161', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Export Template
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Export current template with all questions and statistics as
                JSON
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={onExport}
                sx={{
                  borderColor: '#e86161',
                  color: '#e86161',
                  '&:hover': {
                    borderColor: '#d55555',
                    backgroundColor: 'rgba(232, 97, 97, 0.08)',
                  },
                  textTransform: 'none',
                }}
              >
                Export {templates[selectedTemplate]?.title}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Upload sx={{ color: '#e86161', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Import Template
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Import template data from JSON file
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                component="label"
                sx={{
                  borderColor: '#e86161',
                  color: '#e86161',
                  '&:hover': {
                    borderColor: '#d55555',
                    backgroundColor: 'rgba(232, 97, 97, 0.08)',
                  },
                  textTransform: 'none',
                }}
              >
                Select JSON File
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportFile(file);
                    }
                  }}
                />
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImportExportTab;
