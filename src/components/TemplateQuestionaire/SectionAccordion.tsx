import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Stack from '@mui/material/Stack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QuestionRenderer from './Questions/QuestionRenderer';

type Props = {
  sec: any;
  si: number;
  answers: Record<string, any>;
  expandedSection: string | null;
  toggleSection: (s: string) => void;
  computeSectionProgress: (s: any) => string;
  addSectionEntry: (sec: any) => void;
  removeSectionEntry: (sectionId: string, idx: number) => void;
  setSingleAnswer: (qId: string, v: any) => void;
  setSectionEntryValue: (
    secId: string,
    idx: number,
    qId: string,
    v: any
  ) => void;
  isManySection: (sec: any) => boolean;
  setExpandedKey: (k: string, v: boolean) => void;
  isExpandedKey: (k: string) => boolean;
};

const SectionAccordion: React.FC<Props> = ({
  sec,
  si,
  answers,
  expandedSection,
  toggleSection,
  computeSectionProgress,
  addSectionEntry,
  removeSectionEntry,
  setSingleAnswer,
  setSectionEntryValue,
  isManySection,
  setExpandedKey,
  isExpandedKey,
}) => {
  const many = isManySection(sec);
  const secKey = sec.id ?? String(si);

  const SectionHeaderRight = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip size="small" label={`${computeSectionProgress(sec)}`} />
      {many && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            addSectionEntry(sec);
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          Add
        </Button>
      )}
    </Box>
  );

  return (
    <Accordion
      key={secKey}
      expanded={expandedSection === secKey}
      onChange={() => toggleSection(secKey)}
      sx={{
        mb: 3,
        border: `1px solid rgba(0,0,0,0.08)`,
        borderRadius: 2,
        boxShadow: 'none',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {sec.title}
            </Typography>
            {sec.desc ? (
              <Tooltip
                title={
                  <Typography variant="body2" sx={{ maxWidth: 420 }}>
                    {sec.desc}
                  </Typography>
                }
                arrow
              >
                <IconButton
                  size="small"
                  sx={{ p: 0.4, minWidth: 30 }}
                  aria-label={`Info for section ${sec.title}`}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <InfoOutlinedIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>

          {SectionHeaderRight}
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        {!many && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {(sec.questions || []).map((q: any, qi: number) => {
              const val = answers[q.id];
              return (
                <QuestionRenderer
                  key={q.id ?? qi}
                  q={q}
                  value={val}
                  onChange={(v) => setSingleAnswer(q.id, v)}
                  idAttr={`q-${q.id}`}
                  level={1}
                />
              );
            })}
          </Box>
        )}

        {many && (
          <Stack spacing={2}>
            {Array.isArray(answers[sec.id]) && answers[sec.id].length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No entries yet — click Add to start.
              </Typography>
            )}

            {(Array.isArray(answers[sec.id]) ? answers[sec.id] : []).map(
              (entry: any, idx: number) => {
                const entryKey = `${sec.id}-entry-${idx}`;
                return (
                  <Accordion
                    key={`${sec.id}-${idx}`}
                    expanded={isExpandedKey(entryKey)}
                    onChange={(_e, val) => setExpandedKey(entryKey, val)}
                    sx={{ boxShadow: 'none' }}
                  >
                    <AccordionSummary>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {sec.title} #{idx + 1}
                        </Typography>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSectionEntry(sec.id, idx);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'grid', gap: 1 }}>
                        {(sec.questions || []).map((q: any, qi: number) => {
                          const v = entry?.[q.id];
                          return (
                            <QuestionRenderer
                              key={q.id ?? qi}
                              q={q}
                              value={v}
                              onChange={(nv) =>
                                setSectionEntryValue(sec.id, idx, q.id, nv)
                              }
                              idAttr={`sec-${sec.id}-entry-${idx}-q-${q.id}`}
                              level={1}
                            />
                          );
                        })}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              }
            )}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default SectionAccordion;
