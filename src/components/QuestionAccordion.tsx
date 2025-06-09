import {
  AccordionSummary,
  Box,
  Typography,
  Accordion,
  Button,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { Query } from '../constants/queries_chart_info';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import ChartWrapper from './CustomCharts/ChartWrapper';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import fetchSPARQLData from '../helpers/fetch_query';
import QuestionInformation from './QuestionInformation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useNavigate } from 'react-router';

const QuestionAccordion = ({ query }: { query: Query }) => {
  const [normalized, setNormalized] = useState(true);
  const [questionData, setQuestionData] = useState<Record<string, unknown>[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const data = await fetchSPARQLData(SPARQL_QUERIES[query.uid]);
        setQuestionData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (expanded) {
      fetchData();
    }
  }, [query, expanded]);

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  const openQuestionPage = () => {
    navigate(`/questions/${query.id}`);
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={handleAccordionChange}
      sx={{
        width: '100%',
        backgroundColor: 'background.paper',
        borderRadius: (theme) => `${theme.shape.borderRadius}px !important`,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.3)'
            : '0 1px 4px rgba(0, 0, 0, 0.05)',
        transition: (theme) =>
          theme.transitions.create(
            ['box-shadow', 'border-color', 'background-color'],
            { duration: theme.transitions.duration.shorter }
          ),
        '&:before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          margin: '16px 0',
          '&:first-of-type': {
            marginTop: 0,
          },
          '&:last-of-type': {
            marginBottom: 0,
          },
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.4)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'action.hover' : 'background.paper',
        },
      }}
    >
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon
            sx={{
              transition: 'transform 0.3s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              color: expanded ? 'primary.main' : 'text.secondary',
            }}
          />
        }
        sx={{
          padding: { xs: 2, sm: 3 },
          minHeight: 64,
          '& .MuiAccordionSummary-content': {
            margin: '0',
            gap: 2,
            alignItems: 'center',
          },
          '&.Mui-expanded': {
            minHeight: 64,
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            transition: (theme) => theme.transitions.create('color'),
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
            fontWeight: 600,
            color: expanded ? 'primary.main' : 'text.primary',
            flex: 1,
            lineHeight: 1.4,
          }}
        >
          {`${query.id}. ${query.dataAnalysisInformation.question}`}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            minWidth: 'fit-content',
          }}
        >
          <Button
            startIcon={<BarChartIcon />}
            variant="outlined"
            onClick={openQuestionPage}
            sx={{
              color: '#e86161',
              borderColor: '#e86161',
              marginLeft: '10px',
              minWidth: '15vw',
              '&:hover': {
                backgroundColor: '#e86161',
                color: 'white',
                borderColor: '#e86161',
              },
              '&.MuiButton-outlined': {
                borderColor: '#e86161',
              },
            }}
            size="small"
          >
            Question Information
          </Button>
        </Box>
      </AccordionSummary>

      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 2 },
        }}
      >
        <QuestionInformation
          information={query.dataAnalysisInformation.requiredDataForAnalysis}
          label="Required Data for Analysis"
        />
        <QuestionInformation
          information={query.dataAnalysisInformation.dataInterpretation}
          label="Data Interpretation"
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mt: 2,
          }}
        >
          {query.chartSettings && query.dataProcessingFunction && (
            <>
              <ChartParamsSelector
                normalized={normalized}
                setNormalized={setNormalized}
                query={query}
              />
              <ChartWrapper
                key={`${query.uid}-chart`}
                question_id={query.uid}
                dataset={query.dataProcessingFunction([...questionData]) ?? []}
                chartSetting={query.chartSettings}
                normalized={normalized}
                loading={loading}
                defaultChartType={query.chartType ?? 'bar'}
                availableCharts={['bar', 'pie']}
              />
            </>
          )}
        </Box>
      </Box>
    </Accordion>
  );
};

export default QuestionAccordion;
