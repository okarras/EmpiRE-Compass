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
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import FlagIcon from '@mui/icons-material/Flag';
import StorageIcon from '@mui/icons-material/Storage';
import BarChartIcon from '@mui/icons-material/BarChart';
import StatisticsPageLoadingSkeleton from '../components/StatisticsPageLoadingSkeleton';

interface VenueData {
  venue: string;
  paperCount: number;
}

interface StatisticsData {
  paperCount: number;
  tripleCount: number;
  resourceCount: number;
  literalCount: number;
  propertyCount: number;
  perVenueData: Array<VenueData>;
  venueCount: number;
  distinctResourceCount: number;
  distinctLiteralCount: number;
  distinctPropertyCount: number;
}

const DEFAULT_STATS: StatisticsData = {
  paperCount: 0,
  tripleCount: 0,
  resourceCount: 0,
  literalCount: 0,
  propertyCount: 0,
  perVenueData: [],
  venueCount: 0,
  distinctResourceCount: 0,
  distinctLiteralCount: 0,
  distinctPropertyCount: 0,
};

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData>(DEFAULT_STATS);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.all(
          Object.values(STATISTICS_SPARQL_QUERIES).map((query) =>
            fetchSPARQLData(query)
          )
        );

        const [
          paperData,
          tripleData,
          resourcesData,
          literalsData,
          propertiesData,
          perVenueData,
          venuesData,
        ] = results;

        setStatistics({
          paperCount: Number(paperData[0]?.paper_count ?? 0),
          tripleCount: Number(tripleData[0]?.tripleCount ?? 0),
          resourceCount: Number(resourcesData[0]?.resourceCount ?? 0),
          literalCount: Number(literalsData[0]?.literalCount ?? 0),
          propertyCount: Number(propertiesData[0]?.propertyCount ?? 0),
          perVenueData: perVenueData.map((row: VenueData) => ({
            venue: row.venue,
            paperCount: Number(row.paperCount ?? 0),
          })),
          venueCount: Number(venuesData[0]?.venueCount ?? 0),
          distinctResourceCount: Number(
            resourcesData[0]?.distinctResourceCount ?? 0
          ),
          distinctLiteralCount: Number(
            literalsData[0]?.distinctLiteralCount ?? 0
          ),
          distinctPropertyCount: Number(
            propertiesData[0]?.distinctPropertyCount ?? 0
          ),
        });
      } catch (error) {
        console.error('Error fetching SPARQL statistics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <StatisticsPageLoadingSkeleton />;

  const {
    paperCount,
    tripleCount,
    resourceCount,
    literalCount,
    propertyCount,
    venueCount,
    perVenueData: papersPerVenue,
  } = statistics;

  return (
    <ThemeProvider theme={theme}>
      <Container sx={{ mt: 8 }}>
        <Stack direction="row" flexWrap="wrap" spacing={3} useFlexGap mb={4}>
          <StatCard icon={FeedIcon} value={paperCount} label="Papers" />
          <StatCard
            icon={BubbleChartIcon}
            value={tripleCount}
            label="Triples"
          />
          <StatCard icon={FlagIcon} value={venueCount} label="Venues" />
          <StatCard
            icon={StorageIcon}
            value={resourceCount}
            label="Resources"
          />
          <StatCard icon={BarChartIcon} value={literalCount} label="Literals" />
          <StatCard
            icon={BarChartIcon}
            value={propertyCount}
            label="Properties"
          />
          <StatCard
            icon={BarChartIcon}
            value={statistics.distinctResourceCount}
            label="Distinct Resources"
          />
          <StatCard
            icon={BarChartIcon}
            value={statistics.distinctLiteralCount}
            label="Distinct Literals"
          />
          <StatCard
            icon={BarChartIcon}
            value={statistics.distinctPropertyCount}
            label="Distinct Properties"
          />
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
