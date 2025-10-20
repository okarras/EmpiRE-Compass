import QuestionAccordion from './QuestionAccordion';
import { Box } from '@mui/system';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  queries as empiricalQueries,
  Query,
} from '../constants/queries_chart_info';
import { queries as nlp4reQueries } from '../constants/queries_nlp4re_chart_info';
import { mergeQueryWithFirebase } from '../helpers/query';
import { FirebaseQuestion } from '../store/slices/questionSlice';
import { useParams } from 'react-router';

const Dashboard = () => {
  const params = useParams();
  const templateId = params.templateId;
  const firebaseQuestions = useSelector<
    RootState,
    Record<string, FirebaseQuestion>
  >(
    (state) =>
      state.questions.firebaseQuestions as Record<string, FirebaseQuestion>
  );

  const sortedFirebaseQuestions = Object.values(firebaseQuestions).sort(
    (a, b) => a.id - b.id
  );

  let queries: Query[];
  if (templateId === 'empirical') {
    queries = empiricalQueries;
  } else if (templateId === 'nlp4re') {
    queries = nlp4reQueries;
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
      {Object.values(sortedFirebaseQuestions).map((query: FirebaseQuestion) => (
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
            {queries.find((q) => q.id === query.id) && (
              <QuestionAccordion
                key={`question-${query.uid}`}
                query={mergeQueryWithFirebase(
                  queries.find((q) => q.uid === query.uid) as unknown as Query,
                  firebaseQuestions[query.uid] as unknown as Record<
                    string,
                    unknown
                  >
                )}
              />
            )}
          </div>
        </>
      ))}
    </Box>
  );
};

export default Dashboard;
