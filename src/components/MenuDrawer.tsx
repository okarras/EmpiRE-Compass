import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import {
  Drawer,
  Box,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { queries } from '../constants/queries_chart_info';

const drawerWidth = 240;

interface MenuDrawerProps {
  open: boolean;
  handleDrawerClose: () => void;
}

function MenuDrawer(props: MenuDrawerProps) {
  const { open, handleDrawerClose } = props;

  const handleListItemClick = (id: number) => {
    const element = document.getElementById(`question-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    handleDrawerClose();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      variant="persistent"
      onClose={handleDrawerClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '8px',
        }}
      >
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {queries.map((query) => (
          <ListItem
            key={query.id}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}
            onClick={() => handleListItemClick(query.id)}
          >
            <ListItemText
              primary={`Question ${query.id}`}
              sx={{
                color: '#e86161',
              }}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default MenuDrawer;
