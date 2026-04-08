import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import EditableSection from './EditableSection';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import ChartWrapper from './CustomCharts/ChartWrapper';
import { PREFIXES as EMPIRICAL_PREFIXES } from '../api/SPARQL_QUERIES';
import { PREFIXES as NLP4RE_PREFIXES } from '../api/SPARQL_QUERIES_NLP4RE';
import CodeIcon from '@mui/icons-material/Code';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Query, ChartSetting } from '../constants/queries_chart_info';
import { useLocation } from 'react-router-dom';
import ChartSettingsEditor from './CustomCharts/ChartSettingsEditor';
import type { ChartSettingsOverride } from '../firestore/CRUDStaticQuestionOverrides';
import {
  buildVenueCategorizedDataset,
  getColorsForVenueSeries,
} from '../utils/venueChartDataset';
import type { RawDataItem } from '../constants/data_processing_helper_functions';

interface QuestionChartViewProps {
  query: Query;
  normalized: boolean;
  setNormalized: React.Dispatch<React.SetStateAction<boolean>>;
  categorizeByVenue: boolean;
  setCategorizeByVenue: React.Dispatch<React.SetStateAction<boolean>>;
  /** When false, hide the “by venue” chart control (no venue_name in data or question opts out). */
  showVenueCategorization: boolean;
  queryId: string;
  chartSettings: ChartSetting;
  processedChartDataset: Record<string, unknown>[];
  dataInterpretation: string;
  type: string;
  isEditMode?: boolean;
  onSaveInterpretation?: (newContent: string) => Promise<void>;
  chartKey?: 'chartSettings' | 'chartSettings2';
  onSaveChartSettings?: (
    which: 'chartSettings' | 'chartSettings2',
    settings: ChartSettingsOverride,
    changeDescription?: string
  ) => Promise<void>;
  onFetchOverrides?: () => Promise<void>;
  rawChartData?: Record<string, unknown>[];
}

