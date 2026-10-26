import { useEffect, useState } from 'react';
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
import type {
  ExportChartMode,
  ExportFormat,
  ExportSections,
} from '../utils/exportQuestion';

const exportSections = {
  explanation: 'Question explanation',
  requiredData: 'Required data',
  analysisMethod: 'Analysis method',
  charts: 'Charts',
  interpretation: 'Interpretation',
  sparql: 'SPARQL queries',
};

const formatLabels: Record<ExportFormat, string> = {
  html: 'HTML (.html)',
  pdf: 'PDF (.pdf)',
  txt: 'Plain text (.txt)',
  docx: 'Word (.docx)',
  svg: 'Charts – SVG (.zip)',
  png: 'Charts – PNG (.zip)',
};

interface QuestionExportDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  formats?: ExportFormat[];
  availableSections?: (keyof ExportSections)[];
  description?: string;
  questions?: { id: number; title: string }[];
  progress?: string;
  onExport?: (
    sections: ExportSections,
    format: ExportFormat,
    questionIds?: number[],
    chartMode?: ExportChartMode
  ) => void;
}

const QuestionExportDialog = ({
  open,
  onClose,
  title = 'Export question',
  questions,
  formats,
  availableSections,
  description,
  progress,
  onExport,
}: QuestionExportDialogProps) => {
  const [format, setFormat] = useState<ExportFormat>('html');
  const [chartMode, setChartMode] = useState<ExportChartMode>('relative');
  const [sections, setSections] = useState<ExportSections>({
    explanation: true,
    requiredData: true,
    analysisMethod: true,
    charts: true,
    interpretation: true,
    sparql: false,
  });
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<
    number[] | null
  >(null);
  const collectionExport = questions !== undefined;
  const questionIds = (questions ?? []).map((question) => question.id);
  const selectedIds =
    selectedQuestionIds === null
      ? questionIds
      : questionIds.filter((id) => selectedQuestionIds.includes(id));

  useEffect(() => {
    if (open && collectionExport) {
      setSelectedQuestionIds(null);
      setFormat('html');
    }
  }, [open, collectionExport]);

  useEffect(() => {
    if (open && formats?.length && !formats.includes(format)) {
      setFormat(formats[0]);
    }
  }, [open, formats, format]);

  const chartsOnly = format === 'svg' || format === 'png';
  return (
    <Dialog
      open={open}
      onClose={progress ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="question-export-title"
    >
      <DialogTitle id="question-export-title">{title}</DialogTitle>

      <DialogContent>
        <TextField
          select
          fullWidth
          label="Export format"
          disabled={Boolean(progress)}
          value={
            formats?.length && !formats.includes(format) ? formats[0] : format
          }
          onChange={(event) => setFormat(event.target.value as ExportFormat)}
          sx={{ mt: 1, mb: 2 }}
        >
          {(formats ?? (Object.keys(formatLabels) as ExportFormat[])).map(
            (value) => (
              <MenuItem key={value} value={value}>
                {formatLabels[value]}
              </MenuItem>
            )
          )}
        </TextField>
        {collectionExport &&
          (format === 'pdf' || format === 'docx') &&
          sections.charts && (
            <TextField
              select
              fullWidth
              label="Chart display"
              value={chartMode}
              disabled={Boolean(progress)}
              onChange={(event) =>
                setChartMode(event.target.value as ExportChartMode)
              }
              sx={{ mb: 2 }}
            >
              <MenuItem value="relative">Relative</MenuItem>
              <MenuItem value="absolute">Absolute</MenuItem>
              <MenuItem value="both">Both (Relative and Absolute)</MenuItem>
            </TextField>
          )}
        {questions && (
          <>
            <Typography variant="subtitle2" component="h3">
              Questions to include
            </Typography>
            <FormControlLabel
              label="Select all questions"
              disabled={Boolean(progress) || !questionIds.length}
              control={
                <Checkbox
                  checked={
                    questionIds.length > 0 &&
                    selectedIds.length === questionIds.length
                  }
                  indeterminate={
                    selectedIds.length > 0 &&
                    selectedIds.length < questionIds.length
                  }
                  disabled={Boolean(progress) || !questionIds.length}
                  onChange={(event) =>
                    setSelectedQuestionIds(event.target.checked ? null : [])
                  }
                />
              }
            />
            <FormGroup
              aria-label="Questions to include"
              sx={{ maxHeight: 280, overflowY: 'auto', mb: 1 }}
            >
              {questions.map((question) => (
                <FormControlLabel
                  key={question.id}
                  label={`${question.id}. ${question.title}`}
                  disabled={Boolean(progress)}
                  control={
                    <Checkbox
                      checked={selectedIds.includes(question.id)}
                      onChange={(event) =>
                        setSelectedQuestionIds(
                          event.target.checked
                            ? [...selectedIds, question.id]
                            : selectedIds.filter((id) => id !== question.id)
                        )
                      }
                    />
                  }
                />
              ))}
            </FormGroup>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedIds.length} of {questions.length} questions selected
            </Typography>
          </>
        )}
        {!chartsOnly && (
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
                  if (availableSections && !availableSections.includes(section))
                    return null;
                  const disabled =
                    Boolean(progress) ||
                    (section === 'charts' && format === 'txt');

                  return (
                    <FormControlLabel
                      key={section}
                      label={
                        section === 'charts' &&
                        (format === 'pdf' || format === 'docx')
                          ? 'Main charts'
                          : label
                      }
                      disabled={disabled}
                      control={
                        <Checkbox
                          checked={
                            !(section === 'charts' && format === 'txt') &&
                            sections[section]
                          }
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
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Plain text reports do not include chart images.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        )}
        <DialogContentText role={progress ? 'status' : undefined}>
          {progress ??
            description ??
            (onExport
              ? format === 'pdf' || format === 'docx'
                ? collectionExport
                  ? `${format === 'pdf' ? 'PDF' : 'Word'} includes all tabs and their main charts. Detailed charts are available in the SVG/PNG ZIP export.`
                  : `${format === 'pdf' ? 'PDF' : 'Word'} includes the current tab’s main chart. Download detailed charts separately with Charts – SVG or PNG.`
                : format === 'html'
                  ? 'HTML includes all available tabs. Included charts can switch between Relative and Absolute where supported.'
                  : chartsOnly
                    ? collectionExport
                      ? 'Download all charts of the selected questions as a ZIP: question, named tab (if available), then Absolute and Relative where supported.'
                      : 'Download charts from all available tabs as a ZIP, with Absolute and Relative variants where supported.'
                    : collectionExport
                      ? 'Plain text includes all tabs and a contents list. Charts are not included.'
                      : 'Plain text reports include the current tab.'
              : 'Exporting all questions is not available yet.')}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          disabled={
            Boolean(progress) ||
            !onExport ||
            Boolean(formats && !formats.includes(format)) ||
            (collectionExport && selectedIds.length === 0)
          }
          onClick={() => {
            if (
              format === 'html' ||
              format === 'txt' ||
              format === 'pdf' ||
              format === 'docx' ||
              format === 'svg' ||
              format === 'png'
            ) {
              onExport?.(
                {
                  ...sections,
                  charts: chartsOnly || (format !== 'txt' && sections.charts),
                },
                format,
                collectionExport ? selectedIds : undefined,
                collectionExport && (format === 'pdf' || format === 'docx')
                  ? chartMode
                  : undefined
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
