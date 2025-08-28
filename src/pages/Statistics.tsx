import { useState, useEffect } from 'react';
import {
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Divider,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../utils/theme';
import fetchSPARQLData from '../helpers/fetch_query';
import STATISTICS_SPARQL_QUERIES from '../api/STATISTICS_SPARQL_QUERIES';
import StatCard from '../components/StatCard';
import FeedIcon from '@mui/icons-material/Feed';
// import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import FlagIcon from '@mui/icons-material/Flag';
import StorageIcon from '@mui/icons-material/Storage';
import BarChartIcon from '@mui/icons-material/BarChart';
import StatisticsPageLoadingSkeleton from '../components/StatisticsPageLoadingSkeleton';
import CRUDStatistics from '../firestore/CRUDStatistics';
import CustomGaugeChart from '../components/CustomCharts/CustomGaugeChart';
import StatsChartTypeSelector from '../components/CustomCharts/StatsChartTypeSelector';

interface VenueData {
  venue: string;
  paperCount: number;
}

interface StatisticsData {
  paperCount: number;
  tripleCount: number;
  total_resources: number;
  total_literals: number;
  total_predicates: number;
  total_statements: number;
  perVenueData: Array<VenueData>;
  venueCount: number;
  global_distinct_resources: number;
  global_distinct_literals: number;
  global_distinct_predicates: number;
  answeredCQs: number;
  averageEmpiricalPerYear: number;
  maxEmpiricalPerYear: number;
}

const DEFAULT_STATS: StatisticsData = {
  paperCount: 0,
  tripleCount: 0,
  total_resources: 0,
  total_literals: 0,
  total_predicates: 0,
  total_statements: 0,
  perVenueData: [],
  venueCount: 0,
  global_distinct_resources: 0,
  global_distinct_literals: 0,
  global_distinct_predicates: 0,
  answeredCQs: 0,
  averageEmpiricalPerYear: 0,
  maxEmpiricalPerYear: 0,
};

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData>(DEFAULT_STATS);
  const [chartType, setChartType] = useState<'gauge' | 'card'>('gauge');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.all(
          Object.values(STATISTICS_SPARQL_QUERIES).map((query) =>
            fetchSPARQLData(query)
          )
        );

        const [paperData, , , , , perVenueData, venuesData, avgEmpiricalData] =
          results;

        const empiricalCounts = avgEmpiricalData.map(
          (row: { paperCount: string }) => Number(row.paperCount ?? 0)
        );
        const average = empiricalCounts.length
          ? Number(
              (
                empiricalCounts.reduce((a: number, b: number) => a + b, 0) /
                empiricalCounts.length
              ).toFixed(2)
            )
          : 0;
        const maxEmpiricalPerYear = Math.max(...empiricalCounts);

        setStatistics({
          ...statistics,
          paperCount: Number(paperData[0]?.paper_count ?? 0),

          perVenueData: perVenueData.map((row: VenueData) => ({
            venue: row.venue,
            paperCount: Number(row.paperCount ?? 0),
          })),

          venueCount: Number(venuesData[0]?.venueCount ?? 0),

          averageEmpiricalPerYear: average,
          maxEmpiricalPerYear,
        });
      } catch (error) {
        console.error('Error fetching SPARQL statistics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData().then(() => {
      CRUDStatistics.getStatistics().then((statisticsValues) => {
        Object.keys(statisticsValues[0]).forEach((key) => {
          setStatistics((prev) => ({
            ...prev,
            [key]: statisticsValues[0][key],
          }));
        });
      });
    });
  }, []);

  if (loading) return <StatisticsPageLoadingSkeleton />;

  const {
    paperCount,
    total_resources,
    total_literals,
    total_predicates,
    total_statements,
    venueCount,
    perVenueData: papersPerVenue,
    global_distinct_resources,
    global_distinct_literals,
    global_distinct_predicates,
  } = statistics;

  return (
    <ThemeProvider theme={theme}>
      <Container sx={{ mt: 8, height: '100vh' }}>
        <StatsChartTypeSelector
          chartType={chartType}
          setChartType={setChartType}
        />

        {chartType === 'gauge' ? (
          <Stack direction="row" flexWrap="wrap" spacing={3} useFlexGap mb={4}>
            <CustomGaugeChart label="Papers" value={paperCount} />
            <CustomGaugeChart label="Venues" value={venueCount} />
            <CustomGaugeChart label="Resources" value={total_resources} />
            <CustomGaugeChart label="Literals" value={total_literals} />
            <CustomGaugeChart label="Properties" value={total_predicates} />
            <CustomGaugeChart
              label="Distinct Resources"
              value={global_distinct_resources}
            />
            <CustomGaugeChart
              label="Distinct Literals"
              value={global_distinct_literals}
            />
            <CustomGaugeChart
              label="Distinct Properties"
              value={global_distinct_predicates}
            />
            <CustomGaugeChart
              label="Avg. Empirical Papers per Year"
              value={statistics.averageEmpiricalPerYear}
              maxValue={statistics.maxEmpiricalPerYear}
            />
          </Stack>
        ) : (
          <Stack direction="row" flexWrap="wrap" spacing={3} useFlexGap mb={4}>
            <StatCard value={paperCount} label="Papers">
              <FeedIcon sx={{ fontSize: 40, color: '#c0392b' }} />
            </StatCard>
            <StatCard value={venueCount} label="Venues">
              <FlagIcon sx={{ fontSize: 40, color: '#c0392b' }} />
            </StatCard>
            <StatCard value={total_resources} label="Resources">
              <StorageIcon sx={{ fontSize: 40, color: '#c0392b' }} />
            </StatCard>
            <StatCard value={total_literals} label="Literals">
              <BarChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
            </StatCard>
            <StatCard value={total_predicates} label="Properties">
              <BarChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
            </StatCard>
            <StatCard value={total_statements} label="Total Statements">
              <StorageIcon sx={{ fontSize: 40, color: '#c0392b' }} />
            </StatCard>
            <StatCard
              value={global_distinct_resources}
              label="Distinct Resources"
            >
              <BarChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
            </StatCard>
            <StatCard
              value={global_distinct_literals}
              label="Distinct Literals"
            >
              <BarChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
            </StatCard>
            <StatCard
              value={global_distinct_predicates}
              label="Distinct Properties"
            >
              <BarChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
            </StatCard>
          </Stack>
        )}

        <Divider sx={{ mt: 2 }} />

        <Paper elevation={1} sx={{ p: 3, borderRadius: 3, mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            Papers per Venue
          </Typography>
          {papersPerVenue.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Venue</TableCell>
                    <TableCell align="right">Paper Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {papersPerVenue.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.venue}</TableCell>
                      <TableCell align="right">{row.paperCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No venue details available.</Typography>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
