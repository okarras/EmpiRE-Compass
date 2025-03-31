import Question from './Question';
import { queries } from '../constants/queries_chart_info';
import { Box } from '@mui/system';
import { Divider } from '@mui/material';

const Dashboard = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        flexGrow: 1,
        flexDirection: 'column',
      }}
    >
      {queries.map((query, index) => (
        <>
          <Question key={index} query={query} />
          <Divider
            variant="fullWidth"
            sx={{
              backgroundColor: 'black',
            }}
          />
        </>
      ))}
    </Box>
  );
};

export default Dashboard;
