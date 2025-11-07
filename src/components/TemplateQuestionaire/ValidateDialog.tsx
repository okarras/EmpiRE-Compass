import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

const ValidateDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  validateList: Array<{ id: string; label: string }>;
}> = ({ open, onClose, validateList }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="validate-dialog-title"
    >
      <DialogTitle id="validate-dialog-title">
        {validateList.length === 0
          ? 'All set'
          : `Missing required fields (${validateList.length})`}
      </DialogTitle>

      <DialogContent dividers>
        {validateList.length === 0 ? (
          <Typography>All required fields are filled.</Typography>
        ) : (
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {validateList.slice(0, 200).map((it) => (
              <ListItem key={it.id} divider>
                <ListItemText primary={it.label} />
              </ListItem>
            ))}
            {validateList.length > 200 && (
              <ListItem>
                <ListItemText
                  primary={`...and ${validateList.length - 200} more`}
                />
              </ListItem>
            )}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ValidateDialog;
