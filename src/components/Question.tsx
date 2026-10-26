import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import HeaderExportAction from './HeaderExportAction';

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
import {
  exportQuestion,
  serializeChartSvg,
  getExportChartModes,
  type ExportChartGroup,
  type ExportChartMode,
  type ExportSections,
  type ExportFormat,
  type QuestionHtmlExport,
} from '../utils/exportQuestion';
import { toast } from 'react-hot-toast';

interface QuestionProps {
  query: Query;
  reportExport?: {
    sections: ExportSections;
    format?: ExportFormat;
    chartMode?: ExportChartMode;
    onComplete: (question: QuestionHtmlExport) => void;
    onError: (error: unknown) => void;
  };
}

const Question: React.FC<QuestionProps> = ({
  query: initialQuery,
  reportExport,
}) => {
  // Use overrides hook
  const {
    mergedQuery: query,
    loading: loadingOverrides,
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

  const exportStarted = useRef(false);
  const chartRoot = useRef<HTMLDivElement>(null);

  // Tabs state
  const [tab, setTab] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportingCharts, setExportingCharts] = useState<ExportFormat | null>(
    null
  );
  const textOnlyReport = reportExport?.format === 'txt';
  const mainChartsOnly =
    reportExport?.format === 'pdf' ||
    reportExport?.format === 'docx' ||
    exportingCharts === 'pdf' ||
    exportingCharts === 'docx';
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
    if (!reportExport && !loading1 && !error1) {
      setContext(query, dataCollection);
    }
  }, [query, dataCollection, loading1, error1, setContext, reportExport]);

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

    if (textOnlyReport) {
      setLoading1(false);
      return;
    }

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
  }, [query.uid, templateId, backupVersion, query.sparqlQuery, textOnlyReport]); // Re-fetch when backup changes

  // Fetch secondary data (uid_2) if it exists
  useEffect(() => {
    // Reset secondary data state when query changes
    setDataAnalysis([]);
    setError2(null);
    setLoading2(false);

    if (textOnlyReport) return;

    if ((query.uid_2 || query.uid_2_merge) && query.sparqlQuery2) {
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
    textOnlyReport,
  ]); // Re-fetch when backup changes

  const processedChartDataCollection = useMemo(() => {
    if (textOnlyReport) return [];
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
  }, [query, dataCollection, dataAnalysis, textOnlyReport]);

  const processedChartDataAnalysis = useMemo(
    () =>
      !textOnlyReport &&
      query.uid_2 &&
      typeof query.dataProcessingFunction2 === 'function'
        ? (query.dataProcessingFunction2(dataAnalysis ?? []) ?? [])
        : [],
    [query, dataAnalysis, textOnlyReport]
  );

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

  const getCurrentChartSvg = (source?: SVGSVGElement): string | null => {
    const queryId = tab === 1 ? query.uid_2 : query.uid;

    const svg =
      source ??
      chartRoot.current
        ?.querySelector(`[id="chart-${queryId}"]`)
        ?.querySelector('svg');

    if (!svg) {
      toast.error('No chart found.');
      return null;
    }

    return serializeChartSvg(svg);
  };

  const getCurrentChartsHtml = (
    tabIndex = tab,
    mainOnly = false
  ): string | null => {
    const queryId = tabIndex === 1 ? query.uid_2 : query.uid;
    const svgs = chartRoot.current
      ?.querySelector(`[id="question-charts-${queryId}"]`)
      ?.querySelectorAll<SVGSVGElement>('[id^="chart-"] svg');

    if (!svgs?.length) {
      toast.error('No charts found.');
      return null;
    }

    return Array.from(svgs)
      .slice(0, mainOnly ? 1 : undefined)
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

  const handleExport = async (
    sections: ExportSections,
    format: ExportFormat
  ) => {
    if (exportingCharts) return;
    const originalNormalized = normalized;
    const originalTab = tab;

    try {
      if (!templateId) throw new Error('No theme selected.');
      let chartSvg: string | undefined;
      const chartGroups: ExportChartGroup[] = [];

      if (format !== 'txt' && sections.charts) {
        const imageExport = format === 'svg' || format === 'png';
        const allTabsExport = imageExport || format === 'html';
        const tabs = allTabsExport
          ? [0, ...(query.uid_2 ? [1] : [])]
          : [originalTab];

        for (const tabIndex of tabs) {
          const chartSettings =
            tabIndex === 1 ? query.chartSettings2 : query.chartSettings;

          if (allTabsExport && !chartSettings) continue;
          if (
            allTabsExport &&
            (tabIndex === 1 ? loading2 || error2 : loading1 || error1)
          ) {
            throw new Error('Chart data is not ready for all tabs.');
          }

          const modes = allTabsExport
            ? getExportChartModes(
                query,
                tabIndex,
                imageExport ? 'both' : (reportExport?.chartMode ?? 'both'),
                imageExport ? false : originalNormalized
              )
            : [originalNormalized];

          for (const relative of modes) {
            flushSync(() => {
              setExportingCharts(format);
              setTab(tabIndex);
              setNormalized(relative);
            });

            // A newly visible tab first reports its size through ResizeObserver.
            // React Spring applies the final bar geometry in subsequent frames.
            let previousGeometry = '';
            let stableFrames = 0;
            for (let frame = 0; frame < 30; frame += 1) {
              await new Promise<void>((resolve) => {
                requestAnimationFrame(() => resolve());
              });
              const queryId = tabIndex === 1 ? query.uid_2 : query.uid;
              const bars = chartRoot.current?.querySelectorAll<SVGRectElement>(
                `[id="question-charts-${queryId}"] .MuiBarElement-root`
              );
              const sizes = Array.from(bars ?? [], (bar) => {
                const style = getComputedStyle(bar);
                return [style.width, style.height, style.transform];
              });
              const geometry = JSON.stringify(sizes);
              stableFrames =
                geometry === previousGeometry ? stableFrames + 1 : 0;
              previousGeometry = geometry;
              if (
                frame >= 2 &&
                stableFrames >= 2 &&
                (!sizes.length ||
                  sizes.some(
                    ([width, height]) =>
                      Number.parseFloat(width) > 0 &&
                      Number.parseFloat(height) > 0
                  ))
              )
                break;
            }

            const charts = getCurrentChartsHtml(
              tabIndex,
              format === 'pdf' ||
                format === 'docx' ||
                reportExport?.format === 'pdf' ||
                reportExport?.format === 'docx'
            );
            if (charts === null) throw new Error('Chart capture failed.');

            if (allTabsExport) {
              chartGroups.push({
                tabIndex,
                normalized: relative,
                html: charts,
              });
            } else {
              chartSvg = charts;
            }
          }
        }

        flushSync(() => {
          setTab(originalTab);
          setNormalized(originalNormalized);
        });
      }

      if (reportExport) {
        reportExport.onComplete({ query, chartGroups });
      } else {
        await exportQuestion(
          query,
          templateId,
          tab,
          sections,
          format,
          originalNormalized,
          chartSvg,
          chartGroups
        );
      }
      setExportOpen(false);
    } catch (error) {
      console.error('Question export failed:', error);
      if (reportExport) reportExport.onError(error);
      else toast.error('Export failed. Please try again.');
    } finally {
      setTab(originalTab);
      setNormalized(originalNormalized);
      setExportingCharts(null);
    }
  };

  useEffect(() => {
    if (
      !reportExport ||
      exportStarted.current ||
      loadingOverrides ||
      loading1 ||
      loading2
    )
      return;
    exportStarted.current = true;
    if (reportExport.sections.charts && (error1 || error2)) {
      reportExport.onError(
        new Error(error1 || error2 || 'Chart data could not be loaded.')
      );
    } else {
      requestAnimationFrame(() => {
        void handleExport(
          reportExport.sections,
          reportExport.format === 'svg' || reportExport.format === 'png'
            ? reportExport.format
            : textOnlyReport
              ? 'txt'
              : 'html'
        );
      });
    }
  });

  const renderQuestionTab = (index: 0 | 1) => {
    const collection = index === 0;
    const data = collection ? dataCollection : dataAnalysis;
    const chartSettings = collection
      ? query.chartSettings
      : query.chartSettings2;
    const type = collection ? 'dataCollection' : 'dataAnalysis';
    const label = collection ? 'Data Collection' : 'Data Analysis';
    const saveInterpretation = async (newContent: string) => {
      await saveVersion(
        'dataAnalysisInformation.dataInterpretation',
        collection
          ? [newContent, getDataInterpretation('dataAnalysis')]
          : [getDataInterpretation('dataCollection'), newContent]
      );
    };

    return (
      <Box key={index} hidden={tab !== index}>
        {!collection && loading2 ? (
          renderLoadingState()
        ) : !collection && error2 ? (
          renderErrorState(error2)
        ) : (
          <>
            {chartSettings ? (
              <>
                {collection && <Divider sx={{ my: 3 }} />}
                <SectionSelector
                  sectionType="chart"
                  sectionTitle={
                    collection ? 'Chart Visualization' : 'Data Analysis Chart'
                  }
                  query={query}
                  data={data}
                />
                <QuestionChartView
                  showAllDetailedCharts={
                    Boolean(exportingCharts) && (!reportExport || tab === index)
                  }
                  query={query}
                  normalized={normalized}
                  setNormalized={setNormalized}
                  categorizeByVenue={categorizeByVenue}
                  setCategorizeByVenue={setCategorizeByVenue}
                  showVenueCategorization={
                    (collection
                      ? hasVenueInCollectionData
                      : hasVenueInAnalysisData) && query.venue !== false
                  }
                  queryId={collection ? query.uid : query.uid_2!}
                  chartSettings={
                    mainChartsOnly
                      ? { ...chartSettings, hideDetailedCharts: true }
                      : chartSettings
                  }
                  processedChartDataset={
                    collection
                      ? processedChartDataCollection
                      : processedChartDataAnalysis
                  }
                  rawChartData={
                    collection ? rawChartDataCollection : dataAnalysis
                  }
                  dataInterpretation={getDataInterpretation(type)}
                  type={type}
                  isEditMode={isEditMode}
                  chartKey={collection ? 'chartSettings' : 'chartSettings2'}
                  onSaveInterpretation={
                    isEditMode ? saveInterpretation : undefined
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
            ) : isEditMode ? (
              <Box sx={{ my: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Data Interpretation
                </Typography>
                <EditableSection
                  isEditingInfo={isEditMode}
                  content={getDataInterpretation(type)}
                  sectionLabel={`${label} Interpretation`}
                  onSave={saveInterpretation}
                />
              </Box>
            ) : (
              <QuestionInformation
                information={getDataInterpretation(type)}
                label="Data Interpretation"
                tabIndex={tab}
              />
            )}
            <SectionSelector
              sectionType="data"
              sectionTitle={label}
              query={query}
              data={data}
            />
            {!reportExport && (
              <QuestionDataGridView
                questionData={data}
                gridOptions={query.gridOptions}
              />
            )}
          </>
        )}
      </Box>
    );
  };

  if (textOnlyReport || (reportExport && !reportExport.sections.charts))
    return null;
  if (loading1) return renderLoadingState();
  if (error1 && !reportExport) return renderErrorState(error1);

  return (
    <Box ref={chartRoot} sx={{ width: '100%' }}>
      {!reportExport && (
        <HeaderExportAction targetId="question-title-export-action">
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setExportOpen(true)}
          >
            Export
          </Button>
        </HeaderExportAction>
      )}

      <QuestionExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={templateId ? handleExport : undefined}
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

        {renderQuestionTab(0)}
        {query.uid_2 && renderQuestionTab(1)}
      </Paper>
    </Box>
  );
};

export default Question;
