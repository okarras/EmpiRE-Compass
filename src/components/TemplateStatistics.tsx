import { useState, useEffect } from 'react';
import { Stack, CircularProgress, Box, Typography } from '@mui/material';
import CRUDStatistics from '../firestore/CRUDStatistics';
import { getTemplateConfig } from '../constants/template_config';
import fetchSPARQLData from '../helpers/fetch_query';

interface TemplateStatisticsProps {
  templateId: string;
  compact?: boolean; // If true, shows inline format like "777 Papers 2 Venues..."
  onStatisticsChange?: (stats: StatisticsData) => void;
}

interface StatisticsData {
  paperCount: number;
  total_resources: number;
  total_literals: number;
  total_predicates: number;
  total_statements: number;
  venueCount: number;
  global_distinct_resources: number;
  global_distinct_literals: number;
  global_distinct_predicates: number;
}

const DEFAULT_STATS: StatisticsData = {
  paperCount: 0,
  total_resources: 0,
  total_literals: 0,
  total_predicates: 0,
  total_statements: 0,
  venueCount: 0,
  global_distinct_resources: 0,
  global_distinct_literals: 0,
  global_distinct_predicates: 0,
};

const TemplateStatistics = ({
  templateId,
  compact = false,
  onStatisticsChange,
}: TemplateStatisticsProps) => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData>(DEFAULT_STATS);

  useEffect(() => {
    // Reset loading state when template changes
    setLoading(true);
    setStatistics(DEFAULT_STATS);

    const fetchData = async () => {
      try {
        // First, try to get cached statistics from Firebase
        const cachedStats = await CRUDStatistics.getStatistics(templateId);

        if (cachedStats) {
          const stats: StatisticsData = {
            paperCount: cachedStats.paperCount || 0,
            total_resources: cachedStats.total_resources || 0,
            total_literals: cachedStats.total_literals || 0,
            total_predicates: cachedStats.total_predicates || 0,
            total_statements: cachedStats.total_statements || 0,
            venueCount: cachedStats.venueCount || 0,
            global_distinct_resources:
              cachedStats.global_distinct_resources || 0,
            global_distinct_literals: cachedStats.global_distinct_literals || 0,
            global_distinct_predicates:
              cachedStats.global_distinct_predicates || 0,
          };
          setStatistics(stats);
          onStatisticsChange?.(stats);
          setLoading(false);
          return;
        }

        // If no cached stats, fetch from SPARQL (this is slower)
        const templateConfig = getTemplateConfig(templateId);
        const STATISTICS_SPARQL_QUERIES = templateConfig.statisticsSparql;

        const results = await Promise.all(
          Object.values(STATISTICS_SPARQL_QUERIES).map((query) =>
            fetchSPARQLData(query as string)
          )
        );

        const [paperData, , , , , , venuesData] = results;

        const stats: StatisticsData = {
          ...DEFAULT_STATS,
          paperCount: Number(paperData[0]?.paper_count ?? 0),
          venueCount: Number(venuesData[0]?.venueCount ?? 0),
        };

        setStatistics(stats);
        onStatisticsChange?.(stats);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [templateId, onStatisticsChange]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        {!compact && (
          <Typography variant="body2" color="text.secondary">
            Loading statistics...
          </Typography>
        )}
      </Box>
    );
  }

  if (compact) {
    // Compact inline format: "777 Papers 2 Venues 75,718 Resources..."
    return (
      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        sx={{ alignItems: 'center' }}
      >
        <Typography variant="body2" component="span">
          {statistics.paperCount.toLocaleString()} Papers
        </Typography>
        <Typography variant="body2" component="span">
          {statistics.venueCount.toLocaleString()} Venues
        </Typography>
        <Typography variant="body2" component="span">
          {statistics.total_resources.toLocaleString()} Resources
        </Typography>
        <Typography variant="body2" component="span">
          {statistics.total_literals.toLocaleString()} Literals
        </Typography>
        <Typography variant="body2" component="span">
          {statistics.total_predicates.toLocaleString()} Properties
        </Typography>
        <Typography variant="body2" component="span">
          {statistics.total_statements.toLocaleString()} Total Statements
        </Typography>
        <Typography variant="body2" component="span">
          {statistics.global_distinct_resources.toLocaleString()} Distinct
          Resources
        </Typography>
        <Typography variant="body2" component="span">
          {statistics.global_distinct_literals.toLocaleString()} Distinct
          Literals
        </Typography>
        <Typography variant="body2" component="span">
          {statistics.global_distinct_predicates.toLocaleString()} Distinct
          Properties
        </Typography>
      </Stack>
    );
  }

  // Full format with labels (can be customized)
  return (
    <Stack spacing={1}>
      <Typography variant="body2">
        Papers: {statistics.paperCount.toLocaleString()}
      </Typography>
      <Typography variant="body2">
        Venues: {statistics.venueCount.toLocaleString()}
      </Typography>
      <Typography variant="body2">
        Resources: {statistics.total_resources.toLocaleString()}
      </Typography>
      <Typography variant="body2">
        Literals: {statistics.total_literals.toLocaleString()}
      </Typography>
      <Typography variant="body2">
        Properties: {statistics.total_predicates.toLocaleString()}
      </Typography>
    </Stack>
  );
};

export default TemplateStatistics;
