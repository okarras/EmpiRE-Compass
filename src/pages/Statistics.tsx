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

interface VenueData {
  venue: string;
  paperCount: number;
}

interface StatisticsData {
  paperCount: number;
  tripleCount: number;
  resources: number;
  literals: number;
  predicates: number;
  perVenueData: Array<VenueData>;
  venueCount: number;
  distinctResources: number;
  distinctLiterals: number;
  distinctPredicates: number;
}

const DEFAULT_STATS: StatisticsData = {
  paperCount: 0,
  tripleCount: 0,
  resources: 0,
  literals: 0,
  predicates: 0,
  perVenueData: [],
  venueCount: 0,
  distinctResources: 0,
  distinctLiterals: 0,
  distinctPredicates: 0,
};

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData>(DEFAULT_STATS);

  useEffect(() => {
    CRUDStatistics.getStatistics().then((statistics) => {
      console.log(statistics);
    });
    const fetchData = async () => {
      try {
        const results = await Promise.all(
          Object.values(STATISTICS_SPARQL_QUERIES).map((query) =>
            fetchSPARQLData(query)
          )
        );

        const [paperData, perVenueData, venuesData] = results;

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

  console.log(statistics);

  if (loading) return <StatisticsPageLoadingSkeleton />;

  const {
    paperCount,
    resources,
    literals,
    predicates,
    venueCount,
    perVenueData: papersPerVenue,
  } = statistics;

  return (
    <ThemeProvider theme={theme}>
      <Container sx={{ mt: 8, height: '100vh' }}>
        <Stack direction="row" flexWrap="wrap" spacing={3} useFlexGap mb={4}>
          <StatCard value={paperCount} label="Papers">
            <FeedIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          {/* <StatCard value={tripleCount} label="Triples">
            <BubbleChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard> */}
          <StatCard value={venueCount} label="Venues">
            <FlagIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard value={resources} label="Resources">
            <StorageIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard value={literals} label="Literals">
            <BarChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard value={predicates} label="Properties">
            <BarChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard
            value={statistics.distinctResources}
            label="Distinct Resources"
          >
            <BarChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard
            value={statistics.distinctLiterals}
            label="Distinct Literals"
          >
            <BarChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
          <StatCard
            value={statistics.distinctPredicates}
            label="Distinct Properties"
          >
            <BarChartIcon sx={{ fontSize: 40, color: '#c0392b' }} />
          </StatCard>
        </Stack>

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
