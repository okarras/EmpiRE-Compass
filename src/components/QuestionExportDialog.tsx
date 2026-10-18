import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface QuestionExportDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

const QuestionExportDialog = ({
  open,
  onClose,
  title = 'Export question',
}: QuestionExportDialogProps) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="sm"
    aria-labelledby="question-export-title"
  >
    <DialogTitle id="question-export-title">{title}</DialogTitle>

    <DialogContent>
      <DialogContentText>
        Export options will be added in the next step.
      </DialogContentText>
    </DialogContent>

    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" disabled>
        Export
      </Button>
    </DialogActions>
  </Dialog>
);

export default QuestionExportDialog;
