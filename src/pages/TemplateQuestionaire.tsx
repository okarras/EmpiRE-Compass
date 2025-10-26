import React from 'react';
import {
  Avatar,
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  Checkbox,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';

type Props = {
  templateSpec: any | null;
  answers: Record<string, any>;
  setAnswers: (next: Record<string, any>) => void;
  evidence: Record<string, any>;
  setEvidence: (next: Record<string, any>) => void;
  onGoToPage?: (page: number) => void;
};

const TemplateQuestionaire: React.FC<Props> = ({
  templateSpec,
  answers,
  setAnswers,
  evidence,
  setEvidence,
  onGoToPage,
}) => {
  const setAnswer = (k: string, v: any) => setAnswers({ ...answers, [k]: v });
  const setEvidenceField = (k: string, field: string, v: any) =>
    setEvidence({ ...evidence, [k]: { ...(evidence[k] ?? {}), [field]: v } });

  const handleEvidenceChange = (qid: string, val: string) => {
    setEvidenceField(qid, 'pages', val);
    const m = /page\s*[:=]?\s*(\d+)/i.exec(val);
    if (m && onGoToPage) {
      const p = parseInt(m[1], 10);
      if (!Number.isNaN(p)) onGoToPage(p);
    }
  };

  const handleExport = () => {
    const payload = {
      answers,
      evidence,
      exported_at: new Date().toISOString(),
    };
    const b = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url;
    a.download = `answers.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!templateSpec) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography>Loading template…</Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <UploadFileIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Template & Questions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Using: {templateSpec?.template || 'empirical_research'}
            </Typography>
          </Box>
          <Tooltip title="Export answers as JSON">
            <IconButton onClick={handleExport}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Box sx={{ px: 1 }}>
        {templateSpec.sections.map((sec: any) => (
          <Paper key={sec.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {sec.title}
            </Typography>
            <Box sx={{ mt: 1, display: 'grid', gap: 1 }}>
              {sec.questions?.map((q: any) => {
                if (q.type === 'text' || q.type === 'url') {
                  return (
                    <Box key={q.id}>
                      <TextField
                        fullWidth
                        size="small"
                        label={q.label}
                        value={answers[q.id] ?? ''}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                      />
                      {q.evidence_fields && (
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          sx={{ mt: 1 }}
                          label="Evidence (pages/quote)"
                          value={(evidence[q.id] ?? {}).pages ?? ''}
                          onChange={(e) =>
                            handleEvidenceChange(q.id, e.target.value)
                          }
                        />
                      )}
                    </Box>
                  );
                }

                if (q.type === 'multi_select') {
                  const value = answers[q.id] ?? [];
                  return (
                    <Box key={q.id}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {q.label}
                      </Typography>
                      <FormControl fullWidth size="small">
                        <InputLabel id={`${q.id}-label`}>Select</InputLabel>
                        <Select
                          labelId={`${q.id}-label`}
                          multiple
                          value={value}
                          onChange={(e) =>
                            setAnswer(
                              q.id,
                              typeof e.target.value === 'string'
                                ? e.target.value.split(',')
                                : e.target.value
                            )
                          }
                          input={<OutlinedInput label="Select" />}
                          renderValue={(selected) => (
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 0.5,
                                flexWrap: 'wrap',
                              }}
                            >
                              {(selected as string[]).map((s) => (
                                <Chip key={s} label={s} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {q.options?.map((opt: string) => (
                            <MenuItem key={opt} value={opt}>
                              <Checkbox
                                checked={(value as string[]).indexOf(opt) > -1}
                              />
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  );
                }
                return (
                  <Box key={q.id}>
                    <TextField
                      fullWidth
                      size="small"
                      label={q.label}
                      value={answers[q.id] ?? ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                    />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        ))}
      </Box>
    </>
  );
};

export default TemplateQuestionaire;
