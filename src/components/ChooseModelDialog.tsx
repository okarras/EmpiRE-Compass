import { Dialog, DialogTitle, DialogContent, TextField } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setModel, setApiProvider, setApiKey } from '../store/slices/aiSlice';

const ChooseModelDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const model = useAppSelector((state) => state.ai.model);
  const apiProvider = useAppSelector((state) => state.ai.apiProvider);
  const apiKey = useAppSelector((state) => state.ai.apiKey);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Choose AI Model</DialogTitle>
      <DialogContent>
        <TextField
          label="Model"
          value={model}
          onChange={(e) => dispatch(setModel(e.target.value))}
        />
        <TextField
          label="API Provider"
          value={apiProvider}
          onChange={(e) =>
            dispatch(setApiProvider(e.target.value as 'openai' | 'groq'))
          }
        />
        <TextField
          label="API Key"
          value={apiKey}
          onChange={(e) => dispatch(setApiKey(e.target.value))}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ChooseModelDialog;
