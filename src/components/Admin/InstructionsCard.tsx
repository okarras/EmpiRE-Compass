import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

const InstructionsCard = () => {
  return (
    <Card sx={{ mt: 3, backgroundColor: 'rgba(232, 97, 97, 0.05)' }}>
      <CardContent>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, mb: 2, color: '#e86161' }}
        >
          📋 How to Use
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText
              primary="1. Restore Data"
              secondary="Upload your backup JSON file to populate Firebase with all templates, questions, and statistics"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="2. Select Template"
              secondary="Choose which template you want to manage (Empirical Research Practice or NLP4RE)"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="3. Edit Questions"
              secondary="Edit all fields including HTML content, SPARQL queries, chart settings, and data analysis information"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="4. Manage Statistics"
              secondary="Add, edit, or delete statistical SPARQL queries for the template"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="5. Export/Import"
              secondary="Export templates as JSON for backup or import from JSON files"
            />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
};

export default InstructionsCard;