const QuestionChartView: React.FC<QuestionChartViewProps> = ({
  query,
  normalized,
  setNormalized,
  categorizeByVenue,
  setCategorizeByVenue,
  showVenueCategorization,
  queryId,
  chartSettings,
  processedChartDataset,
  dataInterpretation,
  type,
  isEditMode = false,
  onSaveInterpretation,
  chartKey = 'chartSettings',
  onSaveChartSettings,
  onFetchOverrides,
  rawChartData,
}) => {
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  const [chartEditorOpen, setChartEditorOpen] = useState(false);
  const [previewSettings, setPreviewSettings] =
    useState<ChartSettingsOverride | null>(null);

  const [prefixes, setPrefixes] = useState<string>(EMPIRICAL_PREFIXES);

  const [templateId, setTemplateId] = useState<string>('R186491');
  const location = useLocation();

  useEffect(() => {
    const newTemplateId = location.pathname.split('/')[1];
    setTemplateId(newTemplateId);
    setPrefixes(
      newTemplateId === 'R186491' ? EMPIRICAL_PREFIXES : NLP4RE_PREFIXES
    );
  }, [location.pathname]);

  const effectiveChartSettings = {
    ...chartSettings,
    ...(chartEditorOpen && previewSettings ? previewSettings : {}),
  };

  const venueQueryUid =
    chartKey === 'chartSettings2' && query.uid_2 ? query.uid_2 : query.uid;

  const venueSplit =
    categorizeByVenue &&
    showVenueCategorization &&
    rawChartData &&
    rawChartData.length > 0
      ? buildVenueCategorizedDataset(
          rawChartData as RawDataItem[],
          effectiveChartSettings,
          {
            normalized,
            queryUid: venueQueryUid,
            venueField: effectiveChartSettings.venueFieldKey,
          }
        )
      : null;

  const chartDataset = venueSplit?.dataset ?? processedChartDataset;

  let series = chartSettings.series;
  if (venueSplit) {
    series = venueSplit.series;
  } else if (chartSettings.series.length > 1 && normalized) {
    series = series.map((chart: { dataKey: string }) => ({
      ...chart,
      dataKey: 'normalized_' + chart.dataKey,
    }));
  }

  const venueColors =
    venueSplit &&
    getColorsForVenueSeries(
      venueSplit.series.length,
      effectiveChartSettings.colors
    );

  const chartSettingForWrapper: ChartSetting = {
    ...effectiveChartSettings,
    series,
    ...(venueColors ? { colors: venueColors } : {}),
    ...(venueSplit && effectiveChartSettings.yAxis?.[0]
      ? {
          yAxis: [
            {
              ...effectiveChartSettings.yAxis[0],
              label:
                normalized && !effectiveChartSettings.doesntHaveNormalization
                  ? 'Share (%)'
                  : (effectiveChartSettings.yAxis[0].label ?? 'Count'),
            },
          ],
        }
      : {}),
  };

  const createHeading = (chart: { label: string }) => {
    if (effectiveChartSettings?.seriesHeadingTemplate) {
      return effectiveChartSettings.seriesHeadingTemplate.replace(
        '{label}',
        chart.label
      );
    }
    if (type === 'dataCollection') {
      if (effectiveChartSettings.detailedChartHeading) {
        return effectiveChartSettings.detailedChartHeading.replace(
          '{label}',
          chart.label
        );
      }
      return 'number of ' + chart.label + ' used for data collection';
    } else if (type === 'dataAnalysis') {
      return 'number of ' + chart.label + ' used for data analysis';
    }
  };

  const handlePreviousChart = () => {
    setCurrentChartIndex((prev) => (prev > 0 ? prev - 1 : series.length - 1));
  };

  const handleNextChart = () => {
    setCurrentChartIndex((prev) => (prev < series.length - 1 ? prev + 1 : 0));
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#e86161',
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.2rem' },
          }}
        >
          Data Interpretation
        </Typography>
        {isEditMode && onSaveChartSettings && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={async () => {
              if (onFetchOverrides) await onFetchOverrides();
              setChartEditorOpen(true);
            }}
            sx={{
              borderColor: '#e86161',
              color: '#e86161',
              '&:hover': {
                borderColor: '#d45151',
                backgroundColor: 'rgba(232, 97, 97, 0.04)',
              },
            }}
          >
            Edit chart settings
          </Button>
        )}
      </Box>

      {/* Main Chart Section */}
      <>
        <Box sx={{ mb: 3 }}>
          <ChartParamsSelector
            normalized={normalized}
            setNormalized={setNormalized}
            query={query}
            categorizeByVenue={categorizeByVenue}
            setCategorizeByVenue={setCategorizeByVenue}
            showVenueCategorization={showVenueCategorization}
            hideNormalization={!!effectiveChartSettings.doesntHaveNormalization}
          />
        </Box>
        <ChartWrapper
          key={`${queryId}-chart`}
          question_id={queryId}
          dataset={chartDataset}
          chartSetting={chartSettingForWrapper}
          normalized={normalized}
          loading={false}
          defaultChartType={query.chartType ?? 'bar'}
          availableCharts={['bar', 'pie']}
        />
      </>

      {/* Charts Section */}
      {series.length > 1 &&
        !effectiveChartSettings.hideDetailedCharts &&
        !venueSplit && (
          <>
            <Typography
              variant="h5"
              sx={{
                mb: 3,
                color: '#e86161',
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              Detailed Charts
            </Typography>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 400,
              }}
            >
              <IconButton
                onClick={handlePreviousChart}
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'grey.100' },
                  zIndex: 1,
                }}
                aria-label="Previous chart"
              >
                <ArrowBackIosNewIcon />
              </IconButton>
              <Box
                sx={{
                  width: { xs: '90vw', sm: 900, md: 1300 },
                  maxWidth: 800,
                  mx: 'auto',
                }}
              >
                <ChartWrapper
                  question_id={queryId}
                  dataset={chartDataset}
                  chartSetting={{
                    ...effectiveChartSettings,
                    series: [series[currentChartIndex]],
                    heading: effectiveChartSettings.noHeadingInSeries
                      ? ''
                      : createHeading(series[currentChartIndex]),
                    colors: [
                      effectiveChartSettings.colors?.[currentChartIndex] ??
                        '#e86161',
                    ],
                    yAxis: [
                      {
                        label: chartSettings.yAxis?.[0]?.label,
                        dataKey: series[currentChartIndex].dataKey,
                      },
                    ],
                  }}
                  normalized={normalized}
                  loading={false}
                  defaultChartType={query.chartType ?? 'bar'}
                  availableCharts={['bar', 'pie']}
                  isSubChart={true}
                />
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                    mt: 2,
                    textAlign: 'center',
                  }}
                >
                  {currentChartIndex + 1} of {series.length}
                </Typography>
              </Box>
              <IconButton
                onClick={handleNextChart}
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'white',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'grey.100' },
                  zIndex: 1,
                }}
                aria-label="Next chart"
              >
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>
          </>
        )}
      {isEditMode && onSaveInterpretation ? (
        <EditableSection
          isEditingInfo={isEditMode}
          content={dataInterpretation}
          sectionLabel="Data Interpretation"
          onSave={onSaveInterpretation}
          isHtml={true}
          multiline={true}
        />
      ) : (
        <Box
          component="div"
          sx={{
            '& p': {
              fontSize: { xs: '0.95rem', sm: '1rem' },
              lineHeight: 1.7,
              color: 'text.primary',
              mt: 4,
              mb: 4,
            },
            '& a': {
              color: '#e86161',
              textDecoration: 'none',
              fontWeight: 500,
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            '& strong': {
              color: 'text.primary',
              fontWeight: 600,
            },
          }}
          dangerouslySetInnerHTML={{
            __html: dataInterpretation,
          }}
        />
      )}

      <Box>
        {templateId === 'R186491' && (
          <Button
            href={`https://mybinder.org/v2/gh/okarras/EmpiRE-Analysis/HEAD?labpath=%2Fempire-analysis.ipynb`}
            target="_blank"
            sx={{
              color: '#e86161',
              mt: { xs: 2, sm: 0 },
              '&:hover': {
                color: '#b33a3a',
              },
            }}
            variant="outlined"
          >
            <CodeIcon sx={{ mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Check and edit the code in Binder
            </Typography>
          </Button>
        )}
        <Button
          href={`https://orkg.org/sparql#${encodeURIComponent(prefixes + query.sparqlQuery)}`}
          target="_blank"
          sx={{
            color: '#e86161',
            mt: { xs: 2, sm: 0 },
            ml: 2,
            '&:hover': {
              color: '#b33a3a',
            },
          }}
          variant="outlined"
        >
          <LiveHelpIcon sx={{ mr: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            SPARQL Query
          </Typography>
        </Button>
      </Box>

      {onSaveChartSettings && (
        <ChartSettingsEditor
          open={chartEditorOpen}
          onClose={() => {
            setChartEditorOpen(false);
            setPreviewSettings(null);
          }}
          chartSettings={chartSettings}
          chartKey={chartKey}
          onSave={onSaveChartSettings}
          onPreviewChange={setPreviewSettings}
          onOpen={onFetchOverrides}
        />
      )}
    </Box>
  );
};

export default QuestionChartView;
