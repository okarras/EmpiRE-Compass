import QuestionAccordion from './QuestionAccordion';
import { queries, Query } from '../constants/queries_chart_info';
import { Box } from '@mui/system';
import { useEffect, useState } from 'react';
import CRUDQuestions from '../firestore/CRUDQuestions';

const Dashboard = () => {
  const [questions, setQuestions] = useState<Query[]>([]);
  useEffect(() => {
    CRUDQuestions.getQuestions().then((questions) => {
      const finalQuestions: Query[] = questions.map((question) => {
        const targetQuery = queries.find((query) => query.uid === question.uid);

        if (!targetQuery) {
          console.error(`Query with uid ${question.uid} not found.`);
          return question as Query;
        }

        return {
          ...targetQuery,
          ...question,
        } as Query;
      });

      // Sort questions by their id
      finalQuestions.sort((a, b) => {
        const idA = a.id;
        const idB = b.id;
        return idA - idB;
      });

      // this is for firebase backup
      // const json = JSON.stringify(finalQuestions, null, 2);
      // const blob = new Blob([json], { type: 'application/json' });
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = 'questions.json';
      // a.click();
      // URL.revokeObjectURL(url);

      setQuestions(finalQuestions);
    });
  }, []);

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
      {questions.map((query) => (
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
            <QuestionAccordion key={`question-${query.uid}`} query={query} />
          </div>
        </>
      ))}
    </Box>
  );
};

export default Dashboard;
