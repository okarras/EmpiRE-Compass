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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import LabelIcon from '@mui/icons-material/Label';
import HubIcon from '@mui/icons-material/Hub';
import StatisticsPageLoadingSkeleton from '../components/StatisticsPageLoadingSkeleton';
import CRUDStatistics from '../firestore/CRUDStatistics';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
// import CustomGaugeChart from '../components/CustomCharts/CustomGaugeChart';
// import StatsChartTypeSelector from '../components/CustomCharts/StatsChartTypeSelector';

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
};

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData>(DEFAULT_STATS);
  // const [chartType, setChartType] = useState<'gauge' | 'card'>('gauge');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.all(
          Object.values(STATISTICS_SPARQL_QUERIES).map((query) =>
            fetchSPARQLData(query)
          )
        );

        const [paperData, , , , , perVenueData, venuesData] = results;

        setStatistics({
          ...statistics,
          paperCount: Number(paperData[0]?.paper_count ?? 0),

          perVenueData: perVenueData.map((row: VenueData) => ({
            venue: row.venue,
            paperCount: Number(row.paperCount ?? 0),
          })),
          venueCount: Number(venuesData[0]?.venueCount ?? 0),
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
        {/* <StatsChartTypeSelector
          chartType={chartType}
          setChartType={setChartType}
        /> */}

        {/* {chartType === 'gauge' ? (
          <Stack direction="row" flexWrap="wrap" spacing={3} useFlexGap mb={4}>
            <CustomGaugeChart label="Papers" value={paperCount} />
            <CustomGaugeChart label="Venues" value={venueCount} />
            <CustomGaugeChart label="Resources" value={resources} />
            <CustomGaugeChart label="Literals" value={literals} />
            <CustomGaugeChart label="Properties" value={predicates} />
            <CustomGaugeChart label="Distinct Resources" value={statistics.distinctResources} />
            <CustomGaugeChart label="Distinct Literals" value={statistics.distinctLiterals} />
            <CustomGaugeChart label="Distinct Properties" value={statistics.distinctPredicates} />
          </Stack>
        ) : ( */}
        <Stack direction="row" flexWrap="wrap" spacing={3} useFlexGap mb={4}>
          <StatCard value={paperCount} label="Papers">
            <FeedIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard value={venueCount} label="Venues">
            <LocationOnIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard value={total_resources} label="Resources">
            <BubbleChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard value={total_literals} label="Literals">
            <LabelIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard value={total_predicates} label="Properties">
            <AccountTreeIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard value={total_statements} label="Total Statements">
            <HubIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard
            value={global_distinct_resources}
            label="Distinct Resources"
          >
            <BubbleChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard value={global_distinct_literals} label="Distinct Literals">
            <LabelIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard
            value={global_distinct_predicates}
            label="Distinct Properties"
          >
            <AccountTreeIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
        </Stack>
        {/* )} */}

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
