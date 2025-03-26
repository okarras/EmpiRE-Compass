import Dashboard from './components/Dashboard';
import Box from '@mui/material/Box';
import './main.css';
import Header from './components/Header';

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
    </Box>
  );
}

export default App;
