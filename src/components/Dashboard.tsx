import { useEffect, useState } from 'react';
import fetchSPARQLData from '../helpers/fetch_query';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import { Box } from '@mui/system';

interface OrkgData {
  [key: string]: unknown[]; // Make this dynamic, allowing different keys for each query
}

const Dashboard = () => {
  const [orkgData, setOrkgData] = useState<OrkgData>({});

  useEffect(() => {
    const fetchData = async () => {
      const dataEntries = await Promise.all(
        Object.keys(SPARQL_QUERIES).map(async (query) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-expect-error
          const data = await fetchSPARQLData(SPARQL_QUERIES[query]);
          return { [query]: data };
        })
      );

      // Merge all fetched data into a single object
      const newData = Object.assign({}, ...dataEntries);

      // Update state properly
      setOrkgData(newData);
    };

    fetchData();
  }, []);

  if (Object.keys(orkgData).length === 0) {
    return <div>Loading...</div>;
  }
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

    </Box>
  );
};

export default Dashboard;
