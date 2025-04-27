import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import { useEffect, useState } from 'react';
import BarChartIcon from '@mui/icons-material/BarChart';
import QuestionInformation from './QuestionInformation';
import CustomBarChart from './CustomCharts/CustomBarChart';
import MuiDataGrid from './CustomGrid';
import { Query } from '../constants/queries_chart_info';

interface Props {
  questionData: Record<string, unknown>[];
  query: Query;
  chartData: Record<string, unknown>[];
}

const QuestionDialog = (props: Props) => {
  const { questionData, query, chartData } = props;
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // useEffect(() => {
  //   if (open) {
  //     query.additionalData?.charts?.forEach((chart) => {});
  //   }
  // }, [open]);

  return (
    <>
      <Button
        startIcon={<BarChartIcon />}
        variant="outlined"
        onClick={handleClickOpen}
        sx={{ color: '#e86161', borderColor: '#e86161', marginLeft: '10px' }}
        size="small"
      >
        Additional Information
      </Button>

      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          <h2>{`${query.id}- ${query.dataAnalysisInformation.question}`}</h2>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <QuestionInformation
              information={query.dataAnalysisInformation.questionExplanation}
              label="Explanation of the Competency Question"
            />
            <QuestionInformation
              information={
                query.dataAnalysisInformation.requiredDataForAnalysis
              }
              label="Required Data for Analysis"
            />
            <QuestionInformation
              information={query.dataAnalysisInformation.dataAnalysis}
              label="Data Analysis"
            />
            <QuestionInformation
              information={query.dataAnalysisInformation.dataInterpretation}
              label="Data Interpretation"
            />
          </DialogContentText>
          <Box>
            {query.additionalData?.charts?.map((chart) => (
              <CustomBarChart
                dataset={chartData}
                chartSetting={chart.chartSettings}
                question_id={chart.uid}
                normalized={false}
                loading={false}
              />
            ))}
          </Box>
          <MuiDataGrid questionData={questionData} />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            autoFocus
            variant="contained"
            color="error"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuestionDialog;
