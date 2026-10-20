import React, { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
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
  Button,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import QuestionExportDialog from './QuestionExportDialog';

import fetchSPARQLData from '../helpers/fetch_query';
import QuestionInformationView from './QuestionInformationView';
import QuestionChartView from './QuestionChartView';
import QuestionDataGridView from './QuestionDataGridView';
import SectionSelector from './SectionSelector';
import { useAIAssistantContext } from '../context/AIAssistantContext';
import { useParams } from 'react-router-dom';
import QuestionInformation from './QuestionInformation';
import { useQuestionOverrides } from '../hooks/useQuestionOverrides';
import EditableSection from './EditableSection';
import { useBackupChange } from '../hooks/useBackupChange';
import QuestionVersionHistoryDialog from './QuestionVersionHistoryDialog';
import { exportQuestion } from '../utils/exportQuestion';
import { toast } from 'react-hot-toast';

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
    saveChartSettings,
    fetchOverrides,
    overrideData,
    historyOpen,
    setHistoryOpen,
    handleRestore,
  } = useQuestionOverrides({ query: initialQuery });

  // Tabs state
  const [tab, setTab] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportingCharts, setExportingCharts] = useState(false);
  const { setContext } = useAIAssistantContext();
  const { templateId } = useParams();
  const backupVersion = useBackupChange(); // Listen for backup changes

  // State for primary data (uid)
  const [dataCollection, setDataCollection] = useState<
    Record<string, unknown>[]
  >([]);
  const [loading1, setLoading1] = useState(true);
  const [error1, setError1] = useState<string | null>(null);
  const [normalized, setNormalized] = useState(true);
  const [categorizeByVenue, setCategorizeByVenue] = useState(false);

  // State for secondary data (uid_2 if exists)
  const [dataAnalysis, setDataAnalysis] = useState<Record<string, unknown>[]>(
    []
  );
  const [loading2, setLoading2] = useState(false);
  const [error2, setError2] = useState<string | null>(null);

  // Update AI Assistant context when data changes
  useEffect(() => {
    if (!loading1 && !error1) {
      setContext(query, dataCollection);
    }
  }, [query, dataCollection, loading1, error1, setContext]);

  useEffect(() => {
    setCategorizeByVenue(
      !!(
        query.chartSettings?.categoryByVenue ||
        query.chartSettings2?.categoryByVenue
      )
    );
  }, [
    query.uid,
    query.chartSettings?.categoryByVenue,
    query.chartSettings2?.categoryByVenue,
  ]);

  const mergedRawForVenue = useMemo(() => {
    if (!query.uid_2_merge || !dataCollection.length || !dataAnalysis.length) {
      return undefined;
    }
    return dataCollection.map((item) => {
      const item2 = dataAnalysis.find(
        (i2) => i2.paper === item.paper && i2.year === item.year
      );
      return { ...item, ...item2 };
    });
  }, [query.uid_2_merge, dataCollection, dataAnalysis]);

  const rawChartDataCollection = query.uid_2_merge
    ? mergedRawForVenue
    : dataCollection;

  const hasVenueInCollectionData = !!rawChartDataCollection?.some(
    (r) => r.venue_name != null && String(r.venue_name).trim() !== ''
  );
  const hasVenueInAnalysisData = !!dataAnalysis?.some(
    (r) => r.venue_name != null && String(r.venue_name).trim() !== ''
  );

  // Fetch primary data (uid)
  useEffect(() => {
    // Reset state when query changes
    setTab(0);
    setNormalized(true);
    setError1(null);
    setError2(null);
    setDataCollection([]);
    setDataAnalysis([]);

    const fetchData = async () => {
      try {
        setLoading1(true);
        setError1(null);
        const sparql = query.sparqlQuery;
        if (!sparql) {
          setDataCollection([]);
          return;
        }

        const data = await fetchSPARQLData(sparql);
        setDataCollection(data);
      } catch (err) {
        setError1('Failed to load question data');
        console.error('Error fetching question data:', err);
      } finally {
        setLoading1(false);
      }
    };
    fetchData();
  }, [query.uid, templateId, backupVersion, query.sparqlQuery]); // Re-fetch when backup changes

  // Fetch secondary data (uid_2) if it exists
  useEffect(() => {
    // Reset secondary data state when query changes
    setDataAnalysis([]);
    setError2(null);
    setLoading2(false);

    if (query?.uid_2 && query.sparqlQuery2) {
      const fetchData = async () => {
        try {
          setLoading2(true);
          setError2(null);

          const data = await fetchSPARQLData(query.sparqlQuery2!);
          setDataAnalysis(data);
        } catch (err) {
          setError2('Failed to load secondary data');
          console.error('Error fetching secondary data:', err);
        } finally {
          setLoading2(false);
        }
      };
      fetchData();
    } else if (query?.uid_2_merge && query.sparqlQuery2) {
      const fetchData = async () => {
        try {
          setLoading2(true);
          setError2(null);

          const data = await fetchSPARQLData(query.sparqlQuery2!);
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
  }, [
    query.uid,
    query?.uid_2,
    query?.uid_2_merge,
    templateId,
    backupVersion,
    query.sparqlQuery2,
  ]); // Re-fetch when backup changes

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

  const getCurrentChartSvg = (source?: SVGSVGElement): string | null => {
    const queryId = tab === 1 ? query.uid_2 : query.uid;

    const svg =
      source ??
      document.getElementById(`chart-${queryId}`)?.querySelector('svg');

    if (!svg) {
      toast.error('No chart found.');
      return null;
    }

    const copy = svg.cloneNode(true) as SVGSVGElement;
    const originals = [svg, ...svg.querySelectorAll('*')];
    const copies = [copy, ...copy.querySelectorAll('*')];

    originals.forEach((element, index) => {
      const style = getComputedStyle(element);
      const target = copies[index] as SVGElement;

      [
        'fill',
        'stroke',
        'font-size',
        'font-family',
        'font-weight',
        'text-anchor',
        'dominant-baseline',
        'pointer-events',
      ].forEach((property) => {
        target.style.setProperty(property, style.getPropertyValue(property));
      });
    });

    const hoverStyle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'style'
    );

    hoverStyle.textContent = `
  .MuiBarElement-root {
    transition: filter 150ms ease;
  }

  .MuiBarElement-root:hover {
    filter: brightness(0.75);
  }
`;

    copy.prepend(hoverStyle);

    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    return new XMLSerializer().serializeToString(copy);
  };

  const getCurrentChartsHtml = (): string | null => {
    const queryId = tab === 1 ? query.uid_2 : query.uid;
    const svgs = document
      .getElementById(`question-charts-${queryId}`)
      ?.querySelectorAll<SVGSVGElement>('[id^="chart-"] svg');

    if (!svgs?.length) {
      toast.error('No charts found.');
      return null;
    }

    return Array.from(svgs)
      .map((svg, index) => {
        const heading = document.createElement('h3');
        heading.textContent =
          svg
            .closest('[id^="chart-"]')
            ?.querySelector('h4, h6')
            ?.textContent?.trim() ?? '';

        const content = getCurrentChartSvg(svg);
        if (!content) {
          throw new Error('Chart could not be copied.');
        }

        return `
  <figure
    class="report-chart"
    data-chart-kind="${index === 0 ? 'main' : 'detail'}"
  >
    ${heading.textContent ? heading.outerHTML : ''}
    ${content}
  </figure>
`;
      })
      .join('\n');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => setExportOpen(true)}
        >
          Export
        </Button>
      </Box>

      <QuestionExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={
          templateId
            ? async (sections, format) => {
                if (exportingCharts) return;

                try {
                  let chartSvg: string | undefined;

                  if (format !== 'txt' && sections.charts) {
                    flushSync(() => setExportingCharts(true));

                    await new Promise<void>((resolve) => {
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => resolve());
                      });
                    });

                    const charts = getCurrentChartsHtml();
                    if (charts === null) return;
                    chartSvg = charts;
                  }

                  await exportQuestion(
                    query,
                    templateId,
                    tab,
                    sections,
                    format,
                    chartSvg
                  );

                  setExportOpen(false);
                } catch (error) {
                  console.error('Question export failed:', error);
                  toast.error('Export failed. Please try again.');
                } finally {
                  setExportingCharts(false);
                }
              }
            : undefined
        }
      />
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
                  onClick={() => setHistoryOpen(true)}
                  sx={{ cursor: 'pointer' }}
                />
              )}
            </Stack>
          </Paper>
        </Fade>
      )}

      <QuestionVersionHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        overrideData={overrideData}
        onRestore={handleRestore}
      />

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

        <QuestionInformationView
          query={query}
          isInteractive={false}
          tabIndex={tab}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Temporary until QuestionInformationView is updated
          isEditingInfo={isEditMode}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
                showAllDetailedCharts={exportingCharts}
                query={query}
                normalized={normalized}
                setNormalized={setNormalized}
                categorizeByVenue={categorizeByVenue}
                setCategorizeByVenue={setCategorizeByVenue}
                showVenueCategorization={
                  hasVenueInCollectionData && query.venue !== false
                }
                queryId={query.uid}
                chartSettings={query.chartSettings}
                processedChartDataset={getProcessedChartData()}
                rawChartData={rawChartDataCollection}
                dataInterpretation={getDataInterpretation('dataCollection')}
                type="dataCollection"
                isEditMode={isEditMode}
                chartKey="chartSettings"
                onSaveInterpretation={
                  isEditMode
                    ? async (newContent) => {
                        await saveVersion(
                          'dataAnalysisInformation.dataInterpretation',
                          [newContent, getDataInterpretation('dataAnalysis')]
                        );
                      }
                    : undefined
                }
                onSaveChartSettings={
                  isEditMode
                    ? async (which, settings, desc) => {
                        await saveChartSettings(which, settings, desc);
                      }
                    : undefined
                }
                onFetchOverrides={isEditMode ? fetchOverrides : undefined}
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
                      showAllDetailedCharts={exportingCharts}
                      query={query}
                      normalized={normalized}
                      setNormalized={setNormalized}
                      categorizeByVenue={categorizeByVenue}
                      setCategorizeByVenue={setCategorizeByVenue}
                      showVenueCategorization={
                        hasVenueInAnalysisData && query.venue !== false
                      }
                      queryId={query.uid_2}
                      chartSettings={query.chartSettings2}
                      processedChartDataset={
                        typeof query.dataProcessingFunction2 === 'function'
                          ? (query.dataProcessingFunction2(
                              dataAnalysis ?? []
                            ) ?? [])
                          : []
                      }
                      rawChartData={dataAnalysis}
                      dataInterpretation={getDataInterpretation('dataAnalysis')}
                      type="dataAnalysis"
                      isEditMode={isEditMode}
                      chartKey="chartSettings2"
                      onSaveInterpretation={
                        isEditMode
                          ? async (newContent) => {
                              await saveVersion(
                                'dataAnalysisInformation.dataInterpretation',
                                [
                                  getDataInterpretation('dataCollection'),
                                  newContent,
                                ]
                              );
                            }
                          : undefined
                      }
                      onSaveChartSettings={
                        isEditMode
                          ? async (which, settings, desc) => {
                              await saveChartSettings(which, settings, desc);
                            }
                          : undefined
                      }
                      onFetchOverrides={isEditMode ? fetchOverrides : undefined}
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
