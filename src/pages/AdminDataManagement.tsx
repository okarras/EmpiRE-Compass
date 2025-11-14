/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  QuestionAnswer,
  BarChart,
  CloudUpload,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import TemplateManagement, {
  TemplateData,
  QuestionData,
  StatisticData,
} from '../firestore/TemplateManagement';
import DataMigration from '../firestore/DataMigration';
import RestoreFromBackup, {
  RestoreProgress,
} from '../firestore/RestoreFromBackup';
import { useAuth } from '../auth/useAuth';
import { useKeycloak } from '@react-keycloak/web';

// Import subcomponents
import RestoreSection from '../components/Admin/RestoreSection';
import TemplateSelector from '../components/Admin/TemplateSelector';
import QuestionsTab from '../components/Admin/QuestionsTab';
import StatisticsTab from '../components/Admin/StatisticsTab';
import ImportExportTab from '../components/Admin/ImportExportTab';
import QuestionEditDialog from '../components/Admin/QuestionEditDialog';
import StatisticEditDialog from '../components/Admin/StatisticEditDialog';
import InstructionsCard from '../components/Admin/InstructionsCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 0 }}>{children}</Box>}
    </div>
  );
}

const AdminDataManagement = () => {
  const { user } = useAuth();
  const { keycloak } = useKeycloak();
  const [currentTab, setCurrentTab] = useState(0);
  const [templates, setTemplates] = useState<Record<string, TemplateData>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('R186491');
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [statistics, setStatistics] = useState<StatisticData[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] =
    useState<RestoreProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // Dialog states
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [openStatisticDialog, setOpenStatisticDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(
    null
  );
  const [editingStatistic, setEditingStatistic] =
    useState<StatisticData | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateData(selectedTemplate);
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    try {
      const templatesData = await TemplateManagement.getAllTemplates();
      setTemplates(templatesData);
      setHasData(Object.keys(templatesData).length > 0);
    } catch (err) {
      console.error('Error loading templates:', err);
      setHasData(false);
    }
  };

  const loadTemplateData = async (templateId: string) => {
    setLoading(true);
    try {
      const data = await TemplateManagement.getCompleteTemplate(templateId);
      setQuestions(data.questions);
      setStatistics(data.statistics);
    } catch (err) {
      setError('Failed to load template data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromBackup = async (file: File) => {
    setRestoring(true);
    setError(null);
    setRestoreProgress(null);

    try {
      const result = await RestoreFromBackup.restoreFromBackupFile(
        file,
        (progress: RestoreProgress) => {
          setRestoreProgress(progress);
        }
      );

      if (result.success && result.statistics) {
        setSuccess(
          `Successfully restored! ${result.statistics.templatesCreated} templates, ` +
            `${result.statistics.questionsCreated} questions, ` +
            `${result.statistics.statisticsCreated} statistics, ` +
            `${result.statistics.usersCreated} users`
        );
        await loadTemplates();
        await loadTemplateData(selectedTemplate);
      } else {
        setError(result.error || 'Restore failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setRestoring(false);
      setRestoreProgress(null);
    }
  };

  const handleExportTemplate = async () => {
    try {
      const data = await DataMigration.exportTemplateToJSON(selectedTemplate);
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `template-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('Template exported successfully!');
    } catch (err) {
      setError('Failed to export template');
    }
  };

  const handleSaveQuestion = async (
    question: QuestionData,
    chartSettingsJson: string,
    chartSettings2Json: string
  ) => {
    try {
      const cleanedForm: any = { ...question };

      // Parse chart settings
      if (chartSettingsJson.trim()) {
        try {
          cleanedForm.chartSettings = JSON.parse(chartSettingsJson);
        } catch (err) {
          setError('Invalid JSON in Chart Settings');
          return;
        }
      } else {
        delete cleanedForm.chartSettings;
      }

      if (chartSettings2Json.trim()) {
        try {
          cleanedForm.chartSettings2 = JSON.parse(chartSettings2Json);
        } catch (err) {
          setError('Invalid JSON in Chart Settings 2');
          return;
        }
      } else {
        delete cleanedForm.chartSettings2;
      }

      // Clean up undefined and empty values in dataAnalysisInformation
      if (cleanedForm.dataAnalysisInformation) {
        const dai = cleanedForm.dataAnalysisInformation;

        // Clean arrays - remove if all elements are empty
        if (Array.isArray(dai.dataAnalysis)) {
          const hasContent = dai.dataAnalysis.some(
            (item: string) => item && item.trim()
          );
          if (!hasContent) {
            delete dai.dataAnalysis;
          }
        }

        if (Array.isArray(dai.dataInterpretation)) {
          const hasContent = dai.dataInterpretation.some(
            (item: string) => item && item.trim()
          );
          if (!hasContent) {
            delete dai.dataInterpretation;
          }
        }

        // Clean empty strings
        Object.keys(dai).forEach((key) => {
          if (dai[key] === undefined || dai[key] === null) {
            delete dai[key];
          }
        });
      }

      // Remove undefined fields at top level
      Object.keys(cleanedForm).forEach((key) => {
        if (cleanedForm[key] === undefined) {
          delete cleanedForm[key];
        }
      });

      if (!user) {
        setError('User not authenticated');
        return;
      }

      if (editingQuestion) {
        await TemplateManagement.updateQuestion(
          selectedTemplate,
          cleanedForm.uid,
          cleanedForm,
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('Question updated successfully!');
      } else {
        await TemplateManagement.createQuestion(
          selectedTemplate,
          cleanedForm.uid,
          cleanedForm,
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('Question created successfully!');
      }

      setOpenQuestionDialog(false);
      setEditingQuestion(null);
      await loadTemplateData(selectedTemplate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (
      window.confirm('Are you sure you want to delete this question?') &&
      user
    ) {
      try {
        await TemplateManagement.deleteQuestion(
          selectedTemplate,
          questionId,
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('Question deleted successfully!');
        await loadTemplateData(selectedTemplate);
      } catch (err) {
        setError('Failed to delete question');
      }
    }
  };

  const handleSaveStatistic = async (statistic: StatisticData) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      if (editingStatistic) {
        await TemplateManagement.updateStatistic(
          selectedTemplate,
          statistic.id,
          statistic,
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('Statistic updated successfully!');
      } else {
        await TemplateManagement.createStatistic(
          selectedTemplate,
          statistic.id,
          statistic,
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('Statistic created successfully!');
      }

      setOpenStatisticDialog(false);
      setEditingStatistic(null);
      await loadTemplateData(selectedTemplate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save statistic');
    }
  };

  const handleDeleteStatistic = async (statisticId: string) => {
    if (
      window.confirm('Are you sure you want to delete this statistic?') &&
      user
    ) {
      try {
        await TemplateManagement.deleteStatistic(
          selectedTemplate,
          statisticId,
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('Statistic deleted successfully!');
        await loadTemplateData(selectedTemplate);
      } catch (err) {
        setError('Failed to delete statistic');
      }
    }
  };

  const handleImportTemplate = async (jsonData: any) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      await DataMigration.importTemplateFromJSONWithAuth(
        jsonData,
        user.id,
        user.email,
        keycloak?.token
      );
      setSuccess('Template imported successfully!');
      await loadTemplates();
      await loadTemplateData(selectedTemplate);
    } catch (err) {
      setError('Failed to import template');
    }
  };

  const openEditQuestionDialog = (q: QuestionData) => {
    // Ensure chartSettings are proper objects
    const cleanedQuestion = {
      ...q,
      chartSettings:
        typeof q.chartSettings === 'string'
          ? JSON.parse(q.chartSettings as string)
          : q.chartSettings,
      chartSettings2:
        typeof q.chartSettings2 === 'string'
          ? JSON.parse(q.chartSettings2 as string)
          : q.chartSettings2,
    };
    setEditingQuestion(cleanedQuestion);
    setOpenQuestionDialog(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: '#e86161', mb: 1 }}
        >
          Template Data Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage templates, questions, and SPARQL queries in the new nested
          structure
        </Typography>
      </Box>

      {/* Restore Section */}
      <RestoreSection
        hasData={hasData}
        restoring={restoring}
        restoreProgress={restoreProgress}
        onRestoreFromBackup={handleRestoreFromBackup}
      />

      {/* Template Selector */}
      <TemplateSelector
        templates={templates}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
      />

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
            '& .Mui-selected': {
              color: '#e86161',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#e86161',
            },
          }}
        >
          <Tab
            label="Questions"
            icon={<QuestionAnswer />}
            iconPosition="start"
          />
          <Tab label="Statistics" icon={<BarChart />} iconPosition="start" />
          <Tab
            label="Import/Export"
            icon={<CloudUpload />}
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <QuestionsTab
            questions={questions}
            loading={loading}
            onAddQuestion={() => {
              setEditingQuestion(null);
              setOpenQuestionDialog(true);
            }}
            onEditQuestion={openEditQuestionDialog}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <StatisticsTab
            statistics={statistics}
            loading={loading}
            onAddStatistic={() => {
              setEditingStatistic(null);
              setOpenStatisticDialog(true);
            }}
            onEditStatistic={(stat) => {
              setEditingStatistic(stat);
              setOpenStatisticDialog(true);
            }}
            onDeleteStatistic={handleDeleteStatistic}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <ImportExportTab
            selectedTemplate={selectedTemplate}
            templates={templates}
            onExport={handleExportTemplate}
            onImport={handleImportTemplate}
            onError={setError}
          />
        </TabPanel>
      </Paper>

      {/* Edit Dialogs */}
      <QuestionEditDialog
        open={openQuestionDialog}
        question={editingQuestion}
        onClose={() => {
          setOpenQuestionDialog(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
      />

      <StatisticEditDialog
        open={openStatisticDialog}
        statistic={editingStatistic}
        onClose={() => {
          setOpenStatisticDialog(false);
          setEditingStatistic(null);
        }}
        onSave={handleSaveStatistic}
      />

      {/* Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" icon={<CheckCircle />}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" icon={<Warning />}>
          {error}
        </Alert>
      </Snackbar>

      {/* Instructions */}
      <InstructionsCard />
    </Container>
  );
};

export default AdminDataManagement;
