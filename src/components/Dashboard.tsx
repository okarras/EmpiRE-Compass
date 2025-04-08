import Question from './Question';
import { queries } from '../constants/queries_chart_info';
import { Box } from '@mui/system';

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
          <div
            style={{
              width: '92%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              padding: '16px',
            }}
            id={`question-${query.id}`}
          >
            <Question key={index} query={query} />
          </div>
        </>
      ))}
    </Box>
  );
};

export default Dashboard;
