import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  TextField,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { ExportFormat, ExportSections } from '../utils/exportQuestion';

const exportSections = {
  explanation: 'Question explanation',
  requiredData: 'Required data',
  analysisMethod: 'Analysis method',
  charts: 'Charts',
  interpretation: 'Interpretation',
  sparql: 'SPARQL queries',
};

interface QuestionExportDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  onExport?: (sections: ExportSections, format: ExportFormat) => void;
}

const QuestionExportDialog = ({
  open,
  onClose,
  title = 'Export question',
  onExport,
}: QuestionExportDialogProps) => {
  const [format, setFormat] = useState('html');
  const [sections, setSections] = useState<ExportSections>({
    explanation: true,
    requiredData: true,
    analysisMethod: true,
    charts: true,
    interpretation: true,
    sparql: false,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="question-export-title"
    >
      <DialogTitle id="question-export-title">{title}</DialogTitle>

      <DialogContent>
        <TextField
          select
          fullWidth
          label="Report format"
          value={format}
          onChange={(event) => setFormat(event.target.value)}
          sx={{ mt: 1, mb: 2 }}
        >
          <MenuItem value="html">HTML (.html)</MenuItem>
          <MenuItem value="pdf">PDF (.pdf)</MenuItem>
          <MenuItem value="txt">Plain text (.txt)</MenuItem>
          <MenuItem value="docx">Word (.docx)</MenuItem>
        </TextField>
        <Accordion disableGutters elevation={0} sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            id="export-options-header"
            aria-controls="export-options-content"
          >
            <Typography>Advanced options</Typography>
          </AccordionSummary>

          <AccordionDetails id="export-options-content">
            <FormGroup>
              {Object.entries(exportSections).map(([key, label]) => {
                const section = key as keyof typeof sections;
                const disabled = section === 'charts' && format === 'txt';

                return (
                  <FormControlLabel
                    key={section}
                    label={label}
                    disabled={disabled}
                    control={
                      <Checkbox
                        checked={!disabled && sections[section]}
                        onChange={(event) =>
                          setSections((previous) => ({
                            ...previous,
                            [section]: event.target.checked,
                          }))
                        }
                      />
                    }
                  />
                );
              })}
            </FormGroup>

            {format === 'txt' && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Plain text reports do not include chart images.
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
        <DialogContentText>
          {onExport
            ? 'Available: HTML, TXT, PDF and Word reports for the current tab. HTML and PDF include the current main and detailed charts.'
            : 'Exporting all questions is not available yet.'}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          disabled={!onExport}
          onClick={() => {
            if (
              format === 'html' ||
              format === 'txt' ||
              format === 'pdf' ||
              format === 'docx'
            ) {
              onExport?.(
                {
                  ...sections,
                  charts: format === 'txt' ? false : sections.charts,
                },
                format
              );
            }
          }}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionExportDialog;
