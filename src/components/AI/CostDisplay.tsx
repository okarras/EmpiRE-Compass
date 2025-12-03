import {
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  formatCost,
  aggregateCosts,
  type CostBreakdown,
} from '../../utils/costCalculator';

interface CostDisplayProps {
  costs: CostBreakdown[];
  title?: string;
}

export const CostDisplay = ({
  costs,
  title = 'AI Model Costs',
}: CostDisplayProps) => {
  if (!costs || costs.length === 0) {
    return null;
  }

  const totalCost = aggregateCosts(costs);

  return (
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
      <Accordion defaultExpanded={false} sx={{ boxShadow: 'none' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Chip
              label={`Total: ${formatCost(totalCost.totalCost)}`}
              color={totalCost.totalCost > 0.1 ? 'warning' : 'success'}
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, pt: 2 }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Section</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Model</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Input Tokens</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Output Tokens</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Total Tokens</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Input Cost</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Output Cost</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Total Cost</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {costs.map((cost, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {cost.section || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {cost.model}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cost.provider}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {cost.promptTokens.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {cost.completionTokens.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {cost.totalTokens.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {formatCost(cost.inputCost)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCost(cost.outputCost)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color:
                            cost.totalCost > 0.1
                              ? 'warning.main'
                              : 'text.primary',
                        }}
                      >
                        {formatCost(cost.totalCost)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {costs.length > 1 && (
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell colSpan={2}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Total
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {totalCost.promptTokens.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {totalCost.completionTokens.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {totalCost.totalTokens.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCost(totalCost.inputCost)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCost(totalCost.outputCost)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color:
                            totalCost.totalCost > 0.1
                              ? 'warning.main'
                              : 'success.main',
                        }}
                      >
                        {formatCost(totalCost.totalCost)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default CostDisplay;
