import QuestionAccordion from './QuestionAccordion';
import { Box, Paper, Typography, Chip, Button } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { FirebaseQuestion } from '../store/slices/questionSlice';
import { useParams } from 'react-router';
import { getTemplateConfig } from '../constants/template_config';
import { Query } from '../constants/queries_chart_info';
import InfoIcon from '@mui/icons-material/Info';
import { useState, useEffect } from 'react';
import CRUDHomeContent, { HomeContentData } from '../firestore/CRUDHomeContent';
import { useBackupChange } from '../hooks/useBackupChange';
import DownloadIcon from '@mui/icons-material/Download';
import QuestionExportDialog from './QuestionExportDialog';
import HeaderExportAction from './HeaderExportAction';
import Question from './Question';
import {
  exportQuestionsHtml,
  exportQuestionsCharts,
  type ExportFormat,
  exportQuestionsDocument,
  type ExportChartMode,
  type ExportSections,
  type QuestionHtmlExport,
} from './ExportQuestion';
import { toast } from 'react-hot-toast';

//* Dashboard component that displays the questions for a given template
const Dashboard = () => {
  const params = useParams();
  const templateId = params.templateId;
  const [homeContent, setHomeContent] = useState<HomeContentData | null>(null);
  const backupVersion = useBackupChange(); // Listen for backup changes
  const [exportOpen, setExportOpen] = useState(false);
  const [exportJob, setExportJob] = useState<{
    questions: Query[];
    sections: ExportSections;
    results: QuestionHtmlExport[];
    format: ExportFormat;
    creatingReport?: boolean;
    chartMode: ExportChartMode;
  } | null>(null);

  const firebaseQuestions = useSelector<
    RootState,
    Record<string, FirebaseQuestion>
  >(
    (state) =>
      state.questions.firebaseQuestions as Record<string, FirebaseQuestion>
  );

  useEffect(() => {
    const loadHomeContent = async () => {
      const content = await CRUDHomeContent.getHomeContent();
      setHomeContent(content);
    };
    loadHomeContent();
  }, [backupVersion]); // Re-fetch when backup changes

  const sortedFirebaseQuestions = Object.values(firebaseQuestions).sort(
    (a, b) => a.id - b.id
  );

  const templateConfig = getTemplateConfig(templateId as string);
  const queries = templateConfig.queries;

  if (!queries) {
    return <div>No queries found</div>;
  }

  const mergedQuestions = sortedFirebaseQuestions.map((question) => {
    return {
      ...queries.find((q) => q.id === question.id),
      ...question,
    };
  });

  // Get template info box content from home content or use fallback
  const templateInfoBox = homeContent?.templateInfoBoxes?.[
    templateId as string
  ] || {
    title: templateConfig.title,
    description: '',
  };

  return (
    <Box
      sx={{
        width: '100%',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, md: 6 },
      }}
    >
      <HeaderExportAction>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => setExportOpen(true)}
        >
          Export
        </Button>
      </HeaderExportAction>

      <QuestionExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export selected questions"
        progress={
          exportJob
            ? exportJob.creatingReport
              ? `Creating ${exportJob.format.toUpperCase()} report…`
              : `Preparing question ${exportJob.results.length + 1} of ${exportJob.questions.length}…`
            : undefined
        }
        onExport={
          templateId
            ? (sections, format, questionIds, chartMode = 'relative') => {
                if (exportJob) return;
                const sparqlMap: Record<string, string> = templateConfig.sparql;
                const selected = (
                  mergedQuestions.filter(
                    (question) =>
                      questionIds?.includes(question.id) &&
                      queries.some((query) => query.id === question.id)
                  ) as Query[]
                ).map((question) => ({
                  ...question,
                  sparqlQuery2:
                    question.sparqlQuery2 ||
                    sparqlMap[question.uid_2_merge ?? question.uid_2 ?? ''],
                }));
                if (selected.length)
                  setExportJob({
                    questions: selected,
                    sections:
                      format === 'txt'
                        ? { ...sections, charts: false }
                        : sections,
                    results: [],
                    format,
                    chartMode,
                  });
              }
            : undefined
        }
        questions={mergedQuestions
          .filter((question) =>
            queries.some((query) => query.id === question.id)
          )
          .map((question) => ({
            id: question.id,
            title: question.dataAnalysisInformation?.question ?? '',
          }))}
      />
      {exportJob && (
        <Box
          aria-hidden="true"
          sx={{
            position: 'fixed',
            left: '-12000px',
            top: 0,
            width: 1200,
            pointerEvents: 'none',
          }}
        >
          <Question
            key={exportJob.results.length}
            query={exportJob.questions[exportJob.results.length]}
            reportExport={{
              sections: exportJob.sections,
              format: exportJob.format,
              chartMode:
                exportJob.format === 'pdf' || exportJob.format === 'docx'
                  ? exportJob.chartMode
                  : undefined,
              onComplete: async (question) => {
                const results = [...exportJob.results, question];
                if (results.length < exportJob.questions.length) {
                  setExportJob({ ...exportJob, results });
                  return;
                }
                setExportJob({ ...exportJob, creatingReport: true });
                // Show the final phase before starting the document conversion.
                await new Promise<void>((resolve) => setTimeout(resolve, 0));
                try {
                  if (
                    exportJob.format === 'svg' ||
                    exportJob.format === 'png'
                  ) {
                    await exportQuestionsCharts(
                      results,
                      templateId!,
                      exportJob.sections,
                      exportJob.format
                    );
                  } else if (exportJob.format !== 'html') {
                    await exportQuestionsDocument(
                      results,
                      templateId!,
                      exportJob.sections,
                      exportJob.chartMode,
                      exportJob.format
                    );
                  } else {
                    exportQuestionsHtml(
                      results,
                      templateId!,
                      exportJob.sections
                    );
                  }
                  setExportOpen(false);
                } catch (error) {
                  console.error('Questions export failed:', error);
                  toast.error('Export failed. Please try again.');
                }
                setExportJob(null);
              },
              onError: (error) => {
                console.error('Questions export failed:', error);
                toast.error('Export failed. Please try again.');
                setExportJob(null);
              },
            }}
          />
        </Box>
      )}
      {/* Template Info Box */}
      <Box
        sx={{
          width: '100%',
          maxWidth: '1000px',
          mb: { xs: 3, md: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            borderLeft: '4px solid #e86161',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              mb: 2,
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 1,
                backgroundColor: 'rgba(232, 97, 97, 0.1)',
                flexShrink: 0,
              }}
            >
              <InfoIcon sx={{ color: '#e86161', fontSize: '1.25rem' }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                fontSize: '1rem',
                flex: 1,
                minWidth: 0,
              }}
            >
              {templateInfoBox.title}
            </Typography>
            <Box id="page-title-export-action" sx={{ flexShrink: 0 }} />
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 2,
              fontSize: '0.875rem',
              lineHeight: 1.6,
            }}
          >
            <Box
              dangerouslySetInnerHTML={{ __html: templateInfoBox.description }}
            />
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Chip
              label={`${queries.length} Questions`}
              size="small"
              sx={{
                backgroundColor: 'rgba(232, 97, 97, 0.1)',
                color: '#e86161',
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 24,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                opacity: 0.7,
                ml: 'auto',
              }}
            >
              ID: {templateId}
            </Typography>
          </Box>
        </Paper>
      </Box>
      {Object.values(mergedQuestions).map((query: Query) => (
        <Box
          key={`question-wrapper-${query.uid}`}
          id={`question-${query.id}`}
          sx={{
            width: '100%',
            maxWidth: '1000px',
            mb: { xs: 2.5, md: 3.5 },
          }}
        >
          {queries.find((q) => q.id === query.id) && (
            <QuestionAccordion query={query} />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default Dashboard;
