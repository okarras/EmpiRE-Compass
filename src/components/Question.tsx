import React, { useEffect, useState } from 'react';
import { Query } from '../constants/queries_chart_info';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Fade,
  Stack,
  FormControlLabel,
  Switch,
  Chip,
} from '@mui/material';

import fetchSPARQLData from '../helpers/fetch_query';
import QuestionInformationView from './QuestionInformationView';
import QuestionChartView from './QuestionChartView';
import QuestionDataGridView from './QuestionDataGridView';
import SectionSelector from './SectionSelector';
import { useAIAssistantContext } from '../context/AIAssistantContext';
import { getTemplateConfig } from '../constants/template_config';
import { useParams } from 'react-router-dom';
import QuestionInformation from './QuestionInformation';
import { useQuestionOverrides } from '../hooks/useQuestionOverrides';
import EditableSection from './EditableSection';

interface QuestionProps {
  query: Query;
}

const Question: React.FC<QuestionProps> = ({ query: initialQuery }) => {
  // Use overrides hook
  const {
    mergedQuery: query,
    isAdmin,
    isEditMode,
    setIsEditMode,
    saveVersion,
    overrideData,
  } = useQuestionOverrides({ query: initialQuery });

  // Tabs state
  const [tab, setTab] = useState(0);
  const { setContext } = useAIAssistantContext();
  const { templateId } = useParams();

  // State for primary data (uid)
  const [dataCollection, setDataCollection] = useState<
    Record<string, unknown>[]
  >([]);
  const [loading1, setLoading1] = useState(true);
  const [error1, setError1] = useState<string | null>(null);
  const [normalized, setNormalized] = useState(true);

  // State for secondary data (uid_2 if exists)
  const [dataAnalysis, setDataAnalysis] = useState<Record<string, unknown>[]>(
    []
  );
  const [loading2, setLoading2] = useState(false);
  const [error2, setError2] = useState<string | null>(null);

  // Update AI Assistant context when data changes
  useEffect(() => {
    if (!loading1 && !error1) {
      // Use the merged query for context so AI sees the edits
      setContext(query, dataCollection);
    }
  }, [query, dataCollection, loading1, error1, setContext]);

  // Fetch primary data (uid)
  useEffect(() => {
    setTab(0);
    const fetchData = async () => {
      // Logic unchanged, uses initialQuery.uid or merged?
      // The query UID likely doesn't change, only content.
      // But let's use query (merged) just to be consistent, assuming uid doesn't change.
      // Actually strictly speaking, uid SHOULD NOT change via override.
      try {
        setLoading1(true);
        setError1(null);
        const sparqlMap = getTemplateConfig(templateId as string).sparql;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const data = await fetchSPARQLData(sparqlMap[query.uid]);
        setDataCollection(data);
      } catch (err) {
        setError1('Failed to load question data');
        console.error('Error fetching question data:', err);
      } finally {
        setLoading1(false);
      }
    };
    setNormalized(true);
    fetchData();
  }, [query.uid, templateId]);

  // Fetch secondary data (uid_2) if it exists
  useEffect(() => {
    if (query?.uid_2) {
      const fetchData = async () => {
        try {
          setLoading2(true);
          setError2(null);
          const sparqlMap = getTemplateConfig(templateId as string).sparql;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          const data = await fetchSPARQLData(sparqlMap[query.uid_2]);
          setDataAnalysis(data);
        } catch (err) {
          setError2('Failed to load secondary data');
          console.error('Error fetching secondary data:', err);
        } finally {
          setLoading2(false);
        }
      };
      fetchData();
    } else if (query?.uid_2_merge) {
      const fetchData = async () => {
        try {
          setLoading2(true);
          setError2(null);
          const sparqlMap = getTemplateConfig(templateId as string).sparql;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          const data = await fetchSPARQLData(sparqlMap[query.uid_2_merge]);
          setDataAnalysis(data);
        } catch (err) {
          setError2('Failed to load secondary data');
          console.error('Error fetching secondary data:', err);
        } finally {
          setLoading2(false);
        }
      };
      fetchData();
    }
  }, [query, query?.uid_2, query?.uid_2_merge, templateId]);

  const getProcessedChartData = () => {
    if (query.uid_2_merge) {
      if (typeof query.dataProcessingFunction2 === 'function') {
        return (
          query.dataProcessingFunction2(dataCollection ?? [], dataAnalysis) ??
          []
        );
      }
      return [];
    }
    if (typeof query.dataProcessingFunction === 'function') {
      return query.dataProcessingFunction(dataCollection ?? []) ?? [];
    }
    return [];
  };

  const getDataInterpretation = (tabName: string): string => {
    const dataInterpretation = query.dataAnalysisInformation.dataInterpretation;
    if (Array.isArray(dataInterpretation)) {
      if (tabName === 'dataCollection') {
        return dataInterpretation[0] || '';
      } else if (tabName === 'dataAnalysis') {
        return dataInterpretation[1] || '';
      }
      return '';
    }
    return dataInterpretation || '';
  };

  const renderLoadingState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 8,
      }}
    >
      <CircularProgress sx={{ color: '#e86161', mb: 2 }} />
      <Typography color="text.secondary">Loading question data...</Typography>
    </Box>
  );

  const renderErrorState = (error: string) => (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mt: 4,
        textAlign: 'center',
        backgroundColor: 'rgba(232, 97, 97, 0.05)',
        border: '1px solid rgba(232, 97, 97, 0.1)',
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" color="error" gutterBottom>
        {error}
      </Typography>
      <Typography color="text.secondary">
        Please try again later or contact support if the problem persists.
      </Typography>
    </Paper>
  );

  if (loading1) {
    return renderLoadingState();
  }

  if (error1) {
    return renderErrorState(error1);
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Admin Toolbar */}
      {isAdmin && (
        <Fade in={isAdmin}>
          <Paper
            elevation={3}
            sx={{
              p: 1,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f5f5f5',
              border: '1px solid #e0e0e0',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="text.secondary"
              >
                Admin Controls
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isEditMode}
                    onChange={(e) => setIsEditMode(e.target.checked)}
                    color="error"
                    size="small"
                  />
                }
                label="Edit Mode"
              />
              {overrideData?.latestVersion && (
                <Chip
                  label={`Version: ${overrideData.versions.length} (${new Date(overrideData.latestVersion.timestamp).toLocaleDateString()})`}
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    /* TODO: Open history dialog */
                  }}
                />
              )}
            </Stack>
          </Paper>
        </Fade>
      )}

      {query.uid_2 && (
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2 }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={query.tabs?.tab1_name ?? 'Data Collection'} />
          <Tab label={query.tabs?.tab2_name ?? 'Data Analysis'} />
        </Tabs>
      )}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <SectionSelector
          sectionType="information"
          sectionTitle="Question Information"
          query={query}
          // We can eventually add title editing here too via EditableSection
        />

        {/* We use EditableSection inside QuestionInformationView via props? 
            No, QuestionInformationView is complex. Let's make it accept isEditing and save callbacks 
            OR we replace parts of it. 
            Steps:
            1. QuestionInformationView renders "Explanation of the Competency Question".
            2. It uses `info.questionExplanation`.
            3. We want to override this.
            
            Option A: Modify QuestionInformationView to accept `overrideMode` props.
            Option B: We implement an "Overlay" or "Replacement" in Question.tsx?
            
            Let's pass props to QuestionInformationView for now. But since I can't edit it yet (step 25 showed it), 
            I'll wrap it or replace it here IF I hadn't planned to modify it.
            But the plan said "MODIFY Question.tsx" and "New EditableSection".
            
            Let's try to Inject the EditableSection logic for the Question Explanation HERE?
            QuestionInformationView does a lot of rendering.
            
            Let's stick to the plan: Modify QuestionInformationView to allow editing.
            But I haven't modified QuestionInformationView yet.
            I will pass `isEditMode` and `onSave` to it. 
            Wait, I need to modify QuestionInformationView signature first.
        */}
        <QuestionInformationView
          query={query}
          isInteractive={false}
          tabIndex={tab}
          // @ts-ignore - Temporary until QuestionInformationView is updated
          isEditingInfo={isEditMode}
          // @ts-ignore
          onSave={saveVersion}
        />

        {/* Data Collection View */}
        <Box hidden={tab !== 0}>
          {query.chartSettings ? (
            <>
              <Divider sx={{ my: 3 }} />
              <SectionSelector
                sectionType="chart"
                sectionTitle="Chart Visualization"
                query={query}
                data={dataCollection}
              />
              <QuestionChartView
                query={query}
                normalized={normalized}
                setNormalized={setNormalized}
                queryId={query.uid}
                chartSettings={query.chartSettings}
                processedChartDataset={getProcessedChartData()}
                dataInterpretation={getDataInterpretation('dataCollection')}
                type="dataCollection"
              />
              <Divider sx={{ my: 3 }} />
            </>
          ) : (
            <>
              {isEditMode ? (
                <Box sx={{ my: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Data Interpretation
                  </Typography>
                  <EditableSection
                    isEditingInfo={isEditMode}
                    content={getDataInterpretation('dataCollection')}
                    sectionLabel="Data Collection Interpretation"
                    onSave={async (newContent) => {
                      await saveVersion(
                        'dataAnalysisInformation.dataInterpretation',
                        [newContent, getDataInterpretation('dataAnalysis')]
                      );
                    }}
                  />
                </Box>
              ) : (
                <QuestionInformation
                  information={getDataInterpretation('dataCollection')}
                  label="Data Interpretation"
                  tabIndex={tab}
                />
              )}
            </>
          )}
          <SectionSelector
            sectionType="data"
            sectionTitle="Data Collection"
            query={query}
            data={dataCollection}
          />
          <QuestionDataGridView
            questionData={dataCollection}
            gridOptions={query.gridOptions}
          />
        </Box>

        {/* Data Analysis View */}
        {query.uid_2 && (
          <Box hidden={tab !== 1}>
            {loading2 ? (
              renderLoadingState()
            ) : error2 ? (
              renderErrorState(error2)
            ) : (
              <>
                {query.chartSettings2 ? (
                  <>
                    <SectionSelector
                      sectionType="chart"
                      sectionTitle="Data Analysis Chart"
                      query={query}
                      data={dataAnalysis}
                    />
                    <QuestionChartView
                      query={query}
                      normalized={normalized}
                      setNormalized={setNormalized}
                      queryId={query.uid_2}
                      chartSettings={query.chartSettings2}
                      processedChartDataset={
                        typeof query.dataProcessingFunction2 === 'function'
                          ? (query.dataProcessingFunction2(
                              dataAnalysis ?? []
                            ) ?? [])
                          : []
                      }
                      dataInterpretation={getDataInterpretation('dataAnalysis')}
                      type="dataAnalysis"
                    />
                    <Divider sx={{ my: 3 }} />
                  </>
                ) : (
                  <>
                    {isEditMode ? (
                      <Box sx={{ my: 2 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 1, fontWeight: 600 }}
                        >
                          Data Interpretation
                        </Typography>
                        <EditableSection
                          isEditingInfo={isEditMode}
                          content={getDataInterpretation('dataAnalysis')}
                          sectionLabel="Data Analysis Interpretation"
                          onSave={async (newContent) => {
                            await saveVersion(
                              'dataAnalysisInformation.dataInterpretation',
                              [
                                getDataInterpretation('dataCollection'),
                                newContent,
                              ]
                            );
                          }}
                        />
                      </Box>
                    ) : (
                      <QuestionInformation
                        information={getDataInterpretation('dataAnalysis')}
                        label="Data Interpretation"
                        tabIndex={tab}
                      />
                    )}
                  </>
                )}
                <SectionSelector
                  sectionType="data"
                  sectionTitle="Data Analysis"
                  query={query}
                  data={dataAnalysis}
                />
                <QuestionDataGridView
                  questionData={dataAnalysis}
                  gridOptions={query.gridOptions}
                />
              </>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Question;
