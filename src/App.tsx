import Dashboard from './components/Dashboard';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import  './main.css'

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

      {/* Header Section */}
      <Box
        sx={{
          width: '98%',
          backgroundColor: '#e86161',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          EmpiRE-Compass Dashboard
        </Typography>
      </Box>

      {/* Main Content Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          flexGrow: 1,
          flexDirection: "column"
        }}
      >
        <Dashboard />
      </Box>
    </Box>
  );
}

export default App;