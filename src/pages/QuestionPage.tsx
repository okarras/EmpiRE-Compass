import { Container, ThemeProvider } from '@mui/material';
import Question from '../components/Question';
import { useParams } from 'react-router';
import { queries } from '../constants/queries_chart_info';
import theme from '../utils/theme';

const QuestionPage = () => {
  const params = useParams();
  const id = params.id;

  const targetQuery = queries.find((query) => query.id == Number(id));

  if (!targetQuery) {
    return <div>Query not found</div>;
  }
  return (
    <ThemeProvider theme={theme}>
      <Container sx={{ mt: 8, height: '100vh' }}>
        <Question query={targetQuery} accordion={false} />
      </Container>
    </ThemeProvider>
  );
};

export default QuestionPage;
