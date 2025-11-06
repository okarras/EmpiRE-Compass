import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Box,
} from '@mui/material';
import { TemplateData } from '../../firestore/TemplateManagement';

interface TemplateSelectorProps {
  templates: Record<string, TemplateData>;
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

const TemplateSelector = ({
  templates,
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) => {
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Select Template
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(templates).map(([id, template]) => (
          <Grid item xs={12} sm={6} md={4} key={id}>
            <Card
              sx={{
                cursor: 'pointer',
                border:
                  selectedTemplate === id ? '2px solid #e86161' : '1px solid',
                borderColor: selectedTemplate === id ? '#e86161' : 'divider',
                '&:hover': {
                  boxShadow: 3,
                  borderColor: '#e86161',
                },
              }}
              onClick={() => onSelectTemplate(id)}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {template.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {template.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={id} size="small" />
                  <Chip
                    label={template.collectionName}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default TemplateSelector;
