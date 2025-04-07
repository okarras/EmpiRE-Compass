import Dashboard from './components/Dashboard';
import Box from '@mui/material/Box';
import './main.css';
import Header from './components/Header';
import { Fab } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ScrollTop from './components/ScrollTop';

function App() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#F8F8F8',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Header />
      <Dashboard />
      <ScrollTop>
        <Fab size="small" aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </Box>
  );
}

export default App;
