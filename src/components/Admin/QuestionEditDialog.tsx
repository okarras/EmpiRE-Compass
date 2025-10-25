import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Paper,
  Typography,
  Alert,
  Chip,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Info, Code as CodeIcon } from '@mui/icons-material';
import { QuestionData } from '../../firestore/TemplateManagement';
import ChartSettingsHelp from './ChartSettingsHelp';

interface QuestionEditDialogProps {
  open: boolean;
  question: QuestionData | null;
  onClose: () => void;
  onSave: (
    question: QuestionData,
    chartSettingsJson: string,
    chartSettings2Json: string
  ) => void;
}

const QuestionEditDialog = ({
  open,
  question,
  onClose,
  onSave,
}: QuestionEditDialogProps) => {
  const [form, setForm] = useState<QuestionData>({
    id: 0,
    uid: '',
    title: '',
    chartType: 'bar',
    dataAnalysisInformation: {
      question: '',
    },
  });

  const [chartSettingsJson, setChartSettingsJson] = useState<string>('');
  const [chartSettings2Json, setChartSettings2Json] = useState<string>('');
  const [isDualQuery, setIsDualQuery] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  // Initialize form when dialog opens
  useEffect(() => {
    if (open && question) {
      setForm(question);
      setChartSettingsJson(
        question.chartSettings
          ? JSON.stringify(question.chartSettings, null, 2)
          : ''
      );
      setChartSettings2Json(
        question.chartSettings2
          ? JSON.stringify(question.chartSettings2, null, 2)
          : ''
      );
      setIsDualQuery(!!(question.uid_2 || question.sparqlQuery2));
      setChartType(question.chartType || 'bar');
    } else if (open && !question) {
      // New question
      setForm({
        id: 0,
        uid: '',
        title: '',
        chartType: 'bar',
        dataAnalysisInformation: {
          question: '',
        },
      });
      setChartSettingsJson('');
      setChartSettings2Json('');
      setIsDualQuery(false);
      setChartType('bar');
    }
  }, [open, question]);

  const handleSave = () => {
    // Update chart type and ensure dual query fields are set/cleared
    const finalForm = {
      ...form,
      chartType,
    };
    onSave(finalForm, chartSettingsJson, chartSettings2Json);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {question ? 'Edit Question' : 'Add New Question'}
          </Typography>
          {isDualQuery && (
            <Chip label="Dual Query Mode" size="small" color="secondary" />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Helpful Guide */}
          <Alert severity="info" icon={<Info />}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                📚 Question Type Guide
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                • <strong>Single Query:</strong> One SPARQL query → One chart
                (e.g., Query 1, 3, 8)
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                • <strong>Dual Query (Two Tabs):</strong> Two SPARQL queries →
                Two charts (e.g., Query 2, 4, 6, 7)
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography
                variant="caption"
                display="block"
                sx={{ fontWeight: 600, mb: 0.5 }}
              >
                For Dual Query Questions:
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                • <strong>UID 1 / SPARQL Query 1 / Chart Settings 1:</strong>{' '}
                Data Collection (Tab 1)
              </Typography>
              <Typography variant="caption" display="block">
                • <strong>UID 2 / SPARQL Query 2 / Chart Settings 2:</strong>{' '}
                Data Analysis (Tab 2)
              </Typography>
            </Box>
          </Alert>

          {/* Basic Information & Configuration */}
          <Paper
            elevation={0}
            sx={{ p: 2, backgroundColor: 'rgba(232, 97, 97, 0.05)' }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: '#e86161' }}
              >
                Basic Information & Configuration
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Question ID"
                type="number"
                fullWidth
                value={form.id}
                onChange={(e) =>
                  setForm({ ...form, id: parseInt(e.target.value) || 0 })
                }
                helperText="Numeric ID for ordering (1, 2, 3...)"
              />
              <TextField
                label="UID (Primary Identifier)"
                fullWidth
                value={form.uid}
                onChange={(e) => setForm({ ...form, uid: e.target.value })}
                helperText="Unique identifier - links to SPARQL query (e.g., query_1, query_2_1 for data collection)"
              />
              <TextField
                label="Title"
                fullWidth
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                helperText="Display title shown in navigation and question pages"
              />
              <Divider sx={{ my: 1 }} />

              {/* Tab Names (only show for dual query) */}
              {isDualQuery && (
                <Box sx={{ pl: 2, pt: 1, borderLeft: '3px solid #e86161' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block', fontWeight: 600 }}
                  >
                    Tab Names
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Tab 1 Name"
                      value={form.tabs?.tab1_name || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tabs: {
                            tab1_name: e.target.value,
                            tab2_name: form.tabs?.tab2_name || '',
                          },
                        })
                      }
                      size="small"
                      fullWidth
                      helperText="e.g., Data collection"
                    />
                    <TextField
                      label="Tab 2 Name"
                      value={form.tabs?.tab2_name || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tabs: {
                            tab1_name: form.tabs?.tab1_name || '',
                            tab2_name: e.target.value,
                          },
                        })
                      }
                      size="small"
                      fullWidth
                      helperText="e.g., Data analysis"
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Data Analysis Information */}
          <Paper
            elevation={0}
            sx={{ p: 2, backgroundColor: 'rgba(232, 97, 97, 0.05)' }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2, color: '#e86161' }}
            >
              Data Analysis Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Research Question"
                fullWidth
                multiline
                rows={2}
                value={form.dataAnalysisInformation.question}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dataAnalysisInformation: {
                      ...form.dataAnalysisInformation,
                      question: e.target.value,
                    },
                  })
                }
                helperText="Main research question this query answers"
              />
              <TextField
                label="Question Explanation (HTML)"
                fullWidth
                multiline
                rows={4}
                value={form.dataAnalysisInformation.questionExplanation || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dataAnalysisInformation: {
                      ...form.dataAnalysisInformation,
                      questionExplanation: e.target.value,
                    },
                  })
                }
                helperText="HTML explanation with references - supports <p>, <a>, <strong>, etc."
              />
              {/* Data Analysis - Single or Dual Mode */}
              {!isDualQuery ? (
                <TextField
                  label="Data Analysis Methodology"
                  fullWidth
                  multiline
                  rows={4}
                  value={form.dataAnalysisInformation.dataAnalysis || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dataAnalysisInformation: {
                        ...form.dataAnalysisInformation,
                        dataAnalysis: e.target.value,
                      },
                    })
                  }
                  helperText="Methodology and analysis approach used"
                />
              ) : (
                <Box sx={{ pl: 2, pt: 1, borderLeft: '3px solid #e86161' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block', fontWeight: 600 }}
                  >
                    Data Analysis Methodology (Dual Query)
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <TextField
                      label="Tab 1: Data Collection Analysis"
                      fullWidth
                      multiline
                      rows={3}
                      value={
                        Array.isArray(form.dataAnalysisInformation.dataAnalysis)
                          ? form.dataAnalysisInformation.dataAnalysis[0] || ''
                          : form.dataAnalysisInformation.dataAnalysis || ''
                      }
                      onChange={(e) => {
                        const currentAnalysis = Array.isArray(
                          form.dataAnalysisInformation.dataAnalysis
                        )
                          ? form.dataAnalysisInformation.dataAnalysis
                          : ['', ''];
                        const newAnalysis = [...currentAnalysis];
                        newAnalysis[0] = e.target.value;
                        setForm({
                          ...form,
                          dataAnalysisInformation: {
                            ...form.dataAnalysisInformation,
                            dataAnalysis: newAnalysis,
                          },
                        });
                      }}
                      helperText="Analysis methodology for data collection (Tab 1)"
                      size="small"
                    />
                    <TextField
                      label="Tab 2: Data Analysis Methods Analysis"
                      fullWidth
                      multiline
                      rows={3}
                      value={
                        Array.isArray(form.dataAnalysisInformation.dataAnalysis)
                          ? form.dataAnalysisInformation.dataAnalysis[1] || ''
                          : ''
                      }
                      onChange={(e) => {
                        const currentAnalysis = Array.isArray(
                          form.dataAnalysisInformation.dataAnalysis
                        )
                          ? form.dataAnalysisInformation.dataAnalysis
                          : ['', ''];
                        const newAnalysis = [...currentAnalysis];
                        newAnalysis[1] = e.target.value;
                        setForm({
                          ...form,
                          dataAnalysisInformation: {
                            ...form.dataAnalysisInformation,
                            dataAnalysis: newAnalysis,
                          },
                        });
                      }}
                      helperText="Analysis methodology for data analysis methods (Tab 2)"
                      size="small"
                    />
                  </Box>
                </Box>
              )}

              {/* Data Interpretation - Single or Dual Mode */}
              {!isDualQuery ? (
                <TextField
                  label="Data Interpretation (HTML)"
                  fullWidth
                  multiline
                  rows={6}
                  value={form.dataAnalysisInformation.dataInterpretation || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dataAnalysisInformation: {
                        ...form.dataAnalysisInformation,
                        dataInterpretation: e.target.value,
                      },
                    })
                  }
                  helperText="Interpretation with tables - supports HTML: <table>, <tr>, <td>, etc."
                />
              ) : (
                <Box sx={{ pl: 2, pt: 1, borderLeft: '3px solid #e86161' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block', fontWeight: 600 }}
                  >
                    Data Interpretation (Dual Query - HTML)
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <TextField
                      label="Tab 1: Data Collection Interpretation"
                      fullWidth
                      multiline
                      rows={4}
                      value={
                        Array.isArray(
                          form.dataAnalysisInformation.dataInterpretation
                        )
                          ? form.dataAnalysisInformation
                              .dataInterpretation[0] || ''
                          : form.dataAnalysisInformation.dataInterpretation ||
                            ''
                      }
                      onChange={(e) => {
                        const currentInterpretation = Array.isArray(
                          form.dataAnalysisInformation.dataInterpretation
                        )
                          ? form.dataAnalysisInformation.dataInterpretation
                          : ['', ''];
                        const newInterpretation = [...currentInterpretation];
                        newInterpretation[0] = e.target.value;
                        setForm({
                          ...form,
                          dataAnalysisInformation: {
                            ...form.dataAnalysisInformation,
                            dataInterpretation: newInterpretation,
                          },
                        });
                      }}
                      helperText="Interpretation for data collection (Tab 1) - supports HTML"
                      size="small"
                    />
                    <TextField
                      label="Tab 2: Data Analysis Methods Interpretation"
                      fullWidth
                      multiline
                      rows={4}
                      value={
                        Array.isArray(
                          form.dataAnalysisInformation.dataInterpretation
                        )
                          ? form.dataAnalysisInformation
                              .dataInterpretation[1] || ''
                          : ''
                      }
                      onChange={(e) => {
                        const currentInterpretation = Array.isArray(
                          form.dataAnalysisInformation.dataInterpretation
                        )
                          ? form.dataAnalysisInformation.dataInterpretation
                          : ['', ''];
                        const newInterpretation = [...currentInterpretation];
                        newInterpretation[1] = e.target.value;
                        setForm({
                          ...form,
                          dataAnalysisInformation: {
                            ...form.dataAnalysisInformation,
                            dataInterpretation: newInterpretation,
                          },
                        });
                      }}
                      helperText="Interpretation for data analysis methods (Tab 2) - supports HTML"
                      size="small"
                    />
                  </Box>
                </Box>
              )}
              <TextField
                label="Required Data for Analysis"
                fullWidth
                multiline
                rows={3}
                value={
                  form.dataAnalysisInformation.requiredDataForAnalysis || ''
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    dataAnalysisInformation: {
                      ...form.dataAnalysisInformation,
                      requiredDataForAnalysis: e.target.value,
                    },
                  })
                }
                helperText="What data is needed for this analysis"
              />
            </Box>
          </Paper>

          {/* SPARQL Queries */}
          <Paper
            elevation={0}
            sx={{ p: 2, backgroundColor: 'rgba(232, 97, 97, 0.05)' }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: '#e86161' }}
              >
                SPARQL Queries
              </Typography>
              <Chip
                icon={<CodeIcon />}
                label={isDualQuery ? 'Dual Query Mode' : 'Single Query Mode'}
                size="small"
                color={isDualQuery ? 'secondary' : 'primary'}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Query 1 - Data Collection / Main */}
              <Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    {isDualQuery
                      ? '📊 Query 1: Data Collection (Tab 1)'
                      : 'Main SPARQL Query'}
                  </Typography>
                  {isDualQuery && (
                    <Chip
                      label={form.uid}
                      size="small"
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  )}
                </Box>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <TextField
                    fullWidth
                    multiline
                    rows={12}
                    value={form.sparqlQuery || ''}
                    onChange={(e) =>
                      setForm({ ...form, sparqlQuery: e.target.value })
                    }
                    placeholder="SELECT ?variable WHERE { ... }"
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                        fontSize: '0.8125rem',
                        backgroundColor: '#f8f9fa',
                        lineHeight: 1.6,
                      },
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  {isDualQuery
                    ? 'SPARQL query for data collection methods'
                    : 'SPARQL query to fetch data from knowledge graph'}
                </Typography>
              </Box>

              {/* Query 2 - Data Analysis (only for dual query) */}
              {isDualQuery && (
                <Box sx={{ pl: 2, pt: 2, borderLeft: '3px solid #e86161' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      📈 Query 2: Data Analysis (Tab 2)
                    </Typography>
                    <Chip
                      label={form.uid_2 || 'UID 2'}
                      size="small"
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  </Box>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <TextField
                      fullWidth
                      multiline
                      rows={12}
                      value={form.sparqlQuery2 || ''}
                      onChange={(e) =>
                        setForm({ ...form, sparqlQuery2: e.target.value })
                      }
                      placeholder="SELECT ?variable WHERE { ... }"
                      sx={{
                        '& .MuiInputBase-root': {
                          fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                          fontSize: '0.8125rem',
                          backgroundColor: '#f8f9fa',
                          lineHeight: 1.6,
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    SPARQL query for data analysis methods (second tab)
                  </Typography>

                  <TextField
                    label="UID 2 (Data Analysis Identifier)"
                    fullWidth
                    size="small"
                    value={form.uid_2 || ''}
                    onChange={(e) =>
                      setForm({ ...form, uid_2: e.target.value })
                    }
                    helperText="e.g., query_2_2 (links to SPARQL_QUERIES[query_2_2])"
                    sx={{ mt: 2 }}
                  />
                </Box>
              )}
            </Box>
          </Paper>

          {/* Chart Configuration */}
          <Paper
            elevation={0}
            sx={{ p: 2, backgroundColor: 'rgba(232, 97, 97, 0.05)' }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: '#e86161' }}
              >
                Chart Configuration (JSON)
              </Typography>
              <Tooltip title="Chart settings define axes, series, colors, margins, and layout">
                <IconButton size="small">
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Comprehensive Help Section */}
            <ChartSettingsHelp />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Chart Settings 1 */}
              <Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    {isDualQuery
                      ? '📊 Chart Settings 1 (Data Collection - Tab 1)'
                      : 'Chart Settings'}
                  </Typography>
                  {isDualQuery && (
                    <Chip
                      label="Tab 1"
                      size="small"
                      color="primary"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  )}
                </Box>
                <Box
                  sx={{
                    border: '2px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <TextField
                    fullWidth
                    multiline
                    rows={20}
                    value={chartSettingsJson}
                    onChange={(e) => {
                      const value = e.target.value;
                      setChartSettingsJson(value);
                      if (!value.trim()) {
                        setForm({ ...form, chartSettings: undefined });
                        return;
                      }
                      try {
                        const parsed = JSON.parse(value);
                        setForm({ ...form, chartSettings: parsed });
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    placeholder={`{
  "heading": "Chart title here",
  "className": "fullWidth fixText",
  "height": 400,
  "layout": "horizontal",  // Remove for vertical chart
  "xAxis": [
    {
      "scaleType": "band",
      "dataKey": "year",
      "label": "Year"
    }
  ],
  "yAxis": [
    {
      "scaleType": "band",  // For horizontal only
      "dataKey": "methodType",
      "label": "Method Type"
    }
  ],
  "series": [
    { "dataKey": "normalizedRatio" }
  ],
  "colors": ["#4c72b0", "#dd8452", "#55a868"],
  "margin": {
    "left": 150,  // Increase for long labels
    "right": 20
  },
  "barLabel": "value",
  "barCategoryGap": 0.1,
  "hideDetailedChartLegend": false
}`}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily:
                          '"Fira Code", Monaco, Menlo, "Courier New", monospace',
                        fontSize: '0.8125rem',
                        backgroundColor: '#1e1e1e',
                        color: '#d4d4d4',
                        lineHeight: 1.8,
                      },
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      '& textarea::placeholder': {
                        color: '#858585',
                        opacity: 1,
                      },
                    }}
                  />
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {isDualQuery
                        ? 'Chart for data collection methods'
                        : 'Main chart configuration'}
                    </Typography>
                    <Chip
                      label={
                        typeof form.chartSettings === 'object' &&
                        form.chartSettings !== null
                          ? 'Valid JSON ✓'
                          : 'Empty'
                      }
                      size="small"
                      color={
                        typeof form.chartSettings === 'object' &&
                        form.chartSettings !== null
                          ? 'success'
                          : 'default'
                      }
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: 'rgba(33, 150, 243, 0.05)',
                      p: 1,
                      borderRadius: 1,
                      borderLeft: '3px solid #2196f3',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
                    >
                      ⚡ Quick Tips:
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontSize: '0.7rem' }}
                    >
                      • dataKey must match property in dataset (e.g., "year",
                      "methodType", "normalizedRatio")
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontSize: '0.7rem' }}
                    >
                      • For horizontal charts: use layout: "horizontal" +
                      increase margin.left (150-190)
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontSize: '0.7rem' }}
                    >
                      • Provide one color per series in the colors array
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Chart Settings 2 (only for dual query) */}
              {isDualQuery && (
                <Box sx={{ pl: 2, pt: 2, borderLeft: '3px solid #e86161' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      📈 Chart Settings 2 (Data Analysis - Tab 2)
                    </Typography>
                    <Chip
                      label="Tab 2"
                      size="small"
                      color="secondary"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  </Box>
                  <Box
                    sx={{
                      border: '2px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <TextField
                      fullWidth
                      multiline
                      rows={20}
                      value={chartSettings2Json}
                      onChange={(e) => {
                        const value = e.target.value;
                        setChartSettings2Json(value);
                        if (!value.trim()) {
                          setForm({ ...form, chartSettings2: undefined });
                          return;
                        }
                        try {
                          const parsed = JSON.parse(value);
                          setForm({ ...form, chartSettings2: parsed });
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      placeholder={`{
  "heading": "Data analysis methods",
  "className": "fullWidth fixText",
  "height": 400,
  "layout": "horizontal",
  "xAxis": [
    {
      "scaleType": "band",
      "dataKey": "year",
      "label": "Year"
    }
  ],
  "yAxis": [
    {
      "scaleType": "band",
      "dataKey": "methodType",
      "label": "Analysis Method"
    }
  ],
  "series": [
    { "dataKey": "normalizedRatio" }
  ],
  "colors": ["#e86161"],
  "margin": {
    "left": 150,
    "right": 20
  },
  "barLabel": "value"
}`}
                      sx={{
                        '& .MuiInputBase-root': {
                          fontFamily:
                            '"Fira Code", Monaco, Menlo, "Courier New", monospace',
                          fontSize: '0.8125rem',
                          backgroundColor: '#1e1e1e',
                          color: '#d4d4d4',
                          lineHeight: 1.8,
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                        '& textarea::placeholder': {
                          color: '#858585',
                          opacity: 1,
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Chart for data analysis methods (second tab)
                      </Typography>
                      <Chip
                        label={form.chartSettings2 ? 'Valid JSON ✓' : 'Empty'}
                        size="small"
                        color={form.chartSettings2 ? 'success' : 'default'}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Box
                      sx={{
                        backgroundColor: 'rgba(33, 150, 243, 0.05)',
                        p: 1,
                        borderRadius: 1,
                        borderLeft: '3px solid #2196f3',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
                      >
                        ⚡ Quick Tips:
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        • Chart 2 typically uses the same structure as Chart 1
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        • dataKey should reference properties from Query 2's
                        processed data
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        • Copy Chart 1 settings and modify
                        dataKey/heading/colors as needed
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            backgroundColor: '#e86161',
            '&:hover': { backgroundColor: '#d55555' },
          }}
        >
          Save Question
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionEditDialog;
