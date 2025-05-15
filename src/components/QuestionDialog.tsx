import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { useEffect, useState } from 'react';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Query } from '../constants/queries_chart_info';
import Question from './Question';

interface Props {
  questionData: Record<string, unknown>[];
  query: Query;
  chartData: Record<string, unknown>[];
  normalized: boolean;
  setNormalized: React.Dispatch<React.SetStateAction<boolean>>;
}

const QuestionDialog = (props: Props) => {
  const { questionData, query, chartData, normalized, setNormalized } = props;
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
          <Question
            chartData={chartData}
            query={query}
            questionData={questionData}
            normalized={normalized}
            setNormalized={setNormalized}
          />
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
