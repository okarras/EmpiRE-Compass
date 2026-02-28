import {
  Box,
  Typography,
  Button,
  LinearProgress,
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, ExpandMore, Code } from '@mui/icons-material';
import { StatisticData } from '../../firestore/TemplateManagement';
import StatisticsUpdateSection from './StatisticsUpdateSection';

interface StatisticsTabProps {
  statistics: StatisticData[];
  loading: boolean;
  onAddStatistic: () => void;
  onEditStatistic: (statistic: StatisticData) => void;
  onDeleteStatistic: (statisticId: string) => void;
}

const StatisticsTab = ({
  statistics,
  loading,
  onAddStatistic,
  onEditStatistic,
  onDeleteStatistic,
}: StatisticsTabProps) => {
  return (
    <Box sx={{ p: 3 }}>
      <StatisticsUpdateSection />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          mt: 4,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Statistics ({statistics.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAddStatistic}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': { backgroundColor: '#d55555' },
            textTransform: 'none',
          }}
        >
          Add Statistic
        </Button>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <List>
          {statistics.map((statistic) => (
            <Accordion key={statistic.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    width: '100%',
                  }}
                >
                  <Code sx={{ color: '#e86161' }} />
                  <Typography sx={{ flex: 1 }}>{statistic.name}</Typography>
                  <Chip label={statistic.id} size="small" variant="outlined" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {statistic.description && (
                    <>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {statistic.description}
                      </Typography>
                    </>
                  )}

                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    SPARQL Query
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#f5f5f5',
                      p: 2,
                      borderRadius: 1,
                      mb: 2,
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    <code
                      style={{
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {statistic.sparqlQuery}
                    </code>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => onEditStatistic(statistic)}
                      sx={{ textTransform: 'none' }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => onDeleteStatistic(statistic.id)}
                      color="error"
                      sx={{ textTransform: 'none' }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </List>
      )}
    </Box>
  );
};

export default StatisticsTab;
