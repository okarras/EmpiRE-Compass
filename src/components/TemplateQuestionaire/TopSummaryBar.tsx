import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const TopSummaryBar: React.FC<{
  templateSpec: any;
  requiredSummary: {
    totalRequired: number;
    answeredRequired: number;
    perSection: any[];
  };
  exportAnswers: () => void;
  missingCount: number;
  onValidate: () => void;
}> = ({
  templateSpec,
  requiredSummary,
  exportAnswers,
  missingCount,
  onValidate,
}) => {
  return (
    <Paper variant="outlined" sx={{ p: 1, mx: 0, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {templateSpec?.template ?? 'Template'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {templateSpec?.version ? `v${templateSpec.version}` : ''}
          </Typography>
        </Box>

        <Chip
          icon={<CheckCircleOutlineIcon />}
          label={`${requiredSummary.answeredRequired}/${requiredSummary.totalRequired} required`}
          variant="outlined"
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportAnswers}
          >
            Export
          </Button>
          <Button
            size="small"
            color={missingCount ? 'error' : 'primary'}
            variant="contained"
            onClick={onValidate}
          >
            Validate {missingCount > 0 ? `(${missingCount})` : ''}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default TopSummaryBar;
