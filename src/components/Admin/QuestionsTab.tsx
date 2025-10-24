import {
  Box,
  Typography,
  Button,
  LinearProgress,
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, ExpandMore } from '@mui/icons-material';
import { QuestionData } from '../../firestore/TemplateManagement';

interface QuestionsTabProps {
  questions: QuestionData[];
  loading: boolean;
  onAddQuestion: () => void;
  onEditQuestion: (question: QuestionData) => void;
  onDeleteQuestion: (questionId: string) => void;
}

const QuestionsTab = ({
  questions,
  loading,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}: QuestionsTabProps) => {
  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Questions ({questions.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAddQuestion}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': { backgroundColor: '#d55555' },
            textTransform: 'none',
          }}
        >
          Add Question
        </Button>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <List>
          {questions.map((question) => (
            <Accordion key={question.uid} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    width: '100%',
                  }}
                >
                  <Chip
                    label={`Q${question.id}`}
                    size="small"
                    color="primary"
                  />
                  <Typography sx={{ flex: 1 }}>{question.title}</Typography>
                  <Chip label={question.uid} size="small" variant="outlined" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Question
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {question.dataAnalysisInformation.question}
                  </Typography>

                  {question.sparqlQuery && (
                    <>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        SPARQL Query
                      </Typography>
                      <Box
                        sx={{
                          backgroundColor: '#f5f5f5',
                          p: 2,
                          borderRadius: 1,
                          mb: 2,
                          maxHeight: 200,
                          overflow: 'auto',
                        }}
                      >
                        <code
                          style={{
                            fontSize: '0.75rem',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {question.sparqlQuery}
                        </code>
                      </Box>
                    </>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => onEditQuestion(question)}
                      sx={{ textTransform: 'none' }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => onDeleteQuestion(question.uid)}
                      color="error"
                      sx={{ textTransform: 'none' }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </List>
      )}
    </Box>
  );
};

export default QuestionsTab;
