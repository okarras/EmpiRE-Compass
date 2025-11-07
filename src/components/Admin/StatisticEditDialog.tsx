import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { StatisticData } from '../../firestore/TemplateManagement';

interface StatisticEditDialogProps {
  open: boolean;
  statistic: StatisticData | null;
  onClose: () => void;
  onSave: (statistic: StatisticData) => void;
}

const StatisticEditDialog = ({
  open,
  statistic,
  onClose,
  onSave,
}: StatisticEditDialogProps) => {
  const [form, setForm] = useState<StatisticData>({
    id: '',
    name: '',
    sparqlQuery: '',
  });

  useEffect(() => {
    if (open && statistic) {
      setForm(statistic);
    } else if (open && !statistic) {
      setForm({
        id: '',
        name: '',
        sparqlQuery: '',
      });
    }
  }, [open, statistic]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {statistic ? 'Edit Statistic' : 'Add New Statistic'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Statistic ID"
            fullWidth
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            helperText="e.g., PAPERS_QUERY"
          />
          <TextField
            label="Name"
            fullWidth
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={form.description || ''}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />
          <TextField
            label="SPARQL Query"
            fullWidth
            multiline
            rows={8}
            value={form.sparqlQuery}
            onChange={(e) =>
              setForm({
                ...form,
                sparqlQuery: e.target.value,
              })
            }
            helperText="Required: Paste the SPARQL query here"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onSave(form)}
          variant="contained"
          sx={{
            backgroundColor: '#e86161',
            '&:hover': { backgroundColor: '#d55555' },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatisticEditDialog;
